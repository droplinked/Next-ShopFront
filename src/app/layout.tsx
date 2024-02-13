import { AppThemeProvider } from "@/components/providers/theme/AppThemeProvider";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "droplinked",
    description: "Powering the Next Generation of Commerce",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                <AppThemeProvider>
                    {children}
                </AppThemeProvider>
            </body>
        </html>
    );
}
