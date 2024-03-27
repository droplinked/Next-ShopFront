import { cn } from "@/lib/utils/cn/cn";
import appTypographyModel from "./model";
import { IAppTypography } from "./interface";

const AppTypography = ({ children, appClassName, appVariant = "default", appFont = "roboto", price = false, usd, ...props }: IAppTypography) => {
    const { variants } = appTypographyModel;
    return (
        <p className={cn(variants({ appVariant, appFont }), appClassName)} {...props}>
            {price ? (
                <>
                    ${children}
                    <span className={cn(usd)}> USD</span>
                </>
            ) : (
                children
            )}
        </p>
    );
};

export default AppTypography;
