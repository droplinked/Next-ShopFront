type VariantType = "default" | "nav"
export interface IAppTypography extends React.HTMLAttributes<HTMLParagraphElement> {
    appClassName?: string;
    appVariant?: VariantType
}
