import CheckoutPageContext from "@/app/checkout/context";
import { AppRadioInput, AppTypography } from "@/components/shared";
import AppShow from "@/components/shared/show/AppShow";
import { cn } from "@/lib/utils/cn/cn";
import { app_center, app_vertical } from "@/lib/variables/variables";
import { useContext } from "react";
import { IEachPaymentRadio } from "./interface";

const EachPaymentRadio = ({ method, ...props }: IEachPaymentRadio) => {
    const {
        states: { selected_method },
        methods: { updateStates }
    } = useContext(CheckoutPageContext);

    return (
      <AppShow
        show={{
          when: method.isActive,
          then: (
            <AppRadioInput
              checked={selected_method?.name === method.type}
              onChange={() =>
                updateStates('selected_method', {
                  name: method.type
                })
              }
              {...props}
            >
              <div className={cn(app_vertical, 'w-full justify-start gap-2 -mt-1')}>
                <div className={cn(app_center, 'justify-between w-full')}>
                  <AppTypography>{method.type}</AppTypography>
                </div>
                <AppShow
                  show={{
                    when: method.supportedChains?.length > 0,
                    then: (
                      <div className={cn(app_center, 'justify-start w-full gap-1')}>
                        {/* {method.supportedChains.map((chain, key) => (
                                                <AppTypography
                                                    key={key}
                                                    appClassName="font-normal text-[#878787] mr-1"
                                                >
                                                    {chain.type}
                                                </AppTypography>
                                            ))} */}
                      </div>
                    )
                  }}
                />
              </div>
            </AppRadioInput>
          )
        }}
      />
    );
};

export default EachPaymentRadio;
