import { cn } from "@/lib/utils/cn/cn";
import { IAppInput } from "./interfaces";
import { Avenir } from "@/styles/fonts";
import { app_vertical } from "@/lib/variables/variables";
import AppTypography from "../../typography/AppTypography";

const AppInput = ({ right, left, placeholder, label, inputType = "text", appClassName, ...props }: IAppInput) => <div className={cn(app_vertical, "w-full gap-2 items-start")}>{label && <AppTypography appClassName="font-normal text-sm">{label}</AppTypography>}<div className={cn("border border-secondary flex items-stretch w-full p-3 rounded-sm overflow-hidden", appClassName)}>{left && <div className="flex items-center pr-3">{left}</div>}<input type={inputType} placeholder={placeholder} className={cn(`block bg-transparent w-full focus:outline-none focus:ring-0 appearance-none placeholder:text-placeholder disabled:cursor-not-allowed disabled:opacity-50 text-sm ${Avenir.className}`)}{...props}/>{right && <div className="flex items-center pl-3">{right}</div>}</div></div>
export default AppInput
