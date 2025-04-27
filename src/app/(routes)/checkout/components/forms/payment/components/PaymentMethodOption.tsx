import CheckoutPageContext from '@/app/(routes)/checkout/context/context';
import { AppRadioInput, AppTypography } from '@/components/ui';
import AppShow from '@/components/ui/show/AppShow';
import { cn } from '@/lib/utils/cn/cn';
import { app_center, app_vertical } from '@/lib/variables/variables';
import { useContext } from 'react';
import { IPaymentMethodOption } from './interface';

const PaymentMethodOption = ({ method, ...props }: IPaymentMethodOption) => {
  const {
    states: { selected_method },
    methods: { updateStates }
  } = useContext(CheckoutPageContext); 

  // Generate a unique identifier for this payment method
  const getPaymentId = () => {
    if (method.type === 'STRIPE' && method.stripeType) {
      return `${method.type}-${method.stripeType}`;
    } else if (method.token) {
      return `${method.type}-${method.token}`;
    }
    return method.type;
  };

  const paymentId = getPaymentId();

  // Check if the current payment method is selected by comparing the unique identifiers
  const isSelected = selected_method?.id === paymentId;

  return (
    <AppShow
      show={{
        when: method.isActive,
        then: (
          <AppRadioInput
            checked={isSelected}
            onChange={() =>
              updateStates('selected_method', {
                id: paymentId,
                name: method.type,
                token: method.token,
                chainId: method.chainId
              })
            }
            {...props}
          >
            <div className={cn(app_vertical, 'w-full justify-start gap-2 -mt-1')}>
              <div className={cn(app_center, 'justify-between w-full')}>
                <AppTypography>
                  {method.displayName} {method.token && `(${method.token})`}
                </AppTypography>
              </div>
              <AppShow
                show={{
                  when: method.supportedChains?.length > 0,
                  then: (
                    <div className={cn(app_center, 'justify-start w-full gap-1')}>
                     {method.supportedChains.map((chain, key) => (
                        <AppTypography
                          key={key}
                          appClassName="font-normal text-[#878787] mr-1"
                        >
                          {chain.type}
                        </AppTypography>
                      ))}
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

export default PaymentMethodOption;
