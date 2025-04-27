import { cva } from "class-variance-authority";

namespace appSkeletonModel {
    const vars = ["h-1.5 max-w-36", "h-1.5 max-w-22", "h-1 max-w-32", "h-1 max-w-16", "h-1 max-w-36", "h-1.5 max-w-16", "h-1 max-w-20", "h-1 max-w-24", "h-1.5 max-w-11", "h-1 max-w-28", "h-1 max-w-14", "h-1.5 max-w-18", "h-1 max-w-22"];
    export const _random_paragraph = (index: number, seed: number) => vars[parseInt((Math.imul(3423, seed) * (seed * index) % vars.length).toFixed(2))];

    export const variants = cva("bg-gray-300 animate-pulse", {
        variants: {
            appVariant: {
                paragraph: "rounded",
                line: "h-2 rounded h-auto w-full",
                circle: "w-10 h-10 rounded-full",
                image: "w-full h-full rounded-lg aspect-square",
            },
        },
        defaultVariants: {
            appVariant: "line",
        },
    });
}
export default appSkeletonModel;
