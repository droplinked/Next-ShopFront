import { cn } from "@/lib/utils/cn/cn";
import { IAppButton } from "./interface";
import appButtonModel from "./model";

const AppButton = ({ appVariant = "filled", appSize, appClassName, children, ...props }: IAppButton) => {
    const { variants } = appButtonModel;
    return <button className={cn(variants({ appVariant, appSize }), appClassName)} {...props}>{children}</button>;
};

export default AppButton;
