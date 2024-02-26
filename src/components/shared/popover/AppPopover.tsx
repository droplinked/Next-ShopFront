"use client";

import Popover from "@mui/material/Popover";
import PopupState, { bindTrigger, bindPopover } from "material-ui-popup-state";
import { IAppPopover, IAppPopoverState } from "./interface";

export const AppPopoverState = ({ trigger, children, appClassName, anchor = { vertical: "bottom", horizontal: "center" }, transform = { vertical: "top", horizontal: "center" }, ...props}: IAppPopoverState) => <PopupState variant="popover" popupId="droplinked-popup-popover">{(popoverState) => <><div {...bindTrigger(popoverState)}>{trigger}</div><Popover sx={{ "& .MuiPaper-root": { backgroundColor: "transparent" } }} {...bindPopover(popoverState)} anchorOrigin={anchor} transformOrigin={transform} className={appClassName} {...props}>{children}</Popover></>}</PopupState>
export const AppPopover = ({ trigger, children, appClassName, popupState, anchor = { vertical: "bottom", horizontal: "center" }, transform = { vertical: "top", horizontal: "center" }, ...props }: IAppPopover) =>  <><div {...bindTrigger(popupState)}>{trigger}</div><Popover sx={{ "& .MuiPaper-root": { backgroundColor: "transparent" } }} {...bindPopover(popupState)} anchorOrigin={anchor} transformOrigin={transform} className={appClassName} {...props}>{children}</Popover></>;
