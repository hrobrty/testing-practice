# DashboardPage 測試案例

> 測試目標：驗證 DashboardPage.tsx 的渲染、權限控制、API 資料獲取及顯示狀態。

## 渲染測試 (Render Tests)
- [x] 正常渲染儀表板標題、特定用戶名稱的歡迎文字，以及用字首組成的頭像
- [x] 根據角色的不同（`admin` 或其他角色），正確渲染對應的 Badge ('管理員' or '一般用戶')

## 權限控制與導航測試 (Role & Navigation Tests)
- [x] 當使用者角色為 `admin` 時，應顯示「🛠️ 管理後台」的連結
- [x] 當使用者角色非 `admin` 時，不應顯示「🛠️ 管理後台」的連結

## 登出行為測試 (Logout Behavior Tests)
- [x] 點擊「登出」按鈕時，需呼叫 `logout()` 函式，並導向到 `/login` (帶有 `replace: true` 及 `state: null`)

## 資料載入與 API 測試 (Data Loading & API Tests)
- [x] 剛進入頁面請求資料時，應顯示載入中狀態 (spinner 與「載入商品中...」)
- [x] 當 `getProducts` 載入成功時，隱藏載入狀態並正確渲染各個商品的資料 (名稱、描述、價格)
- [x] 若 API 獲取資料發生 401 錯誤，需維持靜默不去設定錯誤，並交由 Axios 攔截器處理
- [x] 若 API 獲取資料發生非 401 的錯誤時，頁面應顯示對應的 API 或預設錯誤訊息 (例如：「無法載入商品資料」)
