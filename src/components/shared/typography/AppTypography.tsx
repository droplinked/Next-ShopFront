import { cn } from "@/lib/utils/cn/cn";
import appTypographyModel from "./model";
import { IAppTypography } from "./interface";

const AppTypography = ({ children, appClassName, appVariant = "default", appFont = 'roboto', price = false, ...props }: IAppTypography) => {
    const { variants } = appTypographyModel;
    return (
        <p className={cn(variants({ appVariant, appFont }), appClassName)} {...props}>
            {price ? <p>$ {children} USD</p> :  children }
        </p>
    );
};

export default AppTypography;
