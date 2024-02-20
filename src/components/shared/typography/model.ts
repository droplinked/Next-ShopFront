import { Avenir, roboto } from "@/app/styles/fonts";
import { cva } from "class-variance-authority";
namespace appTypographyModel {
    export const variants = cva("", {
        variants: {
            appVariant: {
                default: "text-sm font-medium",
                nav: `text-nav text-base font-medium`,
            },
            appFont: {
                roboto: roboto.className,
                avenir: Avenir.className,
            },
        },
        defaultVariants: {
            appVariant: "default",
        },
    });
}

export default appTypographyModel;
