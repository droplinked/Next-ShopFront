"use client";

import { cn } from "@/lib/utils/cn/cn";
import Popover from "@mui/material/Popover";
import PopupState, { bindTrigger, bindPopover } from "material-ui-popup-state";
import { IAppPopover } from "./interface";

const AppPopover = ({ trigger, children, appClassName, anchor = { vertical: "bottom", horizontal: "center" }, transform = { vertical: "top", horizontal: "center" }, ...props }: IAppPopover) => {
    return (
        <PopupState variant="popover" popupId="droplinked-popup-popover">
            {(popoverState) => (
                <>
                    <div {...bindTrigger(popoverState)}>{trigger}</div>
                    <Popover sx={{'& .MuiPaper-root': { backgroundColor: "transparent" }}} {...bindPopover(popoverState)} anchorOrigin={anchor} transformOrigin={transform} className={appClassName} {...props}>
                        {children}
                    </Popover>
                </>
            )}
        </PopupState>
    );
}

export default AppPopover