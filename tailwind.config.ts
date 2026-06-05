import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: ["./src/pages/**/*.{js,ts,jsx,tsx,mdx}", "./src/components/**/*.{js,ts,jsx,tsx,mdx}", "./src/app/**/*.{js,ts,jsx,tsx,mdx}"],
    theme: {
        container: {
            center: true,
            padding: "72px",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            colors: {
                border: "hsl(var(--border))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                placeholder: "hsl(var(--placeholder))",
                nav: "hsl(var(--nav))",
                gray: {
                    100: "hsl(0 0% 95%)",
                    200: "hsl(0 0% 87%)",
                    300: "hsl(0 0% 86%)",
                    400: "hsl(0 0% 77%)",
                    500: "hsl(0 0% 53%)",
                    600: "hsl(0 0% 38%)",
                    700: "hsl(0 0% 24%)",
                    800: "hsl(0 0% 16%)",
                    850: "hsl(0 0% 15%)",
                    900: "hsl(0 0% 13%)",
                    1000: "hsl(0 0% 11%)",
                },
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },

                disabled: {
                    DEFAULT: "hsl(var(--disabled))",
                    foreground: "hsl(var(--disabled-foreground))",
                },

                "disabled-outlined": {
                    DEFAULT: "hsl(var(--disabled-outlined-border))",
                    foreground: "hsl(var(--disabled-outlined-foreground))",
                },

                hovered: {
                    DEFAULT: "hsl(var(--hovered))",
                    foreground: "hsl(var(--hovered-foreground))",
                },

                "hovered-outlined": {
                    DEFAULT: "hsl(var(--hovered-outlined))",
                },

                focused: {
                    DEFAULT: "hsl(var(--focused))",
                    foreground: "hsl(var(--focused-foreground))",
                },

                "focused-outlined": {
                    DEFAULT: "hsl(var(--focused-outlined))",
                },

                pressed: {
                    DEFAULT: "hsl(var(--pressed))",
                    foreground: "hsl(var(--pressed-foreground))",
                },

                "pressed-outlined": {
                    DEFAULT: "hsl(var(--pressed-outlined))",
                },

                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                link: {
                    foreground: "hsl(var(--link-foreground))",
                },
                // === Mint accent scale — droplinked design-system primary ===
                // Pulled from Figma Main Pages canvas SOLID fills:
                // (43,206,161) #2BCEA1 base · (73,207,172) #49CFAC light ·
                // (38,141,112) #268D70 pressed · (0,255,194) #00FFC2 neon.
                // Scoped to landing surfaces — additive only, existing pages
                // continue to use the `hovered/focused/pressed` mint tokens.
                mint: {
                    DEFAULT: "#2BCEA1",
                    50: "#EAFBF5",
                    100: "#D2F5E9",
                    200: "#A6ECD3",
                    300: "#72E0BB",
                    400: "#49CFAC",
                    light: "#49CFAC",
                    500: "#2BCEA1",
                    600: "#23A985",
                    700: "#1C8B6E",
                    800: "#177058",
                    900: "#0F4D3D",
                    neon: "#00FFC2",
                },
                // === Dark theme surface layers (Figma 1440 landing) ===
                // Layered card vocabulary: page bg → surface-1 → surface-2 → surface-3.
                surface: {
                    DEFAULT: "#0A0A0A",
                    0: "#0A0A0A",
                    1: "#141414",
                    2: "#1C1C1C",
                    3: "#222222",
                    4: "#292929",
                    5: "#3C3C3C",
                },
                line: {
                    DEFAULT: "#262626",
                    soft: "#1F1F1F",
                    strong: "#3C3C3C",
                    stronger: "#4F4F4F",
                },
                ink: {
                    DEFAULT: "#FFFFFF",
                    muted: "#B1B1B1",
                    soft: "#DEDEDE",
                    faint: "#7A7A7A",
                },
            },
            borderRadius: {
                lg: "16px",
                md: "12px",
                sm: "8px",
            },
            fontFamily: {
                // Inter is the droplinked design-system primary typeface
                // (Figma 41345:30038). Opt in per section/page via
                // `font-display`/`font-display-tight` — global default
                // typography is unchanged so other surfaces don't shift.
                display: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
            },
            boxShadow: {
                // Mint glow used by hero CTA + focus rings, per the Figma
                // landing hero pattern.
                "mint-glow": "0 8px 32px rgba(43, 206, 161, 0.20)",
                "mint-glow-lg": "0 12px 48px rgba(43, 206, 161, 0.28)",
                // Card elevation in the dark layered surface system.
                "card-dark": "0 1px 0 rgba(255, 255, 255, 0.04) inset, 0 8px 24px rgba(0, 0, 0, 0.40)",
            },
            keyframes: {
                "slide-down": {
                    from: {
                        "max-height": "0",
                        opacity: "0",
                    },
                    to: {
                        "max-height": "100vh",
                        opacity: "1",
                    },
                },
                dots: {
                    "0%, 100%": {
                        transform: "translateY(-25%)",
                        animationTimingFunction: "cubic-bezier(0.8, 0, 1, 1)",
                        opacity: "1",
                    },
                    "50%": {
                        transform: "none",
                        animationTimingFunction: "cubic-bezier(0, 0, 0.2, 1)",
                        opacity: "0.5",
                    },
                },
                pulse: {
                    "50%": {
                        opacity: ".5",
                    },
                },
            },
        },
        animation: {
            "slide-down": "slide-down 2s ease-out",
            dots: "dots 1s infinite",
            shimmer: "shimmer 2s infinite",
            pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        },
    },
    plugins: [require("tailwindcss-animate")],
};
export default config;
