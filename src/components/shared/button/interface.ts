type VariantType = "filled" | "outlined";
type SizeType = "lg" | "md" | "sm" ;
export interface IAppButton extends React.HTMLAttributes<HTMLButtonElement> {
    appVariant?: VariantType;
    appClassName?: string;
    appSize?: SizeType
}
