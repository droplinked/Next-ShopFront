import { cn } from "@/lib/utils/cn/cn";
import { IAppButton } from "./interface";
import appButtonModel from "./model";

const AppButton = ({ appVariant = "filled", appSize, appFont = 'roboto', appClassName, hasIcon = false, children, ...props }: IAppButton) => {
    const { variants } = appButtonModel;
    return <button className={cn(variants({ appVariant, appSize, appFont }), hasIcon && "flex items-center justify-center gap-2 text-nowrap", appClassName)} {...props}>{children}</button>;
};

export default AppButton;
