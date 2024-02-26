import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import PopupState, { bindDialog, bindTrigger } from "material-ui-popup-state";
import { IAppDialog } from "./interface";

const AppDialog = ({ trigger, children, ...props }: IAppDialog) => {
    return (
        <PopupState variant="dialog" popupId="droplinked-popup-dialog">
            {(dialogState) => (
                <>
                    <div {...bindTrigger(dialogState)}>{trigger}</div>
                    <Dialog {...bindDialog(dialogState)} keepMounted {...props}>{children}</Dialog>
                </>
            )}
        </PopupState>
    );
};

export default AppDialog;
