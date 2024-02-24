import AppSkeleton from "@/components/shared/skeleton/AppSkeleton";
import { cn } from "@/lib/utils/cn/cn";
import { app_vertical } from "@/lib/variables/variables";
import React from "react";

export const L_Products = () => <div className="grid grid-cols-4 gap-6 w-full h-full">{Array.from({ length: 10 })?.map((value: any, index: number) => (<div key={index} className={cn(app_vertical, "justify-start gap-4 h-full")}><AppSkeleton appVariant="image" maxHeight="80%" /><AppSkeleton appVariant="paragraph" maxHeight="100px" count={5} seed={index + 1} /></div>))}</div>;
