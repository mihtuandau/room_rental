'use client';

import { useState } from 'react';
import { Eye, Laptop, ShieldCheck, UserRound } from 'lucide-react';
import { ErrorState } from '@/components/ui/states';
import { Skeleton } from '@/components/ui/skeleton';
import { AccountSecurityView, type SecurityTab } from './account-security-view';
import { AccountIdentityCard, AccountView } from './account-view';
import { useProfile } from './hooks';

type AccountTab = 'profile' | 'security' | 'devices' | 'privacy';

const ACCOUNT_TABS: Array<{ value: AccountTab; label: string; icon: React.ReactNode }> = [
  { value: 'profile', label: 'Tài khoản', icon: <UserRound className="h-4 w-4" aria-hidden /> },
  { value: 'security', label: 'Bảo mật', icon: <ShieldCheck className="h-4 w-4" aria-hidden /> },
  { value: 'devices', label: 'Thiết bị', icon: <Laptop className="h-4 w-4" aria-hidden /> },
  { value: 'privacy', label: 'Quyền riêng tư', icon: <Eye className="h-4 w-4" aria-hidden /> },
];

export function AccountHubView({ initialTab = 'profile' }: { initialTab?: AccountTab }) {
  const { data: profile, isPending, isError, refetch } = useProfile();
  const [activeTab, setActiveTab] = useState<AccountTab>(initialTab);

  if (isPending) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-5">
      <AccountIdentityCard profile={profile} />
      <nav aria-label="Tài khoản" className="overflow-x-auto border-b border-zinc-200">
        <div role="tablist" className="flex min-w-max gap-1">
          {ACCOUNT_TABS.map(({ value, label, icon }) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={activeTab === value}
              onClick={() => setActiveTab(value)}
              className={`flex min-h-11 items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === value
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-zinc-600 hover:border-zinc-300 hover:text-zinc-900'
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </nav>

      <div role="tabpanel" tabIndex={-1} aria-label={ACCOUNT_TABS.find((tab) => tab.value === activeTab)?.label}>
        {activeTab === 'profile' && <AccountView showLogout={false} showIdentity={false} />}
        {activeTab === 'security' && (
          <AccountSecurityView navigationTabs={['password', 'two-factor'] as SecurityTab[]} />
        )}
        {activeTab === 'devices' && (
          <AccountSecurityView section="devices" showOverview={false} navigationTabs={[]} />
        )}
        {activeTab === 'privacy' && (
          <AccountSecurityView section="privacy" showOverview={false} navigationTabs={[]} />
        )}
      </div>
    </div>
  );
}
