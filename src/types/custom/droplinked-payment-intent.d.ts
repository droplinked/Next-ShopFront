declare module 'droplinked-payment-intent' {
  export interface DroplinkedPaymentIntentProps {
    clientSecret: string;
    type: "stripe";
    isTestnet: boolean;
    return_url: string;
    onSuccess: () => void;
    onError: () => void;
    onCancel: () => void;
    commonStyle?: {
      backgroundBody?: string;
      colorContainer?: string;
      textColorLabel?: string;
      colorInput?: string;
      textColorInput?: string;
      colorBorderInput?: string;
      borderRadius?: string;
      cancelButton?: {
        backgroundColor?: string;
        borderRadius?: string;
        textColor?: string;
      };
      submitButton?: {
        backgroundColor?: string;
        borderRadius?: string;
        textColor?: string;
      };
      verticalPadding?: string;
      theme?: "light" | "dark";
    };
  }

  export const DroplinkedPaymentIntent: React.FC<DroplinkedPaymentIntentProps>;
}