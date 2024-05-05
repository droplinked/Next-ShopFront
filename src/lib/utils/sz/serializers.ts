import { IPaymentMethods } from "@/types/interfaces/shop/shop";

export const payment_methods_serializer = (payment_methods: IPaymentMethods[]) => {
    const result = [];

    for (let i = 0; i < payment_methods.length; i++) {
        const method = payment_methods[i];
        if (!method.isActive) continue;

        if (method.tokens?.length === 0) {
            result.push({
                title: `${method.type}`,
                type: method.type,
            });
        }

        for (let j = 0; j < method.tokens?.length; j++) {
            const token = method.tokens[j];
            result.push({
                title: `${method.type} (${token.type})`,
                type: method.type,
                token: token.type,
            });
        }
    }

    return result;
};
