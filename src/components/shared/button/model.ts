import { app_center } from "@/lib/variables/variables";
import { Avenir, roboto } from "@/styles/fonts";
import { cva } from "class-variance-authority";

namespace appButtonModel {
    export const variants = cva(`px-4 ${app_center} disabled:pointer-events-none disabled:bg-secondary`, {
        variants: {
            appVariant: {
                filled: "border-none bg-foreground text-background",
                outlined: "border border-black bg-transparent text-foreground",
            },
            appSize: {
                sm: "py-3 rounded-lg",
                md: "py-2 rounded",
                lg: "py-4 rounded-lg",
            },
            appFont: {
                roboto: roboto.className,
                avenir: Avenir.className,
            },
        },
        defaultVariants: {
            appVariant: "filled",
            appSize: "md",
        },
    });
}
export default appButtonModel;
