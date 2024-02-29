
import { IAppSeparator } from "./interface";
import { cn } from "@/lib/utils/cn/cn";

const AppSeparator = ({appClassName, ...props}:IAppSeparator) => {
    return <hr className={cn("flex-shrink-0 border border-solid border-b border-secondary w-full", appClassName)} {...props}/>
};

export default AppSeparator;
