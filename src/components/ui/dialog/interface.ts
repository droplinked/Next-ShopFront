import { DialogActionsProps, DialogContentProps, DialogProps, DialogTitleProps } from "@mui/material";
import { PopupState } from "material-ui-popup-state/hooks";
import { ReactNode } from "react";

export interface IAppDialog extends Omit<DialogProps, "open"> {
    props: {
        dialogState: PopupState
        trigger?: ReactNode;
        title?: DialogTitleProps;
        content?: DialogContentProps;
        actions?: DialogActionsProps;
    };
}
