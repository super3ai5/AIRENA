export const UPLOAD_ABI = [
  { inputs: [], stateMutability: "nonpayable", type: "constructor" },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "admin",
        type: "address",
      },
      { indexed: false, internalType: "bool", name: "status", type: "bool" },
    ],
    name: "AdminUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "contenthash",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "creator_address",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "agent_name",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "agent_intro",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "ensName",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "avatarContentHash",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "extension",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "optionalField",
        type: "string",
      },
    ],
    name: "DataRecorded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "address", name: "to", type: "address" },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "FundsWithdrawn",
    type: "event",
  },
  {
    inputs: [{ internalType: "address", name: "admin", type: "address" }],
    name: "addAdmin",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "start", type: "uint256" },
      { internalType: "uint256", name: "count", type: "uint256" },
    ],
    name: "fetchData",
    outputs: [
      {
        components: [
          { internalType: "string", name: "contenthash", type: "string" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
          { internalType: "address", name: "creator_address", type: "address" },
          { internalType: "string", name: "agent_name", type: "string" },
          { internalType: "string", name: "agent_intro", type: "string" },
          { internalType: "string", name: "ensName", type: "string" },
          { internalType: "string", name: "avatarContentHash", type: "string" },
          { internalType: "string", name: "extension", type: "string" },
          { internalType: "string", name: "optionalField", type: "string" },
        ],
        internalType: "struct DataRecording.Record[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getRecordCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
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
    inputs: [],
    name: "priceEth",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "string", name: "contenthash", type: "string" },
      { internalType: "uint256", name: "timestamp", type: "uint256" },
      { internalType: "string", name: "agent_name", type: "string" },
      { internalType: "string", name: "agent_intro", type: "string" },
      { internalType: "string", name: "ensName", type: "string" },
      { internalType: "string", name: "avatarContentHash", type: "string" },
      { internalType: "string", name: "extension", type: "string" },
      { internalType: "string", name: "optionalField", type: "string" },
    ],
    name: "recordData",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "records",
    outputs: [
      { internalType: "string", name: "contenthash", type: "string" },
      { internalType: "uint256", name: "timestamp", type: "uint256" },
      { internalType: "address", name: "creator_address", type: "address" },
      { internalType: "string", name: "agent_name", type: "string" },
      { internalType: "string", name: "agent_intro", type: "string" },
      { internalType: "string", name: "ensName", type: "string" },
      { internalType: "string", name: "avatarContentHash", type: "string" },
      { internalType: "string", name: "extension", type: "string" },
      { internalType: "string", name: "optionalField", type: "string" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "admin", type: "address" }],
    name: "removeAdmin",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "newPrice", type: "uint256" }],
    name: "setPriceEth",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address payable", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "withdrawFunds",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
