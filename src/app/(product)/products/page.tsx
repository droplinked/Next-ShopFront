import { fetchInstance } from "@/lib/apis/fetch-config";
import { useRouter } from "next/router";

async function Products() {
    const data = await fetchInstance("products");
    return (
        <div>
            <h1>products</h1>
            {data.data ? data?.data?.map((product: any) => {
                <h1 className="text-black">{product.title}</h1>;
            }): <div>loading</div>}
        </div>
    );
}

export default Products
