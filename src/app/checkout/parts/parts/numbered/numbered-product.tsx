import { INumberedProduct } from "./interface";
import { app_center } from "@/lib/variables/variables";
import Image from "next/image";
import { cn } from "@/lib/utils/cn/cn";
import { AppTypography } from "@/components/ui";

const NumberedProduct = ({ number, image, alt }: INumberedProduct) => <div className="min-w-12 min-h-12 relative"><AppTypography appClassName={cn(app_center, "text-[10px] font-extrabold w-4 h-4 rounded-full absolute -top-2 -right-2 bg-foreground text-background")}>{number}</AppTypography><Image src={image} width={48} height={48} alt={`${alt} shipping group image`} /></div>
export default NumberedProduct;
