"use client";
import PopupState, { bindToggle } from "material-ui-popup-state";
import { Collapse, styled } from "@mui/material";
import PlusMinus from "./plus-minus/plus-minus";
import AppTypography from "../typography/AppTypography";

const AppCollapse = ({ children, label }: { children: React.ReactNode; label: string }) => {
    return (
        <PopupState variant="popper" popupId="droplinked-collapse-card">
            {(popoverState) => (
                <article className="flex flex-col gap-9">
                    <div className="flex items-center gap-4" {...bindToggle(popoverState)}>
                        <PlusMinus isOpen={popoverState.isOpen} label={label} />
                        <AppTypography className="text-lg">Description</AppTypography>
                    </div>
                    <Collapse timeout={1000} in={popoverState.isOpen}><section>{children}</section></Collapse>
                </article>
            )}
        </PopupState>
    );
};

export default AppCollapse;
