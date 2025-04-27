type VariantType = "filled" | "outlined";
type SizeType = "lg" | "md" | "sm";
type FontType = "avenir" | "roboto";
export interface IAppButton extends React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>{
    appVariant?: VariantType;
    appClassName?: string;
    appSize?: SizeType;
    loading?: boolean
    appFont?: FontType;
    hasIcon?: boolean;
}
