import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginPage } from './LoginPage';
import * as AuthContext from '../context/AuthContext';

// 模擬 react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal<any>();
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// 模擬 AuthContext
vi.mock('../context/AuthContext', () => ({
    useAuth: vi.fn(),
}));

describe('LoginPage 測試案例', () => {
    const mockLogin = vi.fn();
    const mockClearAuthExpiredMessage = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(AuthContext.useAuth).mockReturnValue({
            login: mockLogin,
            isAuthenticated: false,
            authExpiredMessage: '',
            clearAuthExpiredMessage: mockClearAuthExpiredMessage,
            logout: vi.fn(),
            user: null,
            token: null,
            isLoading: false,
            checkAuth: vi.fn(),
        });
    });

    const renderComponent = () => render(
        <MemoryRouter>
            <LoginPage />
        </MemoryRouter>
    );

    describe('渲染測試 (Render Tests)', () => {
        it('正常渲染登入頁面標題、Email 輸入框、密碼輸入框及登入按鈕', () => {
            renderComponent();

            expect(screen.getByRole('heading', { name: '歡迎回來' })).toBeInTheDocument();
            expect(screen.getByLabelText('電子郵件')).toBeInTheDocument();
            expect(screen.getByLabelText('密碼')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: '登入' })).toBeInTheDocument();
        });
    });

    describe('驗證邏輯測試 (Validation Logic Tests)', () => {
        it('Email 格式錯誤時顯示對應的錯誤提示 (請輸入有效的 Email 格式)', async () => {
            renderComponent();
            const emailInput = screen.getByLabelText('電子郵件');
            const submitBtn = screen.getByRole('button', { name: '登入' });

            await userEvent.type(emailInput, 'invalid-email');
            await userEvent.click(submitBtn);

            expect(screen.getByText('請輸入有效的 Email 格式')).toBeInTheDocument();
            expect(mockLogin).not.toHaveBeenCalled();
        });

        it('密碼少於 8 個字元時顯示對應的錯誤提示 (密碼必須至少 8 個字元)', async () => {
            renderComponent();
            const emailInput = screen.getByLabelText('電子郵件');
            const passwordInput = screen.getByLabelText('密碼');
            const submitBtn = screen.getByRole('button', { name: '登入' });

            await userEvent.type(emailInput, 'test@example.com');
            await userEvent.type(passwordInput, 'short1');
            await userEvent.click(submitBtn);

            expect(screen.getByText('密碼必須至少 8 個字元')).toBeInTheDocument();
            expect(mockLogin).not.toHaveBeenCalled();
        });

        it('密碼缺乏英文或數字時顯示對應的錯誤提示 (密碼必須包含dfdsfdf英文字母和數字)', async () => {
            renderComponent();
            const emailInput = screen.getByLabelText('電子郵件');
            const passwordInput = screen.getByLabelText('密碼');
            const submitBtn = screen.getByRole('button', { name: '登入' });

            await userEvent.type(emailInput, 'test@example.com');
            await userEvent.type(passwordInput, 'onlyletters');
            await userEvent.click(submitBtn);

            expect(screen.getByText('密碼必須包含英文字母和數字')).toBeInTheDocument();

            await userEvent.clear(passwordInput);
            await userEvent.type(passwordInput, '123456789');
            await userEvent.click(submitBtn);

            expect(screen.getByText('密碼必須包含英文字母和數字')).toBeInTheDocument();
            expect(mockLogin).not.toHaveBeenCalled();
        });

        it('Email 和密碼皆符合要求時，送出後不顯示欄位驗證錯誤', async () => {
            mockLogin.mockResolvedValueOnce(undefined);
            renderComponent();

            const emailInput = screen.getByLabelText('電子郵件');
            const passwordInput = screen.getByLabelText('密碼');
            const submitBtn = screen.getByRole('button', { name: '登入' });

            await userEvent.type(emailInput, 'test@example.com');
            await userEvent.type(passwordInput, 'password123');
            await userEvent.click(submitBtn);

            expect(screen.queryByText('請輸入有效的 Email 格式')).not.toBeInTheDocument();
            expect(screen.queryByText('密碼必須至少 8 個字元')).not.toBeInTheDocument();
            expect(screen.queryByText('密碼必須包含英文字母和數字')).not.toBeInTheDocument();
        });
    });

    describe('登入行為測試 (Login Behavior Tests)', () => {
        it('點擊登入按鈕時按鈕進入 disabled 狀態，並顯示 "登入中..."', async () => {
            // Delaying the promise resolve to check the loading state
            let resolveLogin: (value?: unknown) => void;
            mockLogin.mockReturnValueOnce(new Promise((resolve) => {
                resolveLogin = resolve;
            }));

            renderComponent();

            await userEvent.type(screen.getByLabelText('電子郵件'), 'test@example.com');
            await userEvent.type(screen.getByLabelText('密碼'), 'password123');
            await userEvent.click(screen.getByRole('button', { name: '登入' }));

            const button = screen.getByRole('button');
            expect(button).toBeDisabled();
            expect(screen.getByText(/登入中\.\.\./i)).toBeInTheDocument();

            resolveLogin!();
        });

        it('登入成功後，將用戶導向到 `/dashboard` (replace: true)', async () => {
            mockLogin.mockResolvedValueOnce(undefined);
            renderComponent();

            await userEvent.type(screen.getByLabelText('電子郵件'), 'test@example.com');
            await userEvent.type(screen.getByLabelText('密碼'), 'password123');
            await userEvent.click(screen.getByRole('button', { name: '登入' }));

            expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
            expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
        });

        it('登入失敗時，顯示 API 回傳的錯誤訊息 (使用 error banner 顯示)', async () => {
            const apiError = { response: { data: { message: 'Invalid credentials' } } };
            mockLogin.mockRejectedValueOnce(apiError);

            renderComponent();

            await userEvent.type(screen.getByLabelText('電子郵件'), 'test@example.com');
            await userEvent.type(screen.getByLabelText('密碼'), 'password123');
            await userEvent.click(screen.getByRole('button', { name: '登入' }));

            expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
            expect(screen.getByRole('alert')).toBeInTheDocument(); // error banner
        });
    });

    describe('狀態重定向測試 (State & Redirect Tests)', () => {
        it('若使用者已經是登入狀態 (`isAuthenticated` 為 `true`)，加載頁面時自動導向 `/dashboard`', () => {
            vi.mocked(AuthContext.useAuth).mockReturnValue({
                login: mockLogin,
                isAuthenticated: true,
                authExpiredMessage: '',
                clearAuthExpiredMessage: mockClearAuthExpiredMessage,
                logout: vi.fn(),
                user: null,
                token: null,
                isLoading: false,
                checkAuth: vi.fn(),
            });

            renderComponent();

            expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
        });

        it('若 Context 中有 `authExpiredMessage`，會顯示在 error banner 且呼叫 `clearAuthExpiredMessage` 清除該訊息', () => {
            vi.mocked(AuthContext.useAuth).mockReturnValue({
                login: mockLogin,
                isAuthenticated: false,
                authExpiredMessage: '登入已過期，請重新登入',
                clearAuthExpiredMessage: mockClearAuthExpiredMessage,
                logout: vi.fn(),
                user: null,
                token: null,
                isLoading: false,
                checkAuth: vi.fn(),
            });

            renderComponent();

            expect(screen.getByText('登入已過期，請重新登入')).toBeInTheDocument();
            expect(screen.getByRole('alert')).toBeInTheDocument(); // error banner
            expect(mockClearAuthExpiredMessage).toHaveBeenCalled();
        });
    });
});
