# Configuration Guide

## 快速開始

### 1. Alchemy RPC 配置（推薦）

在項目根目錄創建 `frontend/.env` 文件：

```bash
VITE_ALCHEMY_API_KEY_ETHEREUM=your_ethereum_alchemy_key
VITE_ALCHEMY_API_KEY_ARBITRUM=your_arbitrum_alchemy_key
```

這些 keys 與 `hardhat.config.ts` 中使用的相同，只需要從根目錄的 `.env` 複製到 `frontend/.env`。

### 2. 合約地址配置

當你重新部署合約後，需要更新以下配置文件中的地址：

## 前端配置

**文件：`frontend/src/config/constants.ts`**

```typescript
// 更新這些地址
export const FACTORY_ADDRESS = 'YOUR_FACTORY_ADDRESS'  // Factory 合約地址
export const OPERATOR_ADDRESS = 'YOUR_OPERATOR_ADDRESS'  // Operator（後端）錢包地址

export const PYUSD_ADDRESSES = {
  1: 'YOUR_ETH_PYUSD_ADDRESS',    // Ethereum 主網 PYUSD
  42161: 'YOUR_ARB_PYUSD_ADDRESS'  // Arbitrum 主網 PYUSD
}

export const OFT_ADDRESSES = {
  1: 'YOUR_ETH_OFT_ADDRESS',      // Ethereum OFT 合約
  42161: 'YOUR_ARB_OFT_ADDRESS'    // Arbitrum OFT 合約
}

export const BACKEND_URL = 'http://localhost:5002'  // 後端 API 地址
```

## 後端配置

**文件：`backend/config.py`**

```python
# 更新這些地址
FACTORY_ADDRESS = 'YOUR_FACTORY_ADDRESS'
OPERATOR_ADDRESS = 'YOUR_OPERATOR_ADDRESS'  # 需要是後端錢包地址

PYUSD_ADDRESSES = {
    1: 'YOUR_ETH_PYUSD_ADDRESS',
    42161: 'YOUR_ARB_PYUSD_ADDRESS'
}

OFT_ADDRESSES = {
    1: 'YOUR_ETH_OFT_ADDRESS',
    42161: 'YOUR_ARB_OFT_ADDRESS'
}
```

## 檢查清單

更新配置後，確保：

1. ✅ Factory 合約地址更新
2. ✅ Operator 地址與後端 `.env` 中的 `PRIVATE_KEY` 對應的地址一致
3. ✅ 前端 `BACKEND_URL` 與後端運行的 port 一致
4. ✅ PYUSD 和 OFT 地址與網絡匹配

## 常用地址位置

### 前端
- `frontend/src/config/constants.ts` - 所有常數配置
- `frontend/src/App.tsx` - 使用 FACTORY_ADDRESS 和 OPERATOR_ADDRESS
- `frontend/src/components/SendPage.tsx` - 使用所有配置
- `frontend/src/components/ApprovePage.tsx` - 使用 PYUSD_ADDRESSES

### 後端
- `backend/config.py` - 所有配置（推薦使用）
- `backend/app.py` - 如果還有硬編碼地址需要更新
- `backend/contract_manager.py` - 使用 config.py 中的配置

### 環境變數

#### 後端
- `.env`（項目根目錄）- 後端環境變數（`PRIVATE_KEY`, `ALCHEMY_API_KEY_*` 等）
- `backend/env.example` - 環境變數模板

#### 前端
- `frontend/.env` - 前端環境變數（可選，用於 Alchemy RPC）
```bash
# 創建 frontend/.env
cp backend/.env frontend/.env

# 添加前端專用變數（VITE_ 前綴）
VITE_ALCHEMY_API_KEY_ETHEREUM=your_key
VITE_ALCHEMY_API_KEY_ARBITRUM=your_key
```

### Alchemy 設置

1. **後端**：使用根目錄的 `.env` 中的 `ALCHEMY_API_KEY_*`
2. **前端**：創建 `frontend/.env`，添加 `VITE_ALCHEMY_API_KEY_*`
3. **Hardhat**：同樣使用根目錄 `.env` 中的 keys

所有配置共享同一個 Alchemy 賬號的 API keys。

