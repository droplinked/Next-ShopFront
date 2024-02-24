import { createContext } from "react";

export interface IExploreState {
    search: string;
}

export const initialExploreState: IExploreState = {
    search: "",
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
