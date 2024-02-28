import { cn } from "@/lib/utils/cn/cn";

const AppButtonLoading = ({ appClassName }: { appClassName?: string }) => (
    <div className="flex space-x-1 justify-start items-start bg-transparent">
        <div className={cn("h-2 w-2 bg-white rounded-full animate-dots [animation-delay:-0.3s]", appClassName)}></div>
        <div className={cn("h-2 w-2 bg-white rounded-full animate-dots [animation-delay:-0.15s]", appClassName)}></div>
        <div className={cn("h-2 w-2 bg-white rounded-full animate-dots", appClassName)}></div>
    </div>
);
export default AppButtonLoading;
