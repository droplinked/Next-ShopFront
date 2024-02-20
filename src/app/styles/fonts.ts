import localFont from "next/font/local";
import { Roboto } from "next/font/google";
const Avenir = localFont({ src: "./AvenirNext.otf" });

const roboto = Roboto({
    weight: ["500", "700", "900"],
    subsets: ['latin']
});
export { Avenir, roboto };
