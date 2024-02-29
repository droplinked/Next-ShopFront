import { IAppRadioInput } from "./interface";
import './radio.css'

const AppRadioInput = ({children, ...props}:IAppRadioInput) => {
    return (
        <label>
            <input type="radio" {...props} />
            {children}
        </label>
    );
};

export default AppRadioInput;
