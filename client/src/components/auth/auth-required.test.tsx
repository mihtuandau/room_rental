import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthRequired } from './auth-required';

const authState = vi.hoisted(() => ({
  isBootstrapped: true,
  accessToken: null as string | null,
}));
const replace = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  usePathname: () => '/account',
  useRouter: () => ({ replace }),
}));

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector: (state: typeof authState) => unknown) =>
    selector(authState),
}));

describe('AuthRequired', () => {
  beforeEach(() => {
    authState.isBootstrapped = true;
    authState.accessToken = null;
    replace.mockReset();
  });

  it('shows a sign-in action instead of private content for guests', () => {
    render(
      <AuthRequired nextPath="/account">
        <div>private content</div>
      </AuthRequired>,
    );

    expect(screen.getByRole('heading', { name: 'Đăng nhập để tiếp tục' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Đăng nhập' })).toHaveAttribute(
      'href',
      '/login?next=%2Faccount',
    );
    expect(screen.queryByText('private content')).not.toBeInTheDocument();
  });

  it('renders private content once the session is available', () => {
    authState.accessToken = 'access-token';

    render(
      <AuthRequired>
        <div>private content</div>
      </AuthRequired>,
    );

    expect(screen.getByText('private content')).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
