"use-client";
import React from "react";
import { IAppSkeleton } from "./interface";
import appSkeletonModel from "./model";
import { cn } from "@/lib/utils/cn/cn";

const AppSkeleton = ({ appVariant = "line", appClassName, maxHeight, ...props }: IAppSkeleton) => {
    const { variants, random_paragraph } = appSkeletonModel;
    const { count, height } = random_paragraph();
    return (
        <>
            <div className="flex flex-col justify-between w-full" style={{ maxHeight }}>
                {appVariant !== "paragraph" ? (
                    <div className={cn(variants({ appVariant }), appClassName)} {...props} />
                ) : (
                    Array.from({ length: count }).map((value: any, index: number) => (
                        <div key={index} className={cn(variants({ appVariant }), appClassName)} style={{ width: `${random_paragraph().width}%`, height: `${height}%` }} {...props} />
                    ))
                )}
            </div>
        </>
    );
};

export default AppSkeleton;
