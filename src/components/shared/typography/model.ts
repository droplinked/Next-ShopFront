import { cva } from "class-variance-authority";

namespace appTypographyModel {
    export const variants = cva(
        "text-secondary-foreground text-sm font-medium", 
        {
            variants: {
                appVariant: {
                    default: "",
                },
            },
            defaultVariants: {
                appVariant: "default",
            },
        }
    );
}

export default appTypographyModel;
