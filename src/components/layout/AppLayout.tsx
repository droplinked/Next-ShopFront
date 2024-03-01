
import Footer from "./footer/footer";
import Header from "./header/header";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <>
            <Header />
            {children}
            <Footer/>
        </>
    );
};

export default AppLayout;
