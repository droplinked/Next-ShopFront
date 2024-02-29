"use client";
import Popover from "@mui/material/Popover";
import { bindTrigger, bindPopover } from "material-ui-popup-state";
import { IAppPopover } from "./state/interface";

const AppPopover = ({ trigger, children, appClassName, popupState, anchor = { vertical: "bottom", horizontal: "center" }, transform = { vertical: "top", horizontal: "center" }, ...props }: IAppPopover) =>  <><div {...bindTrigger(popupState)}>{trigger}</div><Popover sx={{ "& .MuiPaper-root": { backgroundColor: "transparent" } }} {...bindPopover(popupState)} anchorOrigin={anchor} transformOrigin={transform} className={appClassName} {...props}>{children}</Popover></>;
export default AppPopover