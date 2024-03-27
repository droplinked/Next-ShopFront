import { CLPublicKey, CasperWalletEventTypes } from "casper-js-sdk";
let casperWalletInstance;
export let account_information;
export const getCasperWalletInstance = () => {
    try {
      if (casperWalletInstance == null) {
        casperWalletInstance = (window).CasperWalletProvider();
      }
      return casperWalletInstance;
    } catch (err) {}
    throw Error('Please install the Casper Wallet Extension.');
};

export const isCasperWalletExtentionInstalled = () => {
    try{
        let walletInstance = (window).CasperWalletProvider();
        return walletInstance != null;
    }
    catch(error){
        return false;
    }
}

let get_account_information = async function(publicKey){
    let sign = await getCasperWalletInstance().signMessage("matin.ghiasvand1381@gmail.com", await getCasperWalletInstance().getActivePublicKey());
    return {
        "publicKey":publicKey,
        "account_hash":CLPublicKey.fromHex(publicKey).toAccountRawHashStr(),
        "signature" :sign.signatureHex
    };
}
export async function casper_login(){
    return new Promise(async (resolve, reject)=>{
        let called = false;
        await getCasperWalletInstance().requestConnection();
        if (await getCasperWalletInstance().isConnected()){
            if(!called){
                called = true;
                resolve(await get_account_information(await getCasperWalletInstance().getActivePublicKey()));
            }
            return;
        }
        await getCasperWalletInstance().requestConnection();
        const handleConnected = async (event) => {
            try {
                const action = JSON.parse(event.detail);
                if (action.activeKey) {
                    if(!called){
                        called = true;
                        resolve(await get_account_information(action.activeKey));
                    }            
                }
            } catch (err) {
                console.log(err);
                reject(err);
            }
        };
        window.addEventListener(CasperWalletEventTypes.Connected, handleConnected);
        if (!called)
            resolve(await get_account_information(await getCasperWalletInstance().getActivePublicKey()));  
    })
}