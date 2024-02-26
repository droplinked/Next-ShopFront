import { createContext } from "react";

export interface IExploreState {
    search: string;
    price: [number, number];
}

export const initialExploreState: IExploreState = {
    search: "",
    price: [0, 1000],
};

interface IExploreContext {
    states: IExploreState;
    methods: { updateStates: (key: string, value: any) => void };
}
const ExploreContext = createContext<IExploreContext>({
    states: initialExploreState,
    methods: { updateStates: () => {} },
});

export default ExploreContext;
