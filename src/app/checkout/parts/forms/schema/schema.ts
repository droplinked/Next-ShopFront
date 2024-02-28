import { ICartAddress } from "@/lib/stores/app/interfaces/cart";
import { string, object, mixed } from "yup";
export const addressSchema = () =>
    object().shape({
        email: string().required("Required"),
        firstName: string().required("Required"),
        lastName: string().required("Required"),
        addressLine1: string().required("Required"),
        state: string().required("Required"),
        country: string().required("Required"),
        city: string().required("Required"),
        zip: string().required("Required"),
        addressShop: mixed().oneOf(["SHOP"]),
    });
export const initialAddress = ({ address, email }: { address: Omit<ICartAddress, "_id" | "ownerID" | "easyPostAddressID">; email: string }) => {
    return {
        email: email || "",
        firstName: address?.firstName || "",
        lastName: address?.lastName || "",
        addressLine1: address?.addressLine1 || "",
        addressLine2: address?.addressLine2 ? address?.addressLine2 : "",
        country: address?.country ? address?.country : null,
        city: address?.city || null,
        state: address?.state || null,
        zip: address?.zip || "",
        addressType: "SHOP",
    };
};

// email: email || "majid@gmail.com",
//         firstName: address?.firstName || "majid",
//         lastName: address?.lastName || "test",
//         addressLine1: address?.addressLine1 || "811 West",
//         addressLine2: address?.addressLine2 ? address?.addressLine2 : "tw",
//         country: address?.country ? address?.country : "United States",
//         city: address?.city || "Los Angeles",
//         state: address?.state || "California",
//         zip: address?.zip || "90017",
//         addressType: "SHOP",
