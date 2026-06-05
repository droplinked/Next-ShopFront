import localFont from "next/font/local";
import { Roboto, Inter } from "next/font/google";
const Avenir = localFont({ src: "./AvenirNext.otf" });

const roboto = Roboto({
    weight: ["400", "500", "700", "900"],
    subsets: ["latin"],
});

/**
 * Inter — droplinked design-system primary typeface (per Figma 41345:30038).
 * Loaded as a CSS variable so it can be opted into by section/page without
 * forcing it globally (other surfaces still use Avenir/Roboto by design).
 */
const inter = Inter({
    weight: ["400", "500", "600", "700", "800", "900"],
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
});

export { Avenir, roboto, inter };
