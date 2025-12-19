# 會議管理系統 (Meeting Master Pro)

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

這是一個基於 React 的會議管理系統，專為公務或企業會議設計，提供簽到冊製作、座位表安排、資料匯入匯出等功能。

## ✨ 主要功能

- **資料輸入**：簡易的表單介面，支援多單位與人員管理。
- **座位表管理**：拖拉或點擊式座位安排，支援自動佈局。
- **簽到冊預覽**：自動生成符合格式的簽到冊，支援過濾特定單位。
- **匯出功能**：
  - 支援匯出 Word (.docx) 格式的簽到冊與座位表。
  - 支援匯出/匯入 JSON 設定檔，方便備份與還原。
- **篩選功能**：可針對特定單位進行篩選顯示與列印。

## 🛠 技術堆疊

- **核心框架**：React 19, TypeScript
- **建置工具**：Vite 6
- **樣式庫**：Tailwind CSS 3
- **圖示庫**：Lucide React
- **文件處理**：docx.js (Word 匯出), file-saver

## 🚀 快速開始

### 前置需求
- Node.js (建議 v18 以上)

### 安裝專案

1. 下載專案程式碼：
   ```bash
   git clone <your-repo-url>
   cd meeting
   ```

2. 安裝相依套件：
   ```bash
   npm install
   ```

### 本地開發

執行以下指令啟動本地開發伺服器：
```bash
npm run dev
```
啟動後，請開啟瀏覽器訪問 `http://localhost:3000` (或終端機顯示的 URL)。

### 建置生產版本

當開發完成需要部署時，執行建置指令：
```bash
npm run build
```
建置後的檔案將位於 `dist` 目錄中。

---

## 📦 部署 (GitHub Actions)

本專案已設定 GitHub Actions 自動部署流程。

1. **設定**：
   - 確保儲存庫設定中的 Pages Source 設為 `GitHub Actions`。
   - 進入 **Settings** > **Pages** > **Build and deployment** > **Source** 選擇 **GitHub Actions**。

2. **自動部署**：
   - 每次推送到 `main` 分支時，GitHub Actions 會自動執行建置並部署至 GitHub Pages。
   - 部署設定檔位於 `.github/workflows/deploy.yml`。

3. **手動部署**：
   - 您也可以在 Actions 頁籤中手動觸發 `Deploy to GitHub Pages` workflow。

## 📂 專案結構

- `src/`
  - `components/`: 重用的 UI 元件 (表單、座位表、簽到表)
  - `types.ts`: TypeScript 型別定義
  - `App.tsx`: 主應用程式邏輯
- `vite.config.ts`: Vite 設定 (已配置 GitHub Pages 相容路徑)
- `tailwind.config.js`: Tailwind CSS 設定
