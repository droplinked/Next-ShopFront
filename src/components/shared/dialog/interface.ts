import { DialogProps } from "@mui/material";
import { ReactNode } from "react";

export interface IAppDialog extends DialogProps {
    children: ReactNode;
    elements: {
        trigger: ReactNode;
        header: ReactNode;
    };
}
