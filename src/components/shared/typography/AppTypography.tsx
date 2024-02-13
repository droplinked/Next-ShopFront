import { cn } from "@/lib/utils/cn/cn";
import appTypographyModel from "./model";
import { IAppTypography } from "./interface";

const AppTypography = ({ children, appClassName, appVariant = "default", ...props }: IAppTypography) => {
    const { variants } = appTypographyModel;
    return <p className={cn(variants({ appVariant }), appClassName)} {...props}>{children}</p>;
};

export default AppTypography;
