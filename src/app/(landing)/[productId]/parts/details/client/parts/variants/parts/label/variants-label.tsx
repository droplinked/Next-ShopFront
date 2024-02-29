import { AppTypography } from "@/components/shared";

const VariantsLabel = ({ label, current }: { label: "Color" | "Size"; current: string }) => {
    return (
        <div className="flex gap-4">
            <AppTypography appClassName="text-base">{label}</AppTypography>
            <AppTypography appClassName="text-base">•</AppTypography>
            <AppTypography appClassName="text-base opacity-25">{current}</AppTypography>
        </div>
    );
};

export default VariantsLabel;
