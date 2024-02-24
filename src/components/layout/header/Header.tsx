import AppIcons from "@/assets/AppIcons";
import AppIconButton from "@/components/shared/button/icon/AppIconButton";
import droplinked from '@/assets/icons/drop.png'
import Image from "next/image";
import React from "react";

const Header: React.FC = () => {
    return (
        <header className="sticky top-0 z-20 w-full bg-white py-4 shadow-[0_4px_10px_0px_rgba(0,0,0,0.05)]">
            <div className="container mx-auto flex justify-between items-center">
                {/* <div className=""> */}
                    <Image src={droplinked} alt="Site Logo" className="h-12 object-contain" width={100} height={32} />
                    {/* <nav> */}
                        {/* <ul className="flex space-x-6"> */}
                            {/* <li><Link href="/explore"><AppTypography appVariant="nav">Explore</AppTypography></Link></li> */}
                            {/* <li><Link href="/about"><AppTypography appVariant="nav">About Us</AppTypography></Link></li> */}
                            {/* <li><Link href="/faq"><AppTypography appVariant="nav">FAQ</AppTypography></Link></li> */}
                            {/* <li><Link href="/contact"><AppTypography appVariant="nav">Contact Us</AppTypography></Link></li> */}
                        {/* </ul> */}
                    {/* </nav> */}
                {/* </div> */}
                <div className="flex items-center space-x-3">
                    {/* <AppInput inputType={"search"} left={<AppIcons.Search />} right={<AppIconButton appSize="sm" appClassName="bg-border"><AppIcons.Slash /></AppIconButton>} placeholder="Search Products" appClassName="text-sm text-black border-none bg-secondary rounded-sm"/> */}
                    <div className="flex space-x-3">
                        <AppIconButton><AppIcons.User /></AppIconButton>
                        <AppIconButton><AppIcons.Cart /></AppIconButton>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
