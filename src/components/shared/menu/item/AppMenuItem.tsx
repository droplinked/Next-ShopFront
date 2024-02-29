import { ListItemIcon, MenuItem } from "@mui/material";
import { IAppMenuItem } from "./interface";
import { AppTypography } from "../..";

const AppMenuItem = ({ label, decoration, pressed }: IAppMenuItem) => {
    return (
        <MenuItem onClick={pressed} className="relative flex items-center text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
            {decoration && <ListItemIcon>{decoration}</ListItemIcon>}
            {label && <AppTypography>{label}</AppTypography>}
        </MenuItem>
    );
};

export default AppMenuItem;
