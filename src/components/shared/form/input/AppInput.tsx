import { cn } from "@/lib/utils/cn/cn";
import React from "react";
import { IAppInput } from "./interfaces";

const AppInput = ({ right, left, placeholder, appClassName }: IAppInput) => {
    return (
        <div className={`border border-secondary flex items-stretch w-full p-3 rounded-sm overflow-hidden ${appClassName}`}>
            {left && <div className="flex items-center pr-3">{left}</div>}
            <input type="text" placeholder={placeholder} className={cn("block w-full focus:outline-none focus:ring-0 appearance-none placeholder:text-placeholder disabled:cursor-not-allowed disabled:opacity-50")} />
            {right && <div className="flex items-center pl-3">{right}</div>}
        </div>
    );
};

export default AppInput;
