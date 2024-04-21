import {
  CLPublicKey,
  CLU64,
  Contracts,
  DeployUtil,
  NamedArg,
  RuntimeArgs,
  CLKey,
  CLByteArray,
  CLList,
  CLString,
  CLU512,
  CLAccountHash,
  CLU64Type,
  CLKeyType,
} from "casper-js-sdk";
import { Network } from "../../Chains";
import {
  base64ToArrayBuffer,
  casperService,
  getContractAddress,
  get_session,
} from "./casperConstants";
import { getCasperWalletInstance } from "./casperWalletAuth";
import { IChainPayment } from "lib/chains/chainProvider";
function accountHashFromHex(hex: string) {
  hex = hex.replace("account-hash-", "");
  let address_byte_array = new Uint8Array(32);
  for (let i = 0; i < hex.length; i += 2) {
    address_byte_array[i / 2] = parseInt(hex[i] + hex[i + 1], 16);
  }
  let account_hash = new CLAccountHash(address_byte_array);
  let key = new CLKey(account_hash);
  return key;
}
export async function casperPayment(
  network: Network,
  address: string,
  data: IChainPayment
) {
  // let chain_name = network == Network.MAINNET ? "casper" : "casper-test";
  // let deployParams = new DeployUtil.DeployParams(CLPublicKey.fromHex(address), chain_name , 1 , 1800000);
  // let arrayBuff = base64ToArrayBuffer(await get_session());//await (await fetch('src/contract.wasm')).arrayBuffer();
  // let contract_hash = new CLKey(new CLByteArray(Contracts.contractHashToByteArray(await getContractAddress(network))));
  // let module_bytes = new Uint8Array(arrayBuff);
  // let named_args = [];
  // let _timestamp = new CLU64(timestamp);
  // let _amounts = amounts.length != 0 ? new CLList(amounts.map((x)=>new CLU64(x.toString()))) : new CLList(new CLU64Type());
  // let _receivers = receivers.length != 0 ? new CLList(receivers.map((x)=> accountHashFromHex(x))) : new CLList(new CLKeyType());
  // let _tokenReceiver = accountHashFromHex(tokenReceiver);
  // let _tokenSenders = tokenSenders.length != 0 ? new CLList(tokenSenders.map((x)=>accountHashFromHex(x))): new CLList(new CLKeyType());
  // let _tokenAmounts = tokenAmounts.length != 0 ? new CLList(tokenAmounts.map((x)=>new CLU64(x.toString()))): new CLList(new CLU64Type());
  // let _tokenIds = tokenIds.length !=0 ? new CLList(tokenIds.map((x)=>new CLU64(x.toString()))): new CLList(new CLU64Type());
  // let _signature = new CLString(signature);
  // let amount = BigInt("0");
  // for (let i = 0; i < amounts.length; i++) {
  //     amount += BigInt(amounts[i]);
  // }
  // let _amount = new CLU512(amount.toString());
  // named_args.push(new NamedArg("amount" , _amount));
  // named_args.push(new NamedArg("amounts" , _amounts));
  // named_args.push(new NamedArg("receivers" , _receivers));
  // named_args.push(new NamedArg("tokenIds" , _tokenIds));
  // named_args.push(new NamedArg("tokenAmounts" , _tokenAmounts));
  // named_args.push(new NamedArg("tokenReceiver" , _tokenReceiver));
  // named_args.push(new NamedArg("tokenSenders" , _tokenSenders));
  // named_args.push(new NamedArg("timestamp" , _timestamp));
  // named_args.push(new NamedArg("signature" , _signature));
  // named_args.push(new NamedArg("contract_hash" , contract_hash));

  // let runtime_args = RuntimeArgs.fromNamedArgs(named_args);
  // const kk = DeployUtil.ExecutableDeployItem.newModuleBytes(module_bytes , runtime_args);
  // const payment = DeployUtil.standardPayment(40013050000);
  // let deploy = DeployUtil.makeDeploy(deployParams , kk , payment);
  // const json = DeployUtil.deployToJson(deploy);
  // const __signature = await getCasperWalletInstance().sign(JSON.stringify(json), address).catch((reason:any)=>{
  //     return "Cancelled";
  // });
  // const signedDeploy = DeployUtil.setSignature(
  //     deploy,
  //     __signature.signature,
  //     CLPublicKey.fromHex(address)
  //   );
  // const deployres = await casperService.deploy(signedDeploy);
  // return deployres.deploy_hash;
  return {
    deploy_hash: "",
    cryptoAmount: BigInt(0),
  };
}
