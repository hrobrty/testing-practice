import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardPage } from './DashboardPage';
import * as AuthContext from '../context/AuthContext';
import { productApi } from '../api/productApi';

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

// 模擬 productApi
vi.mock('../api/productApi', () => ({
    productApi: {
        getProducts: vi.fn(),
    }
}));

describe('DashboardPage 測試案例', () => {
    const mockLogout = vi.fn();
    const adminUser = { id: 1, email: 'admin@example.com', username: 'AdminUser', role: 'admin' as const };
    const normalUser = { id: 2, email: 'user@example.com', username: 'NormalUser', role: 'user' as const };

    const mockProducts = [
        { id: 1, name: 'Product A', description: 'Desc A', price: 100 },
        { id: 2, name: 'Product B', description: 'Desc B', price: 200 }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        // default default mocking
        vi.mocked(productApi.getProducts).mockResolvedValue(mockProducts);
    });

    const renderComponent = () => render(
        <MemoryRouter>
            <DashboardPage />
        </MemoryRouter>
    );

    const mockAuthContext = (user: any) => {
        vi.mocked(AuthContext.useAuth).mockReturnValue({
            user,
            logout: mockLogout,
            isAuthenticated: true,
            login: vi.fn(),
            authExpiredMessage: '',
            clearAuthExpiredMessage: vi.fn(),
            token: 'mock-token',
            isLoading: false,
            checkAuth: vi.fn()
        } as any);
    };

    describe('渲染測試 (Render Tests)', () => {
        it('正常渲染儀表板標題、特定用戶名稱的歡迎文字，以及用字首組成的頭像', async () => {
            mockAuthContext(adminUser);
            renderComponent();

            expect(screen.getByRole('heading', { name: '儀表板' })).toBeInTheDocument();
            expect(screen.getByText('Welcome, AdminUser 👋')).toBeInTheDocument();
            expect(screen.getByText('A')).toBeInTheDocument(); // avatar based on 'AdminUser' -> 'A'
        });

        it('根據角色的不同（`admin` 或其他角色），正確渲染對應的 Badge (\'管理員\' or \'一般用戶\')', async () => {
            mockAuthContext(adminUser);
            const { unmount } = renderComponent();
            expect(screen.getByText('管理員')).toBeInTheDocument();
            
            unmount();

            mockAuthContext(normalUser);
            renderComponent();
            expect(screen.getByText('一般用戶')).toBeInTheDocument();
        });
    });

    describe('權限控制與導航測試 (Role & Navigation Tests)', () => {
        it('當使用者角色為 `admin` 時，應顯示「🛠️ 管理後台」的連結', async () => {
            mockAuthContext(adminUser);
            renderComponent();
            expect(screen.getByRole('link', { name: '🛠️ 管理後台' })).toBeInTheDocument();
        });

        it('當使用者角色非 `admin` 時，不應顯示「🛠️ 管理後台」的連結', async () => {
            mockAuthContext(normalUser);
            renderComponent();
            expect(screen.queryByRole('link', { name: '🛠️ 管理後台' })).not.toBeInTheDocument();
        });
    });

    describe('登出行為測試 (Logout Behavior Tests)', () => {
        it('點擊「登出」按鈕時，需呼叫 `logout()` 函式，並導向到 `/login` (帶有 `replace: true` 及 `state: null`)', async () => {
            mockAuthContext(normalUser);
            renderComponent();

            const logoutButton = screen.getByRole('button', { name: '登出' });
            await userEvent.click(logoutButton);

            expect(mockLogout).toHaveBeenCalledTimes(1);
            expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true, state: null });
        });
    });

    describe('資料載入與 API 測試 (Data Loading & API Tests)', () => {
        it('剛進入頁面請求資料時，應顯示載入中狀態 (spinner 與「載入商品中...」)', async () => {
            mockAuthContext(normalUser);
            // delay resolve to ensure we can see loading state
            let resolveApi: (value: any) => void;
            vi.mocked(productApi.getProducts).mockReturnValue(new Promise((resolve) => {
                resolveApi = resolve;
            }));

            renderComponent();

            expect(screen.getByText('載入商品中...')).toBeInTheDocument();

            resolveApi!(mockProducts);
        });

        it('當 `getProducts` 載入成功時，隱藏載入狀態並正確渲染各個商品的資料 (名稱、描述、價格)', async () => {
            mockAuthContext(normalUser);
            renderComponent();

            await waitFor(() => {
                expect(screen.queryByText('載入商品中...')).not.toBeInTheDocument();
            });

            expect(screen.getByText('Product A')).toBeInTheDocument();
            expect(screen.getByText('Desc A')).toBeInTheDocument();
            expect(screen.getByText('NT$ 100')).toBeInTheDocument();

            expect(screen.getByText('Product B')).toBeInTheDocument();
            expect(screen.getByText('NT$ 200')).toBeInTheDocument();
        });

        it('若 API 獲取資料發生 401 錯誤，需維持靜默不去設定錯誤，並交由 Axios 攔截器處理', async () => {
            mockAuthContext(normalUser);
            const apiError = { response: { status: 401 } };
            vi.mocked(productApi.getProducts).mockRejectedValueOnce(apiError);

            renderComponent();

            await waitFor(() => {
                expect(screen.queryByText('載入商品中...')).not.toBeInTheDocument();
            });

            // Make sure error banner is not shown
            const errorBanner = screen.queryByText((_, element) => {
                return element?.classList.contains('error-container') ?? false;
            });
            expect(errorBanner).not.toBeInTheDocument();
        });

        it('若 API 獲取資料發生非 401 的錯誤時，頁面應顯示對應的 API 或預設錯誤訊息 (例如：「無法載入商品資料」)', async () => {
            mockAuthContext(normalUser);
            const apiError = { response: { status: 500, data: { message: 'Custom API Error' } } };
            vi.mocked(productApi.getProducts).mockRejectedValueOnce(apiError);

            renderComponent();

            await waitFor(() => {
                expect(screen.queryByText('載入商品中...')).not.toBeInTheDocument();
            });

            expect(screen.getByText('Custom API Error')).toBeInTheDocument();
        });
    });
});
