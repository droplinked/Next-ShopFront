import React from "react";
import Header from "./header/header";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <>
            <Header />
            {children}
        </>
    );
};

export default AppLayout;
