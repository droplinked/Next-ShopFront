import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppThemeProvider } from "@/components/providers/theme/AppThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "droplinked",
    description: "Powering the Next Generation of Commerce",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                <AppThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange storageKey="droplinked-theme">
                    {children}
                </AppThemeProvider>
            </body>
        </html>
    );
}
