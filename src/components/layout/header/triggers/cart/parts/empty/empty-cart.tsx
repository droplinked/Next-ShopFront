import { cn } from "@/lib/utils/cn/cn";
import { app_link, app_vertical } from "@/lib/variables/variables";
import emptycart from "@/assets/icons/empty-cart.png";
import Image from "next/image";
import Link from "next/link";
import { AppTypography } from "@/components/shared";

const EmptyCart = () => {
    return (
        <article className={cn(app_vertical, "w-full gap-10 py-6")}>
            <Image src={emptycart} width={144} height={166} alt="Your cart is empty" />
            <AppTypography appClassName="text-center font-normal">Your cart is emptier than our Monday morning meetings...</AppTypography>
            <Link href={"/"} className={cn(app_link, "text-center text-base font-thin")}>
                Go back to shopping
            </Link>
        </article>
    );
};

export default EmptyCart;
