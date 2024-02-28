import Link from "next/link";
import React from "react";
import { IAppLinkButton } from "./interface";
import appButtonModel from "../model";
import { cn } from "@/lib/utils/cn/cn";

const AppLinkButton = ({ children, disabled, appButtonProps: { appFont = "roboto", appVariant = "outlined", appSize = "md", hasIcon = false, appClassName }, ...props }: IAppLinkButton) => <Link aria-disabled={disabled} className={cn(appButtonModel.variants({ appVariant, appSize, appFont }), hasIcon && "gap-2 text-nowrap", appClassName)} {...props}>{children}</Link>;
export default AppLinkButton;
