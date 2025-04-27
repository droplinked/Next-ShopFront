import { cn } from "@/lib/utils/cn/cn";
import { app_center } from "@/lib/variables/variables";

const AppCollapse = ({ children }: { children: React.ReactNode }) => {
    const _plus_minus = "border border-foreground origin-center transition-transform duration-1000 absolute transform rotate-0 group-open:transform";
    return (
        <details className="group flex flex-col group">
            <summary className="text-lg text-foreground flex items-center gap-4 cursor-pointer">
                <div className={cn("relative w-4 h-4", app_center)}>
                    <div className={cn(_plus_minus, "h-4 group-open:-rotate-90")} />
                    <div className={cn(_plus_minus, "w-4 group-open:-rotate-180 ")} />
                </div>
                Description
            </summary>
            <div className="mt-9 flex flex-wrap overflow-hidden h-full group-open:animate-slide-down">{children}</div>
        </details>
    );
};

export default AppCollapse;
