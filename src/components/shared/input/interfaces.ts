type InputType = React.HTMLInputTypeAttribute | "search";
export interface IAppInput extends React.InputHTMLAttributes<HTMLInputElement> {
    right?: React.ReactNode;
    left?: React.ReactNode;
    inputType?: InputType;
    placeholder?: string;
    appClassName?: string;
    label?: string;
}

interface ISelectOptions {
    value: string;
    label: string;
}

export interface IAppDropDown {
    options: Array<ISelectOptions>;
    select: any;
    value: ISelectOptions | null;
    name: string;
    id?: string;
    placeholder?: string;
    isLoading?: boolean;
    typing?: Function;
    disabled?: boolean;
    label?: string;
}
