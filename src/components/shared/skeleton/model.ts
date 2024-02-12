import { cva } from "class-variance-authority";

namespace appSkeletonModel {
    export const random_paragraph = () => {
        const width = Math.floor(Math.random() * (101 - 20) + 20).toString();
        const count = Math.floor(Math.random() * (7 - 3) + 3);
        const height = Math.floor(100 / count - 3).toString();
        return { width, count, height };
    };

    export const variants = cva("bg-gray-300 animate-pulse", {
        variants: {
            appVariant: {
                paragraph: "rounded",
                line: "w-full h-2 rounded",
                circle: "w-10 h-10 rounded-full",
                image: "w-full h-full rounded-lg",
            },
        },
        defaultVariants: {
            appVariant: "line",
        },
    });
}
export default appSkeletonModel;
