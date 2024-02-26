import AppIcons from "@/assets/AppIcons";
import AppIconButton from "@/components/shared/button/icon/AppIconButton";
import droplinked from "@/assets/icons/drop.png";
import Image from "next/image";
import React from "react";
import CartTrigger from "./triggers/cart/cart-trigger";

const Header = () => {
    return (
        <header className="sticky top-0 z-20 w-full bg-white py-4 shadow-[0_4px_10px_0px_rgba(0,0,0,0.05)]">
            <div className="container mx-auto flex justify-between items-center">
                <Image src={droplinked} alt="Site Logo" className="h-12 object-contain" width={100} height={32} />
                <div className="flex items-center space-x-3">
                    <div className="flex space-x-3 relative">
                        <AppIconButton><AppIcons.User /></AppIconButton>
                        <CartTrigger/>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
