import AppIcons from "@/assets/AppIcons";
import AppButton from "@/components/shared/button/AppButton";

const AddToCart = () => {
    return (
        <form onSubmit={(event) => event.preventDefault()} className="flex w-full gap-6">
            <div className="min-w-fit">
                <AppButton appClassName="rounded-sm w-full" hasIcon appVariant="outlined" appSize="lg">
                    <AppIcons.Merch />
                    Mint to Merch
                </AppButton>
            </div>
            <div className="w-full">
                <AppButton type="submit" appClassName="rounded-sm w-full" hasIcon appVariant="filled" appSize="lg">
                    <AppIcons.CartLight />
                    Add to cart
                </AppButton>
            </div>
        </form>
    );
};

export default AddToCart;
