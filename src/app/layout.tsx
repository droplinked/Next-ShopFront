import { AppThemeProvider } from "@/components/providers/theme/AppThemeProvider";
import type { Metadata } from "next";
import { Toaster } from "sonner";
import AppLayout from "@/components/layout/AppLayout";
import "./globals.css";

export const metadata: Metadata = {
    title: "droplinked",
    description: "Powering the Next Generation of Commerce",
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
