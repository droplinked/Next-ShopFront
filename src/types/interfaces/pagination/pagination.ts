export interface IPagination {
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextPage: number | null;
    previousPage: number | null;
    limit: null;
    totalDocuments: number;
}

export const initialPagination = {
    currentPage: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
    nextPage: null,
    previousPage: null,
    limit: null,
    totalDocuments: 0,
};
