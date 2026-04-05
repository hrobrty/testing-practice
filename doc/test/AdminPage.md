# AdminPage 測試案例

> 測試目標：驗證 AdminPage.tsx 的渲染、角色顯示以及登出邏輯。

## 渲染測試 (Render Tests)
- [x] 正常渲染頁面標題、返回按鈕、以及「管理員專屬頁面」區塊
- [x] 若使用者角色為 `admin` 時，正確渲染「管理員」的 Badge
- [x] 若使用者角色不為 `admin` 時，正確渲染「一般用戶」的 Badge

## 登出行為測試 (Logout Behavior Tests)
- [x] 點擊「登出」按鈕時，需呼叫 `logout()` 函式，並導向到 `/login` (帶有 `replace: true` 及 `state: null`)
