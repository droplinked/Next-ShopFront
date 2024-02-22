import { fetchInstance } from "@/lib/apis/fetch-config";
import Navbar from "./components/layout/navbar/navbar";

export default async function Home() {
    const data = await fetchInstance('shop')
    return <main className="min-h-screen flex p-5">Home</main>;
}
