import React from "react";
import { IAppSeparator } from "./interface";

const AppSeparator = ({appClassName, ...props}:IAppSeparator) => {
    return <hr className="flex-shrink-0 border border-solid border-b border-secondary" {...props}/>
};

export default AppSeparator;
