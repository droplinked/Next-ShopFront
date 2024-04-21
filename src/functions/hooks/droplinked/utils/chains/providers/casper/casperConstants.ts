import axios from "axios";
import { Network } from "../../Chains";
import { CasperServiceByJsonRPC } from "casper-js-sdk";
export async function getContractAddress(network: Network) {
  let result = String(
    (
      await axios.get(
        `https://apiv3dev.droplinked.com/storage/Casper${snakeCase(Network[network])}ContractAddress`
      )
    ).data.value
  ); // example: BinanceContractAddress
  return result;
}
export async function get_session() {
  let result = String(
    (
      await axios.get(
        `https://apiv3dev.droplinked.com/storage/CasperPaymentSession`
      )
    ).data.value
  );
  return result;
}
export function base64ToArrayBuffer(base64: string) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
export const apiUrl =
  "https://apiv3dev.droplinked.com/http-req?method=post&url=http://188.40.47.161";
export const casperService = new CasperServiceByJsonRPC(apiUrl + ":7777/rpc");
function snakeCase(str: string) {
  return str[0].toUpperCase() + str.slice(1).toLowerCase();
}
export function toBase64(str: any) {
  return btoa(str);
}
