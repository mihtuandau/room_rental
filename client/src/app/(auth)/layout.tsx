import { GoogleAuthProvider } from '@/providers/google-auth-provider';
import { AuthSplitLayout } from '@/features/auth/components/auth-split-layout';

/**
 * Bare, centred chrome for the auth screens — a "Đăng tin" button and a full
 * footer here would only distract from the one task. The logo links home so a
 * user who landed here by mistake can get back out.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <GoogleAuthProvider>
      <AuthSplitLayout>{children}</AuthSplitLayout>
    </GoogleAuthProvider>
  );
}
