import React, { useCallback, useMemo } from "react";
import { IAppQuantity } from "./interface";
import AppIcons from "@/assets/AppIcons";
import AppIconButton from "../button/icon/AppIconButton";
import { cn } from "@/lib/utils/cn/cn";
import AppTypography from "../typography/AppTypography";

function AppQuantity({ appClassName, textClassName, onChange, value, loading, ...props }: IAppQuantity) {
    const minAvailable = useMemo(() => value >= 2, [value]);
    const add = useCallback(() => onChange(parseInt(value) + 1), [value]);
    const min = useCallback(() => minAvailable && onChange(parseInt(value) > 1 ? parseInt(value) - 1 : parseInt(value)), [value]);

    return (
        <div className={cn("border rounded-sm flex items-center justify-between w-32 p-3", appClassName)} {...props}>
            <AppIconButton onClick={min} appSize="sm" appVariant="filled" appClassName={cn("", loading || !minAvailable ? "cursor-not-allowed" : "pointer", !minAvailable && "opacity-50")}><AppIcons.Min /></AppIconButton>
            <AppTypography appClassName={cn("text-base", textClassName)}>{value}</AppTypography>
            <AppIconButton onClick={add} appSize="sm" appVariant="filled" appClassName={cn("", loading ? "cursor-not-allowed" : "pointer")}><AppIcons.Plus /></AppIconButton>
        </div>
    );
}

export default AppQuantity;
