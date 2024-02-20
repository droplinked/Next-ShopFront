import { fetchInstance } from "@/lib/apis/fetch-config";
import ProductDetails from "./parts/details/product-details";
import ProductSlider from "./parts/slider/product-slider";

const ProductPage = async ({ params }: { params: { productId: string } }) => {
    const data = await fetchInstance(`products/${params.productId}`);
    return (
        <main className="md:container pt-20 px-8 flex items-start md:flex-row flex-col justify-center w-full gap-12">
                <div className="min-w-full md:min-w-[40%]">
                    <ProductSlider media={data?.media} />
                </div>
                <div className="min-w-full md:min-w-[60%]">
                    <ProductDetails product={data} />
                </div>
        </main>
    );
};

export default ProductPage;
