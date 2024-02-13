type VariantType = "default"
export interface IAppTypography extends React.HTMLAttributes<HTMLParagraphElement> {
    appClassName?: string;
    appVariant?: VariantType
}
