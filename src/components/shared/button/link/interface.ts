import { LinkProps } from "next/link";
import { IAppButton } from "../interface";

export interface IAppLinkButton extends LinkProps{
    children: React.ReactNode;
    disabled?: boolean;
    appButtonProps: IAppButton;
}