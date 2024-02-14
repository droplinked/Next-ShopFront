import { cva } from "class-variance-authority";

namespace appButtonModel {
    export const variants = cva("px-4 inline-flex items-center justify-center disabled:pointer-events-none disabled:bg-secondary", {
        variants: {
            appVariant: {
                filled: "border-none bg-foreground ",
                outlined: "border border-black bg-transparent",
            },
            appSize: {
                sm: "py-3 rounded-lg",
                md: "py-2 rounded",
                lg: "py-4 rounded-lg",
            },
        },
        defaultVariants: {
            appVariant: "filled",
            appSize: "md",
        },
    });
}
export default appButtonModel;
