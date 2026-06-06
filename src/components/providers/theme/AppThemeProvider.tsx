"use client";

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes";

export function AppThemeProvider({ children }: ThemeProviderProps) {
    return (
        <NextThemesProvider attribute="class" defaultTheme="light" enableSystem={true} enableColorScheme={true} themes={["light", "dark"]} disableTransitionOnChange storageKey="droplinked-theme">
            {children}
        </NextThemesProvider>
    );
}
