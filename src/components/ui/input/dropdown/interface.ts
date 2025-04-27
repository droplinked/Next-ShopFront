interface ISelectOptions {
    value: string;
    label: string;
}

export interface IAppDropDownInput {
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
