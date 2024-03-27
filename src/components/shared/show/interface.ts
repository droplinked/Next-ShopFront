type ToShow = {
    when: any;
    then: React.ReactNode;
    else?: React.ReactNode;
};


export interface IAppShow{
    show: ToShow | ToShow[]
}

