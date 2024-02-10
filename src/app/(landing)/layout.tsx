import React from "react";
import Navbar from "./components/layout/navbar/navbar";

const HomeLayout = (children: React.ReactNode) => {
    return (
        <div className="h-full">
            <Navbar />
            <main className="h-full pt-40">{children}</main>
        </div>
    );
};

export default HomeLayout;
