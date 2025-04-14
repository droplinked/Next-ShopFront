type VariantType = "filled" | "none";
type SizeType = "xs" | "sm" | "md";

export interface IAppIconButton extends React.HTMLAttributes<HTMLButtonElement> {
    appClassName?: string;
    appVariant?: VariantType;
    appSize?: SizeType;
}
