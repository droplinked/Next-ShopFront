import { AppThemeProvider } from "@/components/providers/theme/AppThemeProvider";
import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import AppLayout from "@/components/core/AppLayout";
import "./globals.css";

export const metadata: Metadata = {
    title: "droplinked",
    description: "Powering the Next Generation of Commerce",
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "white" },
        { media: "(prefers-color-scheme: dark)", color: "black" }
    ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                <AppLayout>
                    <Toaster position="bottom-center" />
                    <AppThemeProvider>{children}</AppThemeProvider>
                </AppLayout>
            </body>
        </html>
    );
}
