import { IAppSkeleton } from "./interface";
import appSkeletonModel from "./model";
import { cn } from "@/lib/utils/cn/cn";

const AppSkeleton = ({ appVariant = "line", appClassName, maxHeight, count = 5, seed = 10, hard = false, ...props }: IAppSkeleton) => {
    const { variants, _random_paragraph } = appSkeletonModel;
    return (
        <div className={cn("flex flex-col justify-between h-full gap-1", !hard && "w-full")}>
            {appVariant !== "paragraph" 
            ? (<div className={cn(variants({ appVariant }), appClassName)} {...props} />) 
            : (Array.from({ length: count }).map((value: any, index: number) => <div key={index} className={cn(variants({ appVariant: "line" }), _random_paragraph(index + 1, seed), appClassName)} />))}
        </div>
    );
};

export default AppSkeleton;
