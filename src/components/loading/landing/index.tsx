import { AppSkeleton } from "@/components/shared";
import { cn } from "@/lib/utils/cn/cn";
import { app_vertical } from "@/lib/variables/variables";

export const L_Products = ({m}:{m?: boolean}) => <div className={cn("grid grid-cols-4 gap-6 w-full h-full", m && "mt-6")}>{Array.from({ length: 10 })?.map((value: any, index: number) => (<div key={index} className={cn(app_vertical, "justify-start gap-4 h-full")}><AppSkeleton appVariant="image" maxHeight="80%" /><AppSkeleton appVariant="paragraph" maxHeight="100px" count={5} seed={index + 1} /></div>))}</div>;
