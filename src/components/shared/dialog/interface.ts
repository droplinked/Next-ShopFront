import { DialogProps } from "@mui/material";
import { ReactNode } from "react";

export interface IAppDialog extends Omit<DialogProps, "open"> {
    trigger: ReactNode;
}
