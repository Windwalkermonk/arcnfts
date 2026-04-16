import { JsonRpcProvider, Wallet, ContractFactory } from "ethers";
import { readFileSync } from "fs";

const RPC = "https://rpc.quicknode.testnet.arc.network";
const provider = new JsonRpcProvider(RPC);

// Check network
const network = await provider.getNetwork();
console.log("Network:", network.chainId.toString());

// Try dev account #0
const PK = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const wallet = new Wallet(PK, provider);
const balance = await provider.getBalance(wallet.address);
console.log("Address:", wallet.address);
console.log("Balance:", balance.toString());

if (balance === 0n) {
  console.log("No balance on dev account. Trying faucet...");
  process.exit(1);
}

const abi = JSON.parse(readFileSync("build/contracts_NFTFactory_sol_NFTFactory.abi", "utf8"));
const bytecode = "0x" + readFileSync("build/contracts_NFTFactory_sol_NFTFactory.bin", "utf8");

const factory = new ContractFactory(abi, bytecode, wallet);
console.log("Deploying NFTFactory...");
const contract = await factory.deploy();
await contract.waitForDeployment();
const addr = await contract.getAddress();
console.log("NFTFactory deployed at:", addr);
