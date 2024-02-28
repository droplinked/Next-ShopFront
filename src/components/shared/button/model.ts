import { app_center } from "@/lib/variables/variables";
import { Avenir, roboto } from "@/styles/fonts";
import { cva } from "class-variance-authority";

namespace appButtonModel {
    export const variants = cva(`px-4 ${app_center} disabled:cursor-not-allowed aria-disabled:cursor-not-allowed`, {
        variants: {
            appVariant: {
                filled: "border-none bg-foreground text-background disabled:text-disabled-foreground disabled:bg-disabled aria-disabled:text-disabled-foreground aria-disabled:bg-disabled",
                outlined: "border border-black bg-transparent text-foreground disabled:border-disabled-outlined-border disabled:text-disabled-outlined-foreground aria-disabled:border-disabled-outlined-border aria-disabled:text-disabled-outlined-foreground",
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
