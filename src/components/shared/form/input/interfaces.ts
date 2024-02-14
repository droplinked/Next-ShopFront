type InputType = "text" | "search"
export interface IAppInput extends React.HTMLAttributes<HTMLInputElement>{
    right?: React.ReactNode;
    left?: React.ReactNode;
    inputType?: InputType
    placeholder?: string;
    appClassName?: string;
}