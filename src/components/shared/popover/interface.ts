import { PopoverProps } from "@mui/material";

type VerticalType = "top" | "center" | "bottom";
type HorizontalType = "left" | "center" | "right";

export interface IAppPopoverState extends Omit<PopoverProps, 'open'> {
    trigger: React.ReactNode
    children: React.ReactNode;
    appClassName?: string;
    anchor?: { vertical: VerticalType; horizontal: HorizontalType };
    transform?: { vertical: VerticalType; horizontal: HorizontalType };
}

