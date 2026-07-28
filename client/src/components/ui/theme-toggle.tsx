'use client';

import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useThemeStore } from '@/stores/theme-store';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const setPreference = useThemeStore((state) => state.setPreference);
  const setResolvedTheme = useThemeStore((state) => state.setResolvedTheme);

  const toggleTheme = () => {
    const nextTheme = document.documentElement.classList.contains('dark')
      ? 'light'
      : 'dark';
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    document.documentElement.style.colorScheme = nextTheme;
    setResolvedTheme(nextTheme);
    setPreference(nextTheme);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Chuyển giao diện sáng hoặc tối"
      title="Chuyển giao diện sáng hoặc tối"
      className={cn('shrink-0', className)}
      onClick={toggleTheme}
    >
      <Sun className="hidden h-5 w-5 dark:block" aria-hidden />
      <Moon className="h-5 w-5 dark:hidden" aria-hidden />
    </Button>
  );
}
