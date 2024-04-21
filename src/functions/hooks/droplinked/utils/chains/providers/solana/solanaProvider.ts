import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { clusterApiUrl, Connection, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { ChainProvider, IChainPayment, WalletNotFoundException } from "../../chainProvider";
import { Chain, ChainWallet, Network } from "../../Chains";

export class SolanaProvider implements ChainProvider {
  chain: Chain = Chain.BINANCE;
  network: Network = Network.TESTNET;
  address: string = "";
  wallet: ChainWallet = ChainWallet.Metamask;
  constructor(_chain: Chain, _network: Network) {
    this.chain = _chain;
    this.network = _network;
  }

  async walletLogin(): Promise<any> {
    if (!(window as any).solana || !(window as any).solana.isPhantom) {
      window.open("https://phantom.app/", "_blank")
      throw new WalletNotFoundException("Phantom wallet not found.");
    }
    const provider = (window as any).solana;
    const resp = await provider.connect();
    const message = `Please sign this message to let droplinked view your PublicKey & Address and validate your identity`;
    const encodedMessage = new TextEncoder().encode(message);
    const signedMessage = await provider.signMessage(encodedMessage, "utf8");
    return {
      address: resp.publicKey.toString(),
      signature: signedMessage,
    };
  }

  async paymentWithToken(
    receiver: string,
    amount: number,
    tokenAddress: string
  ): Promise<string> {
    // Check if Phantom is available in the user's browser
    if (!(window as any).solana || !(window as any).solana.isPhantom) {
      window.open("https://phantom.app/", "_blank")
      throw new WalletNotFoundException("Phantom wallet not found.");
    }
    try {
      const provider = (window as any).solana;
      await provider.connect();
      const senderPublicKey = provider.publicKey;
      const connection = new Connection(
        clusterApiUrl(
          this.network === Network.TESTNET ? "devnet" : "mainnet-beta"
        )
      );
      const mintPublicKey = new PublicKey(tokenAddress);
      const recipientPublicKey = new PublicKey(receiver);
      const mintToken = new Token(
        connection,
        mintPublicKey,
        TOKEN_PROGRAM_ID,
        provider
      );
      const fromTokenAccount =
        await mintToken.getOrCreateAssociatedAccountInfo(senderPublicKey);
      const associatedDestinationTokenAddr =
        await Token.getAssociatedTokenAddress(
          mintToken.associatedProgramId,
          mintToken.programId,
          mintPublicKey,
          recipientPublicKey
        );
      const receiverAccount = await connection.getAccountInfo(
        associatedDestinationTokenAddr
      );
      const instructions: TransactionInstruction[] = [];
      if (receiverAccount === null) {
        instructions.push(
          Token.createAssociatedTokenAccountInstruction(
            mintToken.associatedProgramId,
            mintToken.programId,
            mintPublicKey,
            associatedDestinationTokenAddr,
            recipientPublicKey,
            senderPublicKey
          )
        );
      }
      instructions.push(
        Token.createTransferInstruction(
          TOKEN_PROGRAM_ID,
          fromTokenAccount.address,
          associatedDestinationTokenAddr,
          senderPublicKey,
          [],
          amount
        )
      );
      const transaction = new Transaction().add(...instructions);
      transaction.feePayer = senderPublicKey;
      transaction.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash;
      let signedTransaction = await provider.signTransaction(transaction);
      const transactionSignature = await connection.sendRawTransaction(
        signedTransaction.serialize(),
        { skipPreflight: true }
      );
      const latestBlockHash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: transactionSignature
      });
      const delay = (delayInms: number) => {
        return new Promise(resolve => setTimeout(resolve, delayInms));
      };

      while (true) {
        await delay(1500);
        console.log("Checking transaction status...");
        try {
          if (await connection.getParsedTransaction(transactionSignature))
            break;
        }
        catch (e) {
          console.log(e)
        }
      }
      await delay(1000);
      return transactionSignature;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  setAddress(address: string): ChainProvider {
    this.address = address;
    return this;
  }

  setWallet(wallet: ChainWallet): ChainProvider {
    this.wallet = wallet;
    return this;
  }

  payment(
    data: IChainPayment
  ): Promise<{ deploy_hash: string; cryptoAmount: any }> {
    throw new Error("Method not implemented.");
  }
}
