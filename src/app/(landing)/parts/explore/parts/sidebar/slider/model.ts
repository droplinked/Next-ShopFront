namespace priceSliderModel {
    const minmax = [10, 100];
    export const slide = (newValue: number | number[], activeThumb: number, updateStates: (key: "price", value: [number, number]) => void) => {
        if (!Array.isArray(newValue)) return;
        if (newValue[1] - newValue[0] < minmax[0]) {
            if (activeThumb === 0) {
                const clamped = Math.min(newValue[0], minmax[1] - minmax[0]);
                updateStates("price", [clamped, clamped + minmax[0]]);
            } else {
                const clamped = Math.max(newValue[1], minmax[0]);
                updateStates("price", [clamped - minmax[0], clamped]);
            }
        } else {
            updateStates("price", newValue as [number, number]);
        }
    };
}

export default priceSliderModel;
