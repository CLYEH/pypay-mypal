import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("FactoryModules", (m: any) => {

  // Factory 合約定義在 pypay.sol 檔案中
  const Factory = m.contract("Factory");

  // 在 Hardhat Ignition 中，合約會自動部署
  // 我們只需要返回合約實例
  
  return { Factory };
});