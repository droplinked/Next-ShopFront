
import AppTypography from "../typography/AppTypography";
import { IAppDotsLabel } from "./interface";

const AppDotLabel = ({ label, content, appClassNames: { container = "flex gap-4", title = "text-base", dot = "text-base", value = "text-base opacity-25" } }: IAppDotsLabel) => {
    return (
        <div className={container}>
            <AppTypography appClassName={title}>{label}</AppTypography>
            <AppTypography appClassName={dot}>•</AppTypography>
            <AppTypography appClassName={value}>{content}</AppTypography>
        </div>
    );
};

export default AppDotLabel;
