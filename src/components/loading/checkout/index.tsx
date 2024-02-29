import { AppSkeleton } from "@/components/shared";
import { cn } from "@/lib/utils/cn/cn";
import { app_center, app_vertical } from "@/lib/variables/variables";


const L_Checkout = () => {
    return (
        <div className={cn(app_vertical, "h-full w-full justify-between gap-16")}>
            <div className={cn(app_vertical, "h-full w-full gap-8")}>
                <AppSkeleton appClassName="h-6 w-32" />
                <AppSkeleton appClassName="h-12" />
                <div className={cn(app_center, "w-full h-full gap-6")}>
                    <AppSkeleton appClassName="h-12" />
                    <AppSkeleton appClassName="h-12" />
                </div>
                <div className={cn(app_vertical, "w-full h-full gap-12")}>
                    <AppSkeleton appClassName="h-32 w-full" />
                    <AppSkeleton appClassName="h-32 w-full" />
                </div>
            </div>
            <div className={cn(app_center, "w-full h-full justify-between gap-96")}>
                <AppSkeleton appVariant="image" appClassName="h-8 rounded-sm" />
                <AppSkeleton appVariant="image" appClassName="h-8 rounded-sm" />
            </div>
        </div>
    );
};

export default L_Checkout;
