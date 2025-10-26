import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { FactoryABI } from '../utils/contracts'

// Factory 合約地址（Ethereum 和 Arbitrum 都一樣）
const FACTORY_ADDRESS = '0x49aa018dC29772561795E13a09aCA3DaAF4777Be'
const OPERATOR_ADDRESS = '0x3d94E55a2C3Cf83226b3D056eBeBb43b4731417f'

// 計算 PyPay 合約地址
export function useComputePyPayAddress(address: string | undefined, chainId: number | undefined) {
  return useReadContract({
    address: FACTORY_ADDRESS as `0x${string}`,
    abi: FactoryABI,
    functionName: 'computeAddress',
    args: [
      0n, // _salt_int = 0
      address as `0x${string}` || '0x0000000000000000000000000000000000000000',
      OPERATOR_ADDRESS as `0x${string}`
    ],
    query: {
      enabled: !!address && !!chainId,
    },
  })
}

// 部署 PyPay 合約
export function useDeployPyPayContract(address: string | undefined, chainId: number | undefined) {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const deploy = () => {
    if (!address || !chainId) return

    writeContract({
      address: FACTORY_ADDRESS as `0x${string}`,
      abi: FactoryABI,
      functionName: 'deploy',
      args: [
        0n, // _salt_int = 0
        address as `0x${string}`,
        OPERATOR_ADDRESS as `0x${string}`
      ],
    })
  }

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  return {
    deploy,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

// 檢查合約是否已部署
export function useCheckContractDeployed(address: string | undefined, chainId: number | undefined) {
  const { data: computedAddress } = useComputePyPayAddress(address, chainId)
  
  // 這裡應該檢查 computedAddress 是否已經有 code
  // 由於 wagmi 的限制，我們可能需要使用其他方法
  // 暫時返回 computedAddress
  
  return {
    computedAddress,
    isDeployed: false, // TODO: 實作檢查邏輯
  }
}

