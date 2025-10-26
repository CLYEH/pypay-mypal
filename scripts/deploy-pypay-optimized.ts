import { createPublicClient, createWalletClient, http, getContract } from 'viem';
import { arbitrum } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import PyPayArtifact from '../artifacts/contracts/pypay.sol/PyPay.json' assert { type: 'json' };

async function main() {
  console.log('開始部署優化後的 PyPay 合約到 Arbitrum...');
  
  // 檢查環境變數
  if (!process.env.PRIVATE_KEY) {
    throw new Error('請設定 PRIVATE_KEY 環境變數');
  }
  
  // 創建帳戶和客戶端
  const privateKey = process.env.PRIVATE_KEY.startsWith('0x') 
    ? process.env.PRIVATE_KEY as `0x${string}`
    : `0x${process.env.PRIVATE_KEY}` as `0x${string}`;
  const account = privateKeyToAccount(privateKey);
  
  const publicClient = createPublicClient({
    chain: arbitrum,
    transport: http(),
  });

  const walletClient = createWalletClient({
    account,
    chain: arbitrum,
    transport: http(),
  });

  console.log(`部署到 ${arbitrum.name} (Chain ID: ${arbitrum.id})`);
  console.log(`部署者地址: ${account.address}`);

  // 檢查餘額
  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`帳戶餘額: ${balance / BigInt(10**18)} ETH`);

  if (balance === 0n) {
    throw new Error('帳戶餘額不足，請先獲取一些 ETH');
  }

  // 部署 PyPay 合約 (需要 signer 和 operator 參數)
  const signer = '0x5c2632cEDb167609c7f12e9BBFbC5665CFD66d40';
  const operator = '0x3d94E55a2C3Cf83226b3D056eBeBb43b4731417f';

  const hash = await walletClient.deployContract({
    abi: PyPayArtifact.abi,
    bytecode: PyPayArtifact.bytecode as `0x${string}`,
    args: [signer, operator],
  });

  console.log('PyPay 合約部署交易 hash:', hash);
  
  // 等待交易確認
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log('PyPay 合約部署成功！');
  console.log('合約地址:', receipt.contractAddress);
  console.log('Gas 使用量:', receipt.gasUsed);
  
  // 驗證合約
  console.log('\n要驗證合約，請執行:');
  console.log(`npx hardhat verify --network arbitrum ${receipt.contractAddress} ${signer} ${operator}`);
}

main().catch((error) => {
  console.error('部署失敗:', error);
  process.exitCode = 1;
});
