import { createPublicClient, createWalletClient, http, getContract } from 'viem';
import { hardhat } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import FactoryArtifact from '../artifacts/contracts/pypay.sol/Factory.json' assert { type: 'json' };

async function main() {
  console.log('開始部署 Factory 合約...');
  
  // 創建帳戶和客戶端
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
  const hash = await walletClient.deployContract({
    abi: FactoryArtifact.abi,
    bytecode: FactoryArtifact.bytecode as `0x${string}`,
  });

  console.log('Factory 合約部署交易 hash:', hash);
  
  // 等待交易確認
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log('Factory 合約部署成功！');
  console.log('合約地址:', receipt.contractAddress);
}

main().catch((error) => {
  console.error('部署失敗:', error);
  process.exitCode = 1;
});
