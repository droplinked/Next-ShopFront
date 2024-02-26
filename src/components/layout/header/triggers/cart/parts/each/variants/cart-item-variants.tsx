import AppTypography from "@/components/shared/typography/AppTypography";
import React from "react";

const CartItemVariants = ({ label, value }: { label: "Color" | "Size"; value: string }) => {
    return (
        <div className="flex gap-4 w-full">
            <AppTypography appClassName="text-normal text-secondary-foreground">{label}</AppTypography>
            <AppTypography appClassName="text-normal text-secondary-foreground">•</AppTypography>
            <AppTypography appClassName="text-normal">{value}</AppTypography>
        </div>
    );
};

export default CartItemVariants;
