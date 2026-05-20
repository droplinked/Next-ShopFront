#!/usr/bin/env bash
#
# provision-nextshopfront-ecs.sh
#
# One-shot, idempotent provisioner for the Next-ShopFront dedicated ECS
# service (closes #41). Replaces the manual AWS CLI playbook in
# docs/ECS_SPLIT_MIGRATION.md.
#
# Usage:
#   bash scripts/provision-nextshopfront-ecs.sh [dev|prod]
#
# Defaults to "dev". Idempotent — re-runs are safe; every step catches
# AlreadyExists / DuplicateResource and continues.
#
# Cost gate: prompts Y/N before creating the ECS service (the only
# resource that incurs ongoing Fargate cost — ~$18/mo per env).
#
# Logs to /tmp/provision-nextshopfront-<env>-<YYYYMMDD-HHMMSS>.log
#
# Pre-reqs: awscli v2, jq, an AWS profile with ECR/ECS/ELBv2/Route53
# create permissions on account 353643723135 us-east-1.

set -Eeuo pipefail

ENV_ARG="${1:-dev}"
if [[ "$ENV_ARG" != "dev" && "$ENV_ARG" != "prod" ]]; then
  echo "ERROR: arg must be 'dev' or 'prod' (got '$ENV_ARG')" >&2
  exit 2
fi

LOG_FILE="/tmp/provision-nextshopfront-${ENV_ARG}-$(date +%Y%m%d-%H%M%S).log"
exec > >(tee -a "$LOG_FILE") 2>&1

REGION="us-east-1"
ACCOUNT_ID="353643723135"
CLUSTER="droplinked-cluster"
ALB_NAME="ecs-load-balancer"

if [[ "$ENV_ARG" == "prod" ]]; then
  SUFFIX="_prod"
  TG_SUFFIX="-prod"
  HOST="nextshopfront.droplinked.com"
  SOURCE_TASKDEF="shop_droplinked_com"
  SOURCE_SERVICE="shop_droplinked_com_service"
  LISTENER_RULE_PRIORITY=201
else
  SUFFIX=""
  TG_SUFFIX=""
  HOST="nextshopfront-dev.droplinked.com"
  SOURCE_TASKDEF="shopdev_droplinked_com"
  SOURCE_SERVICE="shopdev_droplinked_com_service"
  LISTENER_RULE_PRIORITY=200
fi

ECR_REPO="nextshopfront_droplinked_com${SUFFIX}"
TASKDEF_FAMILY="nextshopfront_droplinked_com${SUFFIX}"
CONTAINER_NAME="nextshopfront_droplinked_com${SUFFIX}"
TG_NAME="tg-nextshopfront-droplinked-com${TG_SUFFIX}"
SERVICE_NAME="nextshopfront_droplinked_com${SUFFIX}_service"

echo "=========================================================="
echo " Next-ShopFront ECS provisioner"
echo " Env:        $ENV_ARG"
echo " Region:     $REGION"
echo " Cluster:    $CLUSTER"
echo " ECR repo:   $ECR_REPO"
echo " Task-def:   $TASKDEF_FAMILY"
echo " TG:         $TG_NAME"
echo " Service:    $SERVICE_NAME"
echo " Host:       $HOST"
echo " Source td:  $SOURCE_TASKDEF"
echo " Log:        $LOG_FILE"
echo "=========================================================="
echo

set -x

############################################
# 1. ECR repository (idempotent)
############################################
if aws ecr describe-repositories --repository-names "$ECR_REPO" --region "$REGION" >/dev/null 2>&1; then
  echo "[skip] ECR repo $ECR_REPO already exists"
else
  aws ecr create-repository \
    --repository-name "$ECR_REPO" \
    --image-scanning-configuration scanOnPush=true \
    --image-tag-mutability MUTABLE \
    --region "$REGION"
fi

# Lifecycle policy is overwrite-safe — re-apply unconditionally
aws ecr put-lifecycle-policy \
  --repository-name "$ECR_REPO" \
  --lifecycle-policy-text '{"rules":[{"rulePriority":1,"description":"Keep last 30 images","selection":{"tagStatus":"any","countType":"imageCountMoreThan","countNumber":30},"action":{"type":"expire"}}]}' \
  --region "$REGION"

############################################
# 2. Task definition — clone source, rename, register
############################################
EXISTING_TD=$(aws ecs describe-task-definition \
  --task-definition "$TASKDEF_FAMILY" \
  --region "$REGION" \
  --query 'taskDefinition.taskDefinitionArn' --output text 2>/dev/null || echo "NONE")

if [[ "$EXISTING_TD" != "NONE" && "$EXISTING_TD" != "None" ]]; then
  echo "[skip] task-def family $TASKDEF_FAMILY already registered: $EXISTING_TD"
else
  TD_FILE="/tmp/${TASKDEF_FAMILY}-taskdef.json"
  aws ecs describe-task-definition \
    --task-definition "$SOURCE_TASKDEF" \
    --region "$REGION" \
    --query 'taskDefinition' --output json \
    | jq --arg fam "$TASKDEF_FAMILY" --arg cn "$CONTAINER_NAME" '
        del(.taskDefinitionArn,.revision,.status,.requiresAttributes,
            .compatibilities,.registeredAt,.registeredBy,.enableFaultInjection)
        | .family = $fam
        | .containerDefinitions[0].name = $cn
      ' > "$TD_FILE"
  aws ecs register-task-definition \
    --cli-input-json "file://${TD_FILE}" \
    --region "$REGION"
fi

############################################
# 3. ALB + target group
############################################
ALB_ARN=$(aws elbv2 describe-load-balancers \
  --names "$ALB_NAME" --region "$REGION" \
  --query 'LoadBalancers[0].LoadBalancerArn' --output text)
ALB_DNS=$(aws elbv2 describe-load-balancers \
  --names "$ALB_NAME" --region "$REGION" \
  --query 'LoadBalancers[0].DNSName' --output text)
ALB_ZONE=$(aws elbv2 describe-load-balancers \
  --names "$ALB_NAME" --region "$REGION" \
  --query 'LoadBalancers[0].CanonicalHostedZoneId' --output text)
VPC_ID=$(aws elbv2 describe-load-balancers \
  --names "$ALB_NAME" --region "$REGION" \
  --query 'LoadBalancers[0].VpcId' --output text)

TG_ARN=$(aws elbv2 describe-target-groups \
  --names "$TG_NAME" --region "$REGION" \
  --query 'TargetGroups[0].TargetGroupArn' --output text 2>/dev/null || echo "NONE")

if [[ "$TG_ARN" == "NONE" || "$TG_ARN" == "None" || -z "$TG_ARN" ]]; then
  TG_ARN=$(aws elbv2 create-target-group \
    --name "$TG_NAME" \
    --protocol HTTP --port 3000 --target-type ip \
    --vpc-id "$VPC_ID" \
    --health-check-path / --health-check-interval-seconds 30 \
    --healthy-threshold-count 2 --unhealthy-threshold-count 3 \
    --region "$REGION" \
    --query 'TargetGroups[0].TargetGroupArn' --output text)
else
  echo "[skip] target group $TG_NAME already exists: $TG_ARN"
fi

############################################
# 4. ALB HTTPS listener rule (host header)
############################################
HTTPS_LISTENER_ARN=$(aws elbv2 describe-listeners \
  --load-balancer-arn "$ALB_ARN" --region "$REGION" \
  --query 'Listeners[?Port==`443`]|[0].ListenerArn' --output text)

EXISTING_RULE=$(aws elbv2 describe-rules \
  --listener-arn "$HTTPS_LISTENER_ARN" --region "$REGION" \
  --query "Rules[?Conditions[?Field=='host-header' && contains(Values, '$HOST')]]|[0].RuleArn" \
  --output text 2>/dev/null || echo "None")

if [[ "$EXISTING_RULE" == "None" || -z "$EXISTING_RULE" ]]; then
  aws elbv2 create-rule \
    --listener-arn "$HTTPS_LISTENER_ARN" \
    --priority "$LISTENER_RULE_PRIORITY" \
    --conditions "Field=host-header,Values=$HOST" \
    --actions "Type=forward,TargetGroupArn=$TG_ARN" \
    --region "$REGION"
else
  echo "[skip] listener rule for host $HOST already exists: $EXISTING_RULE"
fi

############################################
# 5. ECS service — COST-GATED
############################################
EXISTING_SVC=$(aws ecs describe-services \
  --cluster "$CLUSTER" --services "$SERVICE_NAME" --region "$REGION" \
  --query 'services[?status==`ACTIVE`]|[0].serviceName' --output text 2>/dev/null || echo "None")

if [[ "$EXISTING_SVC" != "None" && -n "$EXISTING_SVC" && "$EXISTING_SVC" != "null" ]]; then
  echo "[skip] ECS service $SERVICE_NAME already ACTIVE"
else
  set +x
  echo
  echo "=========================================================="
  echo " COST WARNING"
  echo "=========================================================="
  echo " About to create Fargate ECS service: $SERVICE_NAME"
  echo " Estimated ongoing cost: ~\$18/mo (0.5 vCPU, 1 GB, 24x7)"
  echo " Combined DEV+PROD when both provisioned: ~\$36/mo"
  echo " This is the ONLY cost-incurring step in this script."
  echo "=========================================================="
  read -r -p "Proceed with create-service? (Y/N) " CONFIRM
  if [[ "$CONFIRM" != "Y" && "$CONFIRM" != "y" ]]; then
    echo "Aborted by operator before create-service. ECR/task-def/TG/listener are in place; re-run anytime."
    exit 0
  fi
  set -x

  # Pull network config from source service (subnets, security groups)
  SRC_NET=$(aws ecs describe-services \
    --cluster "$CLUSTER" --services "$SOURCE_SERVICE" --region "$REGION" \
    --query 'services[0].networkConfiguration' --output json)
  SUBNETS=$(echo "$SRC_NET" | jq -r '.awsvpcConfiguration.subnets | join(",")')
  SGS=$(echo "$SRC_NET" | jq -r '.awsvpcConfiguration.securityGroups | join(",")')
  ASSIGN_PUBLIC=$(echo "$SRC_NET" | jq -r '.awsvpcConfiguration.assignPublicIp // "DISABLED"')

  aws ecs create-service \
    --cluster "$CLUSTER" \
    --service-name "$SERVICE_NAME" \
    --task-definition "$TASKDEF_FAMILY" \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[$SUBNETS],securityGroups=[$SGS],assignPublicIp=$ASSIGN_PUBLIC}" \
    --load-balancers "targetGroupArn=$TG_ARN,containerName=$CONTAINER_NAME,containerPort=3000" \
    --deployment-configuration "maximumPercent=200,minimumHealthyPercent=100,deploymentCircuitBreaker={enable=true,rollback=true}" \
    --region "$REGION"
fi

############################################
# 6. Route53 A-alias
############################################
ZONE_ID=$(aws route53 list-hosted-zones-by-name \
  --dns-name "droplinked.com." \
  --query 'HostedZones[?Name==`droplinked.com.`]|[0].Id' --output text \
  | sed 's|/hostedzone/||')

CHANGE_BATCH=$(jq -n \
  --arg name "$HOST." \
  --arg zone "$ALB_ZONE" \
  --arg dns "$ALB_DNS" \
  '{Changes:[{Action:"UPSERT",ResourceRecordSet:{Name:$name,Type:"A",AliasTarget:{HostedZoneId:$zone,DNSName:$dns,EvaluateTargetHealth:true}}}]}')

aws route53 change-resource-record-sets \
  --hosted-zone-id "$ZONE_ID" \
  --change-batch "$CHANGE_BATCH"

set +x

############################################
# Done — print rollback commands
############################################
echo
echo "=========================================================="
echo " PROVISIONING COMPLETE — env=$ENV_ARG"
echo "=========================================================="
echo " Log:        $LOG_FILE"
echo " Hostname:   https://$HOST/"
echo " Service:    $SERVICE_NAME (desired=1)"
echo " Target grp: $TG_ARN"
echo
echo " Next steps:"
echo "   1. Wait for ECS task to reach RUNNING (aws ecs describe-services ...)."
echo "   2. curl -I https://$HOST/  → expect 200."
echo "   3. Run commerce-smoke 8/8 on $HOST."
echo "   4. Merge PR #43 → workflow deploys to $SERVICE_NAME."
echo
echo "=========================================================="
echo " ROLLBACK (run if new service is unhealthy)"
echo "=========================================================="
cat <<EOF
# Scale service to 0 (stops cost immediately)
aws ecs update-service --cluster $CLUSTER --service $SERVICE_NAME --desired-count 0 --region $REGION

# Delete service
aws ecs delete-service --cluster $CLUSTER --service $SERVICE_NAME --force --region $REGION

# Delete listener rule
RULE_ARN=\$(aws elbv2 describe-rules --listener-arn $HTTPS_LISTENER_ARN --region $REGION \\
  --query "Rules[?Conditions[?Field=='host-header' && contains(Values, '$HOST')]]|[0].RuleArn" --output text)
aws elbv2 delete-rule --rule-arn "\$RULE_ARN" --region $REGION

# Delete target group
aws elbv2 delete-target-group --target-group-arn $TG_ARN --region $REGION

# (Optional) Delete Route53 alias
# Edit the A record back to the previous shared ALB target, or DELETE via change-resource-record-sets.

# ECR repo + task-def can be left in place — harmless when unused, avoids recreate on retry.
EOF
echo "=========================================================="
