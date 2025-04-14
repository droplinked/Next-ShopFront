import { PopupState } from "material-ui-popup-state/hooks";
import { IAppPopoverState } from "../interface";

export interface IAppPopover extends IAppPopoverState {
    popupState: PopupState
}