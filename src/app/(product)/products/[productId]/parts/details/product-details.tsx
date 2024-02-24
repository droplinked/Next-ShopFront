import { roboto } from "@/styles/fonts";
import { cn } from "@/lib/utils/cn/cn";
import ProductClient from "./client/product-client";

const ProductDetails = ({ product }: { product: any }) => {
    return (
        <section className="w-full flex flex-col gap-9">
            <h1 className={cn("text-3xl font-medium", roboto.className)}>{product.title}</h1>
            <ProductClient product={product} />
        </section>
    );
};

export default ProductDetails;
