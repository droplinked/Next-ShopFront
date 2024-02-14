import { IAppIconButton } from "./interface";
import { cn } from "@/lib/utils/cn/cn";
import appIconButtonModel from "./model";

const AppIconButton = ({ appVariant = "filled", appSize = "md", appClassName, children, ...props }: IAppIconButton) => {
    const { variants } = appIconButtonModel;
    return <button className={cn(variants({ appVariant, appSize }), appClassName)} {...props}>{children}</button>;
};

export default AppIconButton;
