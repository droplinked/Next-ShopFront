
import Footer from "./footer/footer";
import Header from "./header/Header";


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
