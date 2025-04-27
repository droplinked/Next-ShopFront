import { MenuProps } from "@mui/material";

type VerticalType = "top" | "center" | "bottom";
type HorizontalType = "left" | "center" | "right";

export interface IAppMenu extends MenuProps {
    trigger: React.ReactNode;
    children: React.ReactNode;
    appClassName?: string;
    anchor?: { vertical: VerticalType; horizontal: HorizontalType };
    transform?: { vertical: VerticalType; horizontal: HorizontalType };
}
