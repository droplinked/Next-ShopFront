type VariantType = "default" | "nav";
type FontType = "avenir" | "roboto";
export interface IAppTypography extends React.HTMLAttributes<HTMLParagraphElement> {
    appClassName?: string;
    appFont?: FontType;
    appVariant?: VariantType;
    price?: boolean;
}
