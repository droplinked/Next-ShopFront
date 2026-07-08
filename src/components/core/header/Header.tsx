import AppIcons from "@/assets/AppIcons";
import DroplinkedLogo from "@/assets/icons/droplinked-logo.svg";
import CartTrigger from "./triggers/cart/CartTrigger";
import Link from "next/link";
import { AppIconButton } from "@/components/ui";

const Header = () => {
    return (
        <header className="fixed top-0 z-20 w-full bg-white py-4 shadow-[0_4px_10px_0px_rgba(0,0,0,0.05)]">
            <div className="px-[72px] mx-auto flex justify-between items-center">
                <Link href={'/'} aria-label="droplinked home"><DroplinkedLogo className="h-8 w-auto text-foreground" /></Link>
                <div className="flex items-center space-x-3"><div className="flex space-x-3 relative"><AppIconButton><AppIcons.User /></AppIconButton><CartTrigger /></div></div>
            </div>
        </header>
    );
};

export default Header;
