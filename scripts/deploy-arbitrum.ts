import { createPublicClient, createWalletClient, http, getContract } from 'viem';
import { arbitrum, arbitrumSepolia, base, baseSepolia, linea, lineaSepolia, polygon, sepolia, mainnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import FactoryArtifact from '../artifacts/contracts/pypay.sol/Factory.json' assert { type: 'json' };

// 全域的 HRE (Hardhat Runtime Environment) 類型
import hre from 'hardhat';

async function main() {
  console.log('開始部署 Factory 合約...');
  
  // 檢查環境變數
  if (!process.env.DEPLOYER_PRIVATE_KEY) {
    throw new Error('請設定 DEPLOYER_PRIVATE_KEY 環境變數');
  }
  
  // 創建帳戶和客戶端
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY.startsWith('0x') 
    ? process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`
    : `0x${process.env.DEPLOYER_PRIVATE_KEY}` as `0x${string}`;
  const account = privateKeyToAccount(privateKey);
  
  // 從命令行參數獲取網路
  let networkName = 'arbitrum'; // 預設值
  
  // 從 process.argv 中查找 --network 參數
  const networkIndex = process.argv.indexOf('--network');
  if (networkIndex !== -1 && process.argv[networkIndex + 1]) {
    networkName = process.argv[networkIndex + 1];
  }
  
  console.log(`檢測到的網路: ${networkName}`);
  
  let chain: any;
  
  // 根據網路名稱選擇對應的 chain
  switch (networkName) {
    case 'arbitrum':
      chain = arbitrum;
      break;
    case 'arbitrum_sepolia':
      chain = arbitrumSepolia;
      break;
    case 'base':
      chain = base;
      break;
    case 'base_sepolia':
      chain = baseSepolia;
      break;
    case 'linea':
      chain = linea;
      break;
    case 'linea_sepolia':
      chain = lineaSepolia;
      break;
    case 'polygon':
      chain = polygon;
      break;
    case 'eth_sepolia':
      chain = sepolia;
      break;
    case 'ethereum':
    case 'mainnet':
      chain = {
        ...mainnet,
        rpcUrls: {
          default: {
            http: ['https://eth-mainnet.g.alchemy.com/v2/zbtfz25b7bCDvZK3w-mObaiAnHygj48I']
          }
        }
      };
      break;
    default:
      console.warn(`未知的網路名稱: ${networkName}，使用預設網路 Arbiscan`);
      chain = arbitrum;
      break;
  }
  
  // 使用 viem 鏈的預設 RPC URL
  const networkUrl = chain.rpcUrls.default.http[0];
  
  const publicClient = createPublicClient({
    chain: chain,
    transport: http(networkUrl),
  });

  const walletClient = createWalletClient({
    account,
    chain: chain,
    transport: http(networkUrl),
  });

  console.log(`部署到 ${networkName} (${chain.name}, Chain ID: ${chain.id})`);
  console.log(`網路 URL: ${networkUrl}`);
  console.log(`部署者地址: ${account.address}`);

  // 檢查餘額
  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`帳戶餘額: ${balance / BigInt(10**18)} ETH`);

  if (balance === 0n) {
    throw new Error('帳戶餘額不足，請先獲取一些 ETH');
  }

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
  console.log('Gas 使用量:', receipt.gasUsed);
  
  // 驗證合約 (可選)
  console.log('\n要驗證合約，請執行:');
  console.log(`npx hardhat verify --network ${networkName} ${receipt.contractAddress}`);
}

main().catch((error) => {
  console.error('部署失敗:', error);
  process.exitCode = 1;
});
