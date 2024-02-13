"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

export function AppThemeProvider({ children }: ThemeProviderProps) {
  return <NextThemesProvider
    attribute="class"
    defaultTheme="system"
    enableSystem={true}
    enableColorScheme={true}
    themes={['light', 'dark']}
    disableTransitionOnChange
    storageKey="droplinked-theme"
  >
    {children}
  </NextThemesProvider>
}
