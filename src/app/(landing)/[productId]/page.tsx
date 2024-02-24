"use server"
import { fetchInstance } from "@/lib/apis/fetch-config";
import ProductDetails from "./parts/details/product-details";
import ProductSlider from "./parts/slider/product-slider";
import ProductDescription from "./parts/description/product-description";
import AppSeparator from "@/components/shared/separator/AppSeparator";

const ProductPage = async ({ params }: { params: { productId: string } }) => {
    const data = await fetchInstance(`products/${params.productId}`);
    return (
        <main className="md:container pt-20 px-8 flex items-start md:flex-row flex-col justify-center w-full gap-12">
                <div className="min-w-full md:min-w-[40%] sticky left-0 top-24">
                    <ProductSlider media={data?.media} />
                </div>
                <div className="flex flex-col gap-9 min-w-full md:min-w-[60%]">
                    <ProductDetails product={data} />
                    <AppSeparator />
                    <ProductDescription description={data?.description || ""}/>
                </div>
        </main>
    );
};

export default ProductPage;
