import { AppTypography } from "@/components/shared";
import AppShow from "@/components/shared/show/AppShow";
import { cn } from "@/lib/utils/cn/cn";
import { app_center, app_vertical } from "@/lib/variables/variables";
import React from "react";

const OrderInformationLayout = ({ header, rows }: { header: string; rows: { key: string; value: string | React.ReactNode; className?: string; asnode?: boolean, condition?: boolean, price?: boolean}[] }) => {
    return (
        <section className={cn(app_vertical, "p-6 gap-6 self-stretch rounded-sm border justify-start")}>
            <AppTypography appClassName="text-base font-semibold text-left w-full">{header}</AppTypography>
            <ul className="flex flex-col items-start self-stretch list-none gap-4">
                {rows?.map(({ key, value, className = "", asnode = false, condition = true, price = false }) => (
                    <AppShow
                        key={key}
                        show={{
                            when: value && condition,
                            then: (
                                <li className={cn(app_center, "w-full justify-between")}>
                                    <AppTypography appClassName="font-normal">{key}</AppTypography>
                                    <AppShow show={{ when: asnode, then: value, else: <AppTypography appClassName={className} price={price}>{value}</AppTypography> }} />
                                </li>
                            ),
                        }}
                    />
                ))}
            </ul>
        </section>
    );
};

export default OrderInformationLayout;
