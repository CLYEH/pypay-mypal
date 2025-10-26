import { createPublicClient, http } from 'viem';
import { arbitrum } from 'viem/chains';

async function main() {
  console.log('開始驗證 Factory 合約...');
  
  const contractAddress = '0x49aa018dc29772561795e13a09aca3daaf4777be';
  
  const publicClient = createPublicClient({
    chain: arbitrum,
    transport: http(),
  });

  // 檢查合約是否已部署
  const code = await publicClient.getBytecode({ address: contractAddress as `0x${string}` });
  
  if (code === '0x') {
    console.log('❌ 合約未找到或未部署');
    return;
  }
  
  console.log('✅ 合約已部署');
  console.log(`合約地址: ${contractAddress}`);
  console.log(`Arbitrum Explorer: https://arbiscan.io/address/${contractAddress}`);
  
  console.log('\n📋 手動驗證步驟:');
  console.log('1. 前往 https://arbiscan.io/');
  console.log(`2. 搜尋合約地址: ${contractAddress}`);
  console.log('3. 點擊 "Contract" 標籤');
  console.log('4. 點擊 "Verify and Publish"');
  console.log('5. 選擇 "Solidity (Single file)"');
  console.log('6. 輸入合約名稱: Factory');
  console.log('7. 選擇編譯器版本: v0.8.28');
  console.log('8. 選擇授權: MIT');
  console.log('9. 貼上合約原始碼 (從 contracts/pypay.sol 複製 Factory 合約部分)');
  console.log('10. 點擊 "Verify and Publish"');
  
  console.log('\n🔗 相關連結:');
  console.log(`- Arbitrum Explorer: https://arbiscan.io/address/${contractAddress}`);
  console.log(`- 交易 Hash: 0x87e8e645115cf064a27e40c8ca574c48e3e334a1101720b372b798c6afb62143`);
}

main().catch((error) => {
  console.error('驗證失敗:', error);
  process.exitCode = 1;
});
