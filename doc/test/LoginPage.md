# LoginPage 測試案例

> 測試目標：驗證 LoginPage.tsx 的渲染、表單驗證、登入邏輯與路由行為。

## 渲染測試 (Render Tests)
- [x] 正常渲染登入頁面標題、Email 輸入框、密碼輸入框及登入按鈕

## 驗證邏輯測試 (Validation Logic Tests)
- [x] Email 格式錯誤時顯示對應的錯誤提示 (請輸入有效的 Email 格式)
- [x] 密碼少於 8 個字元時顯示對應的錯誤提示 (密碼必須至少 8 個字元)
- [x] 密碼缺乏英文或數字時顯示對應的錯誤提示 (密碼必須包含英文字母和數字)
- [x] Email 和密碼皆符合要求時，送出後不顯示欄位驗證錯誤

## 登入行為測試 (Login Behavior Tests)
- [x] 點擊登入按鈕時按鈕進入 disabled 狀態，並顯示 "登入中..."
- [x] 登入成功後，將用戶導向到 `/dashboard` (replace: true)
- [x] 登入失敗時，顯示 API 回傳的錯誤訊息 (使用 error banner 顯示)

## 狀態重定向測試 (State & Redirect Tests)
- [x] 若使用者已經是登入狀態 (`isAuthenticated` 為 `true`)，加載頁面時自動導向 `/dashboard`
- [x] 若 Context 中有 `authExpiredMessage`，會顯示在 error banner 且呼叫 `clearAuthExpiredMessage` 清除該訊息
