import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminPage } from './AdminPage';
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

describe('AdminPage 測試案例', () => {
    const mockLogout = vi.fn();
    const adminUser = { id: 1, email: 'admin@example.com', name: 'Admin', role: 'admin' as const };
    const normalUser = { id: 2, email: 'user@example.com', name: 'User', role: 'user' as const };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderComponent = () => render(
        <MemoryRouter>
            <AdminPage />
        </MemoryRouter>
    );

    describe('渲染測試 (Render Tests)', () => {
        it('正常渲染頁面標題、返回按鈕、以及「管理員專屬頁面」區塊', () => {
            vi.mocked(AuthContext.useAuth).mockReturnValue({
                user: adminUser,
                logout: mockLogout,
                isAuthenticated: true,
                login: vi.fn(),
                authExpiredMessage: '',
                clearAuthExpiredMessage: vi.fn(),
                token: 'mock-token',
                isLoading: false,
                checkAuth: vi.fn()
            } as any);

            renderComponent();
            
            expect(screen.getByRole('heading', { name: '🛠️ 管理後台' })).toBeInTheDocument();
            expect(screen.getByRole('link', { name: '← 返回' })).toBeInTheDocument();
            expect(screen.getByRole('heading', { name: '管理員專屬頁面' })).toBeInTheDocument();
        });

        it('若使用者角色為 `admin` 時，正確渲染「管理員」的 Badge', () => {
            vi.mocked(AuthContext.useAuth).mockReturnValue({
                user: adminUser,
                logout: mockLogout,
                isAuthenticated: true,
                login: vi.fn(),
                authExpiredMessage: '',
                clearAuthExpiredMessage: vi.fn(),
                token: 'mock-token',
                isLoading: false,
                checkAuth: vi.fn()
            } as any);

            renderComponent();
            expect(screen.getByText('管理員')).toBeInTheDocument();
        });

        it('若使用者角色不為 `admin` 時，正確渲染「一般用戶」的 Badge', () => {
            vi.mocked(AuthContext.useAuth).mockReturnValue({
                user: normalUser,
                logout: mockLogout,
                isAuthenticated: true,
                login: vi.fn(),
                authExpiredMessage: '',
                clearAuthExpiredMessage: vi.fn(),
                token: 'mock-token',
                isLoading: false,
                checkAuth: vi.fn()
            } as any);

            renderComponent();
            expect(screen.getByText('一般用戶')).toBeInTheDocument();
        });
    });

    describe('登出行為測試 (Logout Behavior Tests)', () => {
        it('點擊「登出」按鈕時，需呼叫 `logout()` 函式，並導向到 `/login` (帶有 `replace: true` 及 `state: null`)', async () => {
            vi.mocked(AuthContext.useAuth).mockReturnValue({
                user: adminUser,
                logout: mockLogout,
                isAuthenticated: true,
                login: vi.fn(),
                authExpiredMessage: '',
                clearAuthExpiredMessage: vi.fn(),
                token: 'mock-token',
                isLoading: false,
                checkAuth: vi.fn()
            } as any);

            renderComponent();
            
            const logoutButton = screen.getByRole('button', { name: '登出' });
            await userEvent.click(logoutButton);

            expect(mockLogout).toHaveBeenCalledTimes(1);
            expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true, state: null });
        });
    });
});
