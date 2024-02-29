import { Slider } from "@mui/material";
import React, { useContext } from "react";
import ExploreContext from "../../../context";
import priceSliderModel from "./model";

const PriceSlider = () => {
    const { methods: { updateStates }, states: { price } } = useContext(ExploreContext);
    return <Slider getAriaLabel={() => "Minimum distance shift"} value={price} onChange={(event: Event, newValue: number | number[], activeThumb: number) => priceSliderModel.slide(newValue, activeThumb, updateStates )} valueLabelDisplay="auto" disableSwap sx={{ color: "#DEDEDE", height: 4, padding: "13px 0", "& .MuiSlider-thumb": { height: 12, width: 12, backgroundColor: "#000", border: "2px solid #DEDEDE", boxShadow: "0px 0px 0px 0px", "&:focus, &:hover, &.Mui-active": { boxShadow: "0px 0px 0px 0px", "@media (hover: none)": { boxShadow: "0px 0px 0px 0px" }}, "&:before": { boxShadow: "0px 0px 0px 0px" }}, "& .MuiSlider-track": { height: 4, color: "#000" }, "& .MuiSlider-rail": { color: "#DEDEDE", height: 4 }}}/>;
};

export default PriceSlider;
