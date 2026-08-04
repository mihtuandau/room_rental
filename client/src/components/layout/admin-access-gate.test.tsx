import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminAccessGate } from './admin-access-gate';

const profileState = vi.hoisted(() => ({
  profile: { role: 'user' as string },
  isError: false,
  isPending: false,
}));

vi.mock('@/features/users/hooks', () => ({
  useProfile: () => ({
    data: profileState.profile,
    error: null,
    isError: profileState.isError,
    isPending: profileState.isPending,
    refetch: vi.fn(),
  }),
}));

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector: (state: { isBootstrapped: boolean }) => unknown) =>
    selector({ isBootstrapped: true }),
  useIsSignedIn: () => true,
}));

describe('AdminAccessGate', () => {
  beforeEach(() => {
    profileState.profile = { role: 'user' };
    profileState.isError = false;
    profileState.isPending = false;
  });

  it('denies non-admin profiles', () => {
    render(<AdminAccessGate><div>admin content</div></AdminAccessGate>);
    expect(screen.getByText(/không có quyền truy cập/i)).toBeInTheDocument();
    expect(screen.queryByText('admin content')).not.toBeInTheDocument();
  });

  it('renders admin content for admin profiles', () => {
    profileState.profile = { role: 'admin' };
    render(<AdminAccessGate><div>admin content</div></AdminAccessGate>);
    expect(screen.getByText('admin content')).toBeInTheDocument();
  });
});
