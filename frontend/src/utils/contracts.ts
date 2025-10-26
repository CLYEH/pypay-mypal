// Factory 合約 ABI
export const FactoryABI = [
  {
    inputs: [],
    name: "Create2EmptyBytecode",
    type: "error",
  },
  {
    inputs: [],
    name: "FailedDeployment",
    type: "error",
  },
  {
    inputs: [
      { internalType: "uint256", name: "balance", type: "uint256" },
      { internalType: "uint256", name: "needed", type: "uint256" }
    ],
    name: "InsufficientBalance",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "deployedAddress",
        type: "address",
      },
    ],
    name: "ContractDeployed",
    type: "event",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_salt_int", type: "uint256" },
      { internalType: "address", name: "signer", type: "address" },
      { internalType: "address", name: "operator", type: "address" }
    ],
    name: "computeAddress",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_salt_int", type: "uint256" },
      { internalType: "address", name: "signer", type: "address" },
      { internalType: "address", name: "operator", type: "address" }
    ],
    name: "deploy",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const

