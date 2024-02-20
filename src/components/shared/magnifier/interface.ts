import { ImageProps } from "next/image";

export interface IAppMagnifier extends ImageProps {
    src: string;
    alt: string;
    magnifierRadius: number;
    zoom?: number;
}
