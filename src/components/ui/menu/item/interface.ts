export interface IAppMenuItem {
    pressed: () => void;
    decoration?: React.ReactNode;
    label?: React.ReactNode;
}
