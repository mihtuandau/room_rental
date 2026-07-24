/** "hoặc" rule between the Google button and the phone/password form. */
export function AuthDivider() {
  return (
    <div className="flex items-center gap-3" role="separator">
      <span className="h-px flex-1 bg-zinc-200" />
      <span className="text-xs text-zinc-500">hoặc</span>
      <span className="h-px flex-1 bg-zinc-200" />
    </div>
  );
}
