(() => {
  try {
    const stored = JSON.parse(
      localStorage.getItem('tro-oi-theme') || 'null',
    );
    const preference = stored?.state?.preference || 'system';
    const dark =
      preference === 'dark' ||
      (preference === 'system' &&
        matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  } catch {}
})();
