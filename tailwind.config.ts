import { Config } from "tailwindcss";

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
            },
            borderRadius: {
                lg: "16px",
                md: "12px",
                sm: "8px",
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
