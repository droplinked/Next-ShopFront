import { Menu, MenuList } from "@mui/material";
import PopupState, { bindMenu, bindTrigger } from "material-ui-popup-state";
import { IAppMenu } from "./interface";
import { cn } from "@/lib/utils/cn/cn";

const AppMenu = ({ trigger, children, appClassName, anchor = { vertical: "top", horizontal: "right" }, transform = { vertical: "top", horizontal: "left" }, ...props }: IAppMenu) => {
    return (
        <PopupState variant="popper" popupId="droplinked-popup-menu">
            {(menuState) => (
                <>
                    <div {...bindTrigger(menuState)}>{trigger}</div>
                    <Menu {...bindMenu(menuState)} elevation={0} anchorOrigin={anchor} transformOrigin={transform} sx={{ "& .MuiPaper-root": { backgroundColor: "transparent" } }} {...props}>
                        <MenuList className={cn("z-50 min-w-[8rem] overflow-hidden rounded-md border p-1 shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95", appClassName)}>
                            {children}
                        </MenuList>
                    </Menu>
                </>
            )}
        </PopupState>
    );
};

export default AppMenu;
