type InputType = React.HTMLInputTypeAttribute | "search";
export interface IAppInput extends React.InputHTMLAttributes<HTMLInputElement> {
    right?: React.ReactNode;
    left?: React.ReactNode;
    inputType?: InputType;
    placeholder?: string;
    appClassName?: string;
    label?: string;
}

