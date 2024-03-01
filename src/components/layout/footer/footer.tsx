import AppIcons from "@/assets/AppIcons";
import droplinked from "@/assets/icons/droplinked.png";
import { AppSeparator, AppTypography } from "@/components/shared";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const Footer = () => {
    return (
        <footer className="flex flex-col gap-8 border-t px-[192px] py-[72px] w-full">
            <section className="flex w-full gap-[160px]">
                <article className="flex flex-col w-full gap-8">
                    <Link href={"/"}>
                        <Image src={droplinked} alt="Site Logo" className="h-12 object-contain" width={100} height={32} />
                    </Link>
                    <AppTypography appClassName="text-foreground/20 font-normal text-sm w-full">
                        UnstoppableDomains harnesses blockchain technology to offer secure, decentralized domain names. This platform empowers users with censorship-resistant digital identities,
                        simplifying online presence management and enhancing internet autonomy.
                    </AppTypography>
                    <ul className="list-none flex item-center justify-start gap-6 w-full">
                        <li>
                            <a href="droplinked.com" target="_blank">
                                <AppIcons.Glob />
                            </a>
                        </li>
                        <li>
                            <a href="droplinked.com" target="_blank">
                                <AppIcons.Linkedin />
                            </a>
                        </li>
                        <li>
                            <a href="droplinked.com" target="_blank">
                                <AppIcons.Twitter />
                            </a>
                        </li>
                        <li>
                            <a href="droplinked.com" target="_blank">
                                <AppIcons.Instagram />
                            </a>
                        </li>
                    </ul>
                </article>
                <aside className="flex items-start h-full gap-16 justify-center">
                    <nav className="space-y-4">
                        <AppTypography className="text-foreground/20">Navigation</AppTypography>
                        <ul className="list-none h-full space-y-4">
                            <li>
                                <Link href={""}>Products</Link>
                            </li>
                            <li>
                                <Link href={""}>Products</Link>
                            </li>
                            <li>
                                <Link href={""}>Products</Link>
                            </li>
                            <li>
                                <Link href={""}>Products</Link>
                            </li>
                        </ul>
                    </nav>
                    <nav className="space-y-4 min-w-fit">
                        <AppTypography className="text-foreground/20">Links</AppTypography>
                        <ul className="list-none flex flex-col justify-start gap-4 h-full">
                            <li>
                                <Link href={""}>Test 1</Link>
                            </li>
                            <li>
                                <Link href={""}>Test 1</Link>
                            </li>
                            <li>
                                <Link href={""}>Test 1</Link>
                            </li>
                        </ul>
                    </nav>
                </aside>
            </section>
            <AppSeparator />
            <section className="flex items-center justify-between w-full">
                <div className="flex items-center justify-start w-full gap-4">
                    <AppTypography appClassName="text-foreground/20 font-normal text-sm">Powered by</AppTypography>
                    <Link href={"/"}>
                        <Image src={droplinked} alt="Site Logo" className="h-12 object-contain" width={100} height={32} />
                    </Link>
                </div>
                <AppTypography appClassName="text-foreground/20 font-normal text-end text-sm w-full">UnstoppableDomains © 2024 , All Rights Reserved.</AppTypography>
            </section>
        </footer>
    );
};

export default Footer;
