import { useContext, useEffect, useState } from "react";
import ExploreContext from "../../context";
import useAppDebounce from "@/state/hooks/debounce/useAppDebounce";
import AppIcons from "@/assets/AppIcons";
import { AppInput } from "@/components/ui";

const ExploreTools = () => {
    const { methods: { updateStates } } = useContext(ExploreContext);
    const [searchValue, setSearchValue] = useState("");
    const debouncedSearchTerm = useAppDebounce(searchValue);
    useEffect(() => { updateStates("search", debouncedSearchTerm) }, [debouncedSearchTerm]);

    return <div className="flex justify-start w-full"><AppInput appClassName="w-[288px]" left={<AppIcons.Search/>} placeholder="Search in results" onChange={(e) => setSearchValue(e.currentTarget.value)} /></div>;
};

export default ExploreTools;
