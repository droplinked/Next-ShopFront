type SkeletonType = "paragraph" | "line" | "circle" | "image";
export interface IAppSkeleton extends React.HTMLAttributes<HTMLDivElement> {
    maxHeight: string;
    appVariant?: SkeletonType;
    appClassName?: string;
    count?: number;
    seed?: number;
}
