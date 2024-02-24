
namespace useCartModel {
    export const countItems = (cart: any): number => {
        if (!cart || !cart?.items || !cart?.items.length) return 0
        let count = 0
        cart?.items.forEach((element: any) => {
            count = count + element?.options?.quantity
        });
        return count
    }

    export const removeCart = (cart: any, shopName: string) => Object.entries(cart).reduce((acc: any, [key, value]) => {
        if (key !== shopName) acc[key] = value
        return acc;
    }, {})
}

export default useCartModel