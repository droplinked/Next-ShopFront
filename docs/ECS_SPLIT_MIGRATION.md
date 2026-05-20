# ECS split migration — Next-ShopFront dedicated service (closes #41)

## Why

Both `droplinked-shop-builder` and `Next-ShopFront` historically targeted
the same ECS service/ECR repo/task-def/container/ALB target group:

| Env | Shared resource                                     |
| --- | --------------------------------------------------- |
| DEV | `shopdev_droplinked_com_service` / `shopdev_droplinked_com` ECR  |
| PROD | `shop_droplinked_com_service` / `shop_droplinked_com` ECR        |

Whichever repo merged last overwrote the other. Two repos hardening in
parallel (Sentry, CSP, source-map upload) trampled each other.

This PR re-points **Next-ShopFront** workflows at dedicated AWS
resources. **shop-builder workflows are unchanged** — it keeps the
existing shared names for backward compat.

## New resource names

| Env | ECR repo | ECS service | Task definition | Container name | ALB target group | DNS |
| --- | --- | --- | --- | --- | --- | --- |
| DEV  | `nextshopfront_droplinked_com`      | `nextshopfront_droplinked_com_service`      | `nextshopfront_droplinked_com`      | `nextshopfront_droplinked_com`      | `tg-nextshopfront-droplinked-com`      | `nextshopfront-dev.droplinked.com` |
| PROD | `nextshopfront_droplinked_com_prod` | `nextshopfront_droplinked_com_prod_service` | `nextshopfront_droplinked_com_prod` | `nextshopfront_droplinked_com_prod` | `tg-nextshopfront-droplinked-com-prod` | `nextshopfront.droplinked.com`     |

## Operator AWS CLI playbook (DO NOT RUN until cost approval)

Run in `us-east-1`. Estimated added cost: see "Cost" section.

> Replace placeholders: `<VPC_ID>`, `<SUBNET_A>`, `<SUBNET_B>`,
> `<TASK_SECURITY_GROUP>`, `<ALB_ARN>`, `<HOSTED_ZONE_ID>`,
> `<TASK_ROLE_ARN>`, `<EXECUTION_ROLE_ARN>`, `<ALB_DNS_NAME>`,
> `<ALB_HOSTED_ZONE_ID>`. Pull current values from
> `aws ecs describe-services --cluster droplinked-cluster --services shopdev_droplinked_com_service`
> for the existing shared service.

### Phase A — DEV

```bash
# 1. Create dedicated ECR repository (DEV)
aws ecr create-repository \
  --repository-name nextshopfront_droplinked_com \
  --image-scanning-configuration scanOnPush=true \
  --image-tag-mutability MUTABLE \
  --region us-east-1

# 2. Set lifecycle policy (keep last 30 images — match shopdev_droplinked_com)
aws ecr put-lifecycle-policy \
  --repository-name nextshopfront_droplinked_com \
  --lifecycle-policy-text '{"rules":[{"rulePriority":1,"description":"Keep last 30 images","selection":{"tagStatus":"any","countType":"imageCountMoreThan","countNumber":30},"action":{"type":"expire"}}]}' \
  --region us-east-1

# 3. Register first task definition (copy from existing shared one, rename)
aws ecs describe-task-definition \
  --task-definition shopdev_droplinked_com \
  --query 'taskDefinition' --output json \
  | jq 'del(.taskDefinitionArn,.revision,.status,.requiresAttributes,.compatibilities,.registeredAt,.registeredBy,.enableFaultInjection)
        | .family = "nextshopfront_droplinked_com"
        | .containerDefinitions[0].name = "nextshopfront_droplinked_com"' \
  > /tmp/nextshopfront-taskdef-dev.json

aws ecs register-task-definition --cli-input-json file:///tmp/nextshopfront-taskdef-dev.json --region us-east-1

# 4. Create ALB target group (DEV)
aws elbv2 create-target-group \
  --name tg-nextshopfront-droplinked-com \
  --protocol HTTP --port 3000 --target-type ip \
  --vpc-id <VPC_ID> \
  --health-check-path / --health-check-interval-seconds 30 \
  --healthy-threshold-count 2 --unhealthy-threshold-count 3 \
  --region us-east-1

# 5. Add listener rule on ALB for host nextshopfront-dev.droplinked.com
aws elbv2 create-rule \
  --listener-arn <ALB_HTTPS_LISTENER_ARN_DEV> \
  --priority 200 \
  --conditions Field=host-header,Values=nextshopfront-dev.droplinked.com \
  --actions Type=forward,TargetGroupArn=<NEW_TG_ARN_FROM_STEP_4> \
  --region us-east-1

# 6. Create ECS service (DEV) — DESIRED COUNT 1, Fargate, awsvpc
aws ecs create-service \
  --cluster droplinked-cluster \
  --service-name nextshopfront_droplinked_com_service \
  --task-definition nextshopfront_droplinked_com \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[<SUBNET_A>,<SUBNET_B>],securityGroups=[<TASK_SECURITY_GROUP>],assignPublicIp=DISABLED}" \
  --load-balancers "targetGroupArn=<NEW_TG_ARN_FROM_STEP_4>,containerName=nextshopfront_droplinked_com,containerPort=3000" \
  --deployment-configuration "maximumPercent=200,minimumHealthyPercent=100,deploymentCircuitBreaker={enable=true,rollback=true}" \
  --region us-east-1

# 7. Route53 A-alias for DEV hostname
aws route53 change-resource-record-sets \
  --hosted-zone-id <HOSTED_ZONE_ID> \
  --change-batch '{"Changes":[{"Action":"UPSERT","ResourceRecordSet":{"Name":"nextshopfront-dev.droplinked.com","Type":"A","AliasTarget":{"HostedZoneId":"<ALB_HOSTED_ZONE_ID>","DNSName":"<ALB_DNS_NAME>","EvaluateTargetHealth":true}}}]}'
```

### Phase B — PROD (mirror of A, suffix `_prod`)

Repeat steps 1–7 with PROD names:

- ECR: `nextshopfront_droplinked_com_prod`
- task-def family: `nextshopfront_droplinked_com_prod` (copy from `shop_droplinked_com`)
- target group: `tg-nextshopfront-droplinked-com-prod`
- ALB listener rule host: `nextshopfront.droplinked.com`
- ECS service: `nextshopfront_droplinked_com_prod_service`

### Phase C — IAM

Verify `arn:aws:iam::353643723135:role/github-actions-deploy` policy
already allows `ecs:UpdateService` / `ecs:RegisterTaskDefinition` /
`ecr:*` on the new resource ARNs. If scoped tightly, add:

```
arn:aws:ecs:us-east-1:353643723135:service/droplinked-cluster/nextshopfront_droplinked_com_service
arn:aws:ecs:us-east-1:353643723135:service/droplinked-cluster/nextshopfront_droplinked_com_prod_service
arn:aws:ecs:us-east-1:353643723135:task-definition/nextshopfront_droplinked_com:*
arn:aws:ecs:us-east-1:353643723135:task-definition/nextshopfront_droplinked_com_prod:*
arn:aws:ecr:us-east-1:353643723135:repository/nextshopfront_droplinked_com
arn:aws:ecr:us-east-1:353643723135:repository/nextshopfront_droplinked_com_prod
```

### Phase D — Workflow merge + smoke

1. Merge this PR.
2. Push to `dev` → `dev.yml` builds + deploys to
   `nextshopfront_droplinked_com_service`.
3. Curl `https://nextshopfront-dev.droplinked.com/` → 200.
4. Run commerce-smoke (storefront browse + add-to-cart + shipping rates
   + plans) against the new DEV host. 8/8 required before LIVE dispatch.
5. `workflow_dispatch` `main.yml` only after DEV is GREEN.

## Cost delta (estimate, us-east-1)

Per-env Fargate task @ 0.5 vCPU / 1 GB / 24x7:

- vCPU: 0.5 × $0.04048/hr × 730 = **~$14.78/mo**
- Memory: 1 × $0.004445/hr × 730 = **~$3.24/mo**
- ALB target group: $0 (uses existing ALB; LCU may tick up marginally)
- ECR storage: <$0.10/mo (30 images × ~200MB × $0.10/GB)

**DEV alone: ~$18/mo. DEV + PROD: ~$36/mo.**

> Crosses the $5/mo threshold per `feedback-actions-budget-elasticity`.
> **Operator authorization required before Phase A step 6 (create-service)
> on either env.** Phases 1–5 (ECR/task-def/TG/listener) are zero-cost
> and safe to pre-provision.

## Rollback

If the new DEV service is unhealthy after merge:

1. Revert this PR (one commit, env-block only).
2. Re-deploy `dev` branch — workflow falls back to
   `shopdev_droplinked_com_service` and shop-builder sharing resumes.
3. Optionally scale the new service to 0 to stop cost:
   `aws ecs update-service --cluster droplinked-cluster --service nextshopfront_droplinked_com_service --desired-count 0`
4. Leave ECR/target-group/listener-rule in place — they're harmless
   when unused and avoid having to recreate on next attempt.

LIVE rollback is the same with `_prod` names. Route53 cutover is the
final irreversible step — keep both old and new R53 records co-existing
for 24h after cutover, swap back by editing the alias if needed.

## Verification post-merge

- [ ] `dev.yml` runs to completion and ECS task is RUNNING
- [ ] `nextshopfront-dev.droplinked.com` returns 200
- [ ] commerce-smoke 8/8 green
- [ ] shop-builder DEV (`dev.droplinked.com`) untouched and still 200
- [ ] CloudWatch logs for the new service show only Next-ShopFront SHAs
