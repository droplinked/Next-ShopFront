import { cn } from "@/lib/utils/cn/cn";
import React from "react";
import AppTypography from "../../typography/AppTypography";

const PlusMinus = ({ isOpen, label }: { isOpen: boolean, label: string }) => {
    return (
        <div className={cn("relative flex items-center justify-center w-4 h-4 origin-center transition-transform duration-1000")}>
            <div className={cn("border border-foreground h-4 absolute origin-center transition-transform duration-1000", isOpen ? "transform -rotate-90" : "transform rotate-0")} />
            <div className={cn("border border-foreground w-4 absolute origin-center transition-transform duration-1000", isOpen ? "transform -rotate-180" : "transform rotate-0")} />
        </div>
    );
};

export default PlusMinus;
