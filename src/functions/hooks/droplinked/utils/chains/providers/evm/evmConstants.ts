import axios from "axios";
import { Chain, Network } from "../../Chains";
async function getContractAddress(chain: Chain, network: Network) {
  let result = String(
    (
      await axios.get(
        `https://apiv3dev.droplinked.com/storage/${snakeCase(Chain[chain])}${snakeCase(Network[network])}ContractAddress`
      )
    ).data.value
  ); // example: BinanceContractAddress
  return result;
}

async function getContractABI(_chain: Chain) {
  let result = [
    {
      inputs: [
        { internalType: "address", name: "_base", type: "address" },
        { internalType: "address", name: "_token", type: "address" },
      ],
      stateMutability: "nonpayable",
      type: "constructor",
    },
    { inputs: [], name: "AccessDenied", type: "error" },
    { inputs: [], name: "AffiliatePOD", type: "error" },
    { inputs: [], name: "AlreadyRequested", type: "error" },
    { inputs: [], name: "CannotChangeMetata", type: "error" },
    { inputs: [], name: "CouponCantBeApplied", type: "error" },
    { inputs: [], name: "DifferentLength", type: "error" },
    {
      inputs: [
        { internalType: "uint256", name: "amount", type: "uint256" },
        { internalType: "address", name: "receiver", type: "address" },
      ],
      name: "ERC20TransferFailed",
      type: "error",
    },
    { inputs: [], name: "InvalidCouponProducer", type: "error" },
    { inputs: [], name: "InvalidCouponValue", type: "error" },
    {
      inputs: [{ internalType: "uint256", name: "fee", type: "uint256" }],
      name: "InvalidFee",
      type: "error",
    },
    { inputs: [], name: "InvalidFromAddress", type: "error" },
    { inputs: [], name: "MinterIsNotIssuer", type: "error" },
    {
      inputs: [
        { internalType: "uint256", name: "tokenId", type: "uint256" },
        { internalType: "address", name: "tokenOwner", type: "address" },
      ],
      name: "NotEnoughTokens",
      type: "error",
    },
    { inputs: [], name: "NotSupportedERC20Token", type: "error" },
    { inputs: [], name: "RequestIsAccepted", type: "error" },
    { inputs: [], name: "RequestIsNotAccepted", type: "error" },
    { inputs: [], name: "RequestNotfound", type: "error" },
    { inputs: [], name: "ZeroPrice", type: "error" },
    { inputs: [], name: "oldPrice", type: "error" },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "uint256",
          name: "requestId",
          type: "uint256",
        },
      ],
      name: "AcceptRequest",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "uint256",
          name: "requestId",
          type: "uint256",
        },
      ],
      name: "CancelRequest",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "address",
          name: "_droplinkedBase",
          type: "address",
        },
      ],
      name: "DeployedBase",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "address",
          name: "_droplinkedToken",
          type: "address",
        },
      ],
      name: "DeployedToken",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "uint256",
          name: "requestId",
          type: "uint256",
        },
      ],
      name: "DisapproveRequest",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "address",
          name: "tokenAddress",
          type: "address",
        },
      ],
      name: "ERC20PaymentAdded",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "address",
          name: "removedToken",
          type: "address",
        },
      ],
      name: "ERC20PaymentRemoved",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "previousOwner",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "newOwner",
          type: "address",
        },
      ],
      name: "OwnershipTransferred",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "uint256",
          name: "tokenId",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "requestId",
          type: "uint256",
        },
      ],
      name: "PublishRequest",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "string",
          name: "memo",
          type: "string",
        },
      ],
      name: "Purchase",
      type: "event",
    },
    {
      inputs: [
        { internalType: "address", name: "erc20token", type: "address" },
      ],
      name: "addERC20Contract",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint256", name: "requestId", type: "uint256" }],
      name: "approve_request",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint256", name: "requestId", type: "uint256" }],
      name: "cancel_request",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint256", name: "requestId", type: "uint256" }],
      name: "disapprove",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "droplinkedBase",
      outputs: [
        { internalType: "contract DroplinkedBase", name: "", type: "address" },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "_shop", type: "address" },
        { internalType: "uint80", name: "chainLinkRoundId", type: "uint80" },
        { internalType: "uint256[]", name: "tbdValues", type: "uint256[]" },
        { internalType: "address[]", name: "tbdReceivers", type: "address[]" },
        {
          components: [
            { internalType: "uint256", name: "id", type: "uint256" },
            { internalType: "uint256", name: "amount", type: "uint256" },
            { internalType: "bool", name: "isAffiliate", type: "bool" },
          ],
          internalType: "struct PurchaseData[]",
          name: "cartItems",
          type: "tuple[]",
        },
        {
          components: [
            { internalType: "uint256[2]", name: "_pA", type: "uint256[2]" },
            {
              internalType: "uint256[2][2]",
              name: "_pB",
              type: "uint256[2][2]",
            },
            { internalType: "uint256[2]", name: "_pC", type: "uint256[2]" },
            {
              internalType: "uint256[3]",
              name: "_pubSignals",
              type: "uint256[3]",
            },
            { internalType: "bool", name: "provided", type: "bool" },
          ],
          internalType: "struct CouponProof",
          name: "proof",
          type: "tuple",
        },
        { internalType: "string", name: "memo", type: "string" },
      ],
      name: "droplinkedPurchase",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [],
      name: "droplinkedToken",
      outputs: [
        { internalType: "contract DroplinkedToken", name: "", type: "address" },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "droplinkedWallet",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "getFee",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "string", name: "_uri", type: "string" },
        { internalType: "uint256", name: "_price", type: "uint256" },
        { internalType: "uint256", name: "_commission", type: "uint256" },
        { internalType: "uint256", name: "amount", type: "uint256" },
        { internalType: "address", name: "receiver", type: "address" },
        { internalType: "enum ProductType", name: "_type", type: "uint8" },
        { internalType: "address", name: "_paymentWallet", type: "address" },
        {
          components: [
            { internalType: "bool", name: "isPercentage", type: "bool" },
            { internalType: "uint256", name: "value", type: "uint256" },
            { internalType: "address", name: "wallet", type: "address" },
          ],
          internalType: "struct Beneficiary[]",
          name: "_beneficiaries",
          type: "tuple[]",
        },
        { internalType: "bool", name: "acceptedManageWallet", type: "bool" },
        { internalType: "uint256", name: "royalty", type: "uint256" },
      ],
      name: "mint",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "owner",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "producer_account", type: "address" },
        { internalType: "uint256", name: "tokenId", type: "uint256" },
      ],
      name: "publish_request",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "erc20token", type: "address" },
      ],
      name: "removeERC20Contract",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
      name: "removeMetadata",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "renounceOwnership",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint256", name: "_fee", type: "uint256" }],
      name: "setFee",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint16", name: "_heartbeat", type: "uint16" }],
      name: "setHeartBeat",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "price", type: "uint256" },
        { internalType: "uint256", name: "commission", type: "uint256" },
        {
          components: [
            { internalType: "bool", name: "isPercentage", type: "bool" },
            { internalType: "uint256", name: "value", type: "uint256" },
            { internalType: "address", name: "wallet", type: "address" },
          ],
          internalType: "struct Beneficiary[]",
          name: "beneficiaries",
          type: "tuple[]",
        },
        { internalType: "uint256", name: "tokenId", type: "uint256" },
        { internalType: "address", name: "paymentWallet", type: "address" },
      ],
      name: "setMetadataAfterPurchase",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
      name: "transferOwnership",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
  ];
  return result;
}

function getERC20TokenTransferABI() {
  return [
    {
      constant: false,
      inputs: [
        {
          name: "_to",
          type: "address",
        },
        {
          name: "_value",
          type: "uint256",
        },
      ],
      name: "transfer",
      outputs: [
        {
          name: "",
          type: "bool",
        },
      ],
      payable: false,
      stateMutability: "nonpayable",
      type: "function",
    },
  ];
}

function snakeCase(str: string) {
  return str[0].toUpperCase() + str.slice(1).toLowerCase();
}
export function toBase64(str: any) {
  return btoa(str);
}
export { getContractABI, getContractAddress, getERC20TokenTransferABI };
