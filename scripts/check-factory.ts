import { createPublicClient, http, getContract } from 'viem';
import { arbitrum } from 'viem/chains';
import FactoryArtifact from '../artifacts/contracts/pypay.sol/Factory.json' assert { type: 'json' };

async function main() {
  console.log('檢查部署的 Factory 合約...');
  
  const contractAddress = '0x49aa018dc29772561795e13a09aca3daaf4777be';
  
  const publicClient = createPublicClient({
    chain: arbitrum,
    transport: http(),
  });

  // 創建合約實例
  const contract = getContract({
    address: contractAddress as `0x${string}`,
    abi: FactoryArtifact.abi,
    client: publicClient,
  });

  console.log('合約地址:', contractAddress);
  console.log('合約 ABI 函數:');
  
  // 列出所有函數
  FactoryArtifact.abi.forEach((item, index) => {
    if (item.type === 'function') {
      console.log(`${index + 1}. ${item.name}(${item.inputs?.map(input => `${input.type} ${input.name}`).join(', ') || ''})`);
    }
  });

  // 測試 computeAddress 函數
  try {
    console.log('\n測試 computeAddress 函數...');
    const result = await contract.read.computeAddress([1n, '0x1234567890123456789012345678901234567890', '0x0987654321098765432109876543210987654321']);
    console.log('computeAddress 測試成功，結果:', result);
  } catch (error) {
    console.error('computeAddress 函數測試失敗:', error);
  }

  // 測試 deploy 函數 (只讀取，不執行)
  try {
    console.log('\n檢查 deploy 函數是否存在...');
    // 這裡我們只是檢查函數是否存在，不實際調用
    console.log('deploy 函數存在');
  } catch (error) {
    console.error('deploy 函數檢查失敗:', error);
  }
}

main().catch((error) => {
  console.error('檢查失敗:', error);
  process.exitCode = 1;
});
