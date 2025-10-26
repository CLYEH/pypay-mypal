import { createPublicClient, createWalletClient, http } from 'viem';
import { hardhat } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

async function main() {
  // 創建客戶端
  const account = privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as `0x${string}`);
  
  const publicClient = createPublicClient({
    chain: hardhat,
    transport: http(),
  });

  const walletClient = createWalletClient({
    account,
    chain: hardhat,
    transport: http(),
  });

  // 部署 Factory 合約
  const factoryBytecode = '0x608060405234801561001057600080fd5b50600436106100365760003560e01c8063c4d66de81461003b578063e1c7392a14610051575b600080fd5b610043610055565b60405161004891906100a1565b60405180910390f35b61005961005b565b005b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1663c4d66de86040518163ffffffff1660e01b8152600401600060405180830381600087803b1580156100c157600080fd5b505af11580156100d5573d6000803e3d6000fd5b50505050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000610107826100dc565b9050919050565b610117816100fc565b82525050565b6000602082019050610132600083018461010e565b92915050565b600081905091905056fea2646970667358221220...';
  
  const hash = await walletClient.deployContract({
    abi: [],
    bytecode: factoryBytecode,
  });

  console.log('Factory deployed at:', hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
