import { cn } from "@/lib/utils/cn/cn";
import React from "react";
import { IAppInput } from "./interfaces";
import { Avenir } from "@/app/styles/fonts";

const AppInput = ({ right, left, placeholder, inputType = "text", appClassName }: IAppInput) => {
    return (
        <div className={cn("border border-secondary flex items-stretch w-full p-3 rounded-sm overflow-hidden", appClassName)}>
            {left && <div className="flex items-center pr-3">{left}</div>}
            <input type={inputType} placeholder={placeholder} className={cn(`block bg-transparent w-full focus:outline-none focus:ring-0 appearance-none placeholder:text-placeholder disabled:cursor-not-allowed disabled:opacity-50 ${Avenir.className}`)} />
            {right && <div className="flex items-center pl-3">{right}</div>}
        </div>
    );
};

export default AppInput;
