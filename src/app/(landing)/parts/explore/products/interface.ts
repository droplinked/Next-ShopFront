import { IPagination } from "@/types/interfaces/pagination/pagination";
import { IProduct } from "@/types/interfaces/product/product";
import { initialPagination } from "@/types/interfaces/pagination/pagination";

export interface IPaginationProducts extends IPagination {
    data: IProduct[];
    loading: boolean;
}

export const initialPaginationProducts: IPaginationProducts = { data: [], ...initialPagination, loading: true };
