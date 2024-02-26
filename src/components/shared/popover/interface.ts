import { PopoverProps } from "@mui/material";
import { PopupState } from "material-ui-popup-state/hooks";

type VerticalType = "top" | "center" | "bottom";
type HorizontalType = "left" | "center" | "right";

export interface IAppPopoverState extends Omit<PopoverProps, 'open'> {
    trigger: React.ReactNode
    children: React.ReactNode;
    appClassName?: string;
    anchor?: { vertical: VerticalType; horizontal: HorizontalType };
    transform?: { vertical: VerticalType; horizontal: HorizontalType };
}

export interface IAppPopover extends IAppPopoverState {
    popupState: PopupState
}