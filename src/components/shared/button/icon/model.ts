import { cva } from "class-variance-authority";

namespace appIconButtonModel {
    export const variants = cva("flex justify-center items-center border-none", {
        variants: {
            appVariant: {
                filled: "bg-secondary",
                none: "bg-transparent",
            },
            appSize: {
                xs: "h-4 w-4 rounded",
                sm: "h-6 w-6 rounded",
                md: "h-12 w-12 rounded-sm",
            },
        },
        defaultVariants: {
            appVariant: "none",
            appSize: "md",
        },
    });
}

export default appIconButtonModel;
