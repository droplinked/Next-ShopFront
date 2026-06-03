'use client';

import AppIcons from "@/assets/AppIcons";
import droplinked from "@/assets/icons/droplinked.png";
import Image from "next/image";
import CartTrigger from "./triggers/cart/CartTrigger";
import Link from "next/link";
import { AppIconButton } from "@/components/ui";
import useAppStore from "@/lib/stores/app/appStore";

/**
 * Storefront header.
 *
 * Reads `shop.logo` from the appStore and renders it as the brand logo. When
 * the shop has no logo configured (or before hydration), falls back to the
 * droplinked logo as a safe default.
 *
 * Closes droplinked/Next-ShopFront#78 — the previous version hard-imported
 * `@/assets/icons/droplinked.png` for every shop, so merchant-customised
 * branding never rendered. Surfaced by the Bonum × MCredit cutover where
 * the MCredit red-M was set on the shop record (visible via the API) but
 * the header still rendered the droplinked logo.
 *
 * Why a plain `<img>` for the shop-supplied URL:
 *   - The merchant URL is dynamic (S3 in the common case but could be any
 *     CDN), so `next/image` would need to be configured per-domain in
 *     `next.config.js` to allow optimisation. A plain `<img>` ducks the
 *     allow-list ceremony at the cost of optimisation we don't need for a
 *     tiny header logo. The droplinked-default fallback stays as
 *     `next/image` for the bundled asset.
 */
const Header = () => {
    const shopLogo = useAppStore(s => s.states.shop?.logo);

    return (
        <header className="fixed top-0 z-20 w-full bg-white py-4 shadow-[0_4px_10px_0px_rgba(0,0,0,0.05)]">
            <div className="px-[72px] mx-auto flex justify-between items-center">
                <Link href={'/'}>
                    {shopLogo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={shopLogo}
                            alt="Shop Logo"
                            className="h-12 object-contain"
                        />
                    ) : (
                        <Image src={droplinked} alt="Site Logo" className="h-12 object-contain" width={100} height={32} />
                    )}
                </Link>
                <div className="flex items-center space-x-3"><div className="flex space-x-3 relative"><AppIconButton><AppIcons.User /></AppIconButton><CartTrigger /></div></div>
            </div>
        </header>
    );
};

export default Header;
