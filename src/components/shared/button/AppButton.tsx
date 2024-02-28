import { cn } from "@/lib/utils/cn/cn";
import { IAppButton } from "./interface";
import appButtonModel from "./model";
import { app_center } from "@/lib/variables/variables";
import AppButtonLoading from "./loading/AppButtonLoading";

const AppButton = ({ appVariant = "filled", appSize, appFont = 'roboto', appClassName, hasIcon = false, loading = false, children, ...props }: IAppButton) => {
    const { variants } = appButtonModel;
    return <button className={cn(variants({ appVariant, appSize, appFont }), hasIcon && "gap-2 text-nowrap", !loading && "disabled", appClassName)} {...props}>{loading ? <AppButtonLoading appClassName={cn(appVariant === "filled" ? "bg-disabled-foreground" : "bg-disabled-outlined-foreground")}/>: children}</button>;
};

export default AppButton;
