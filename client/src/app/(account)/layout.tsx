import { Header } from "@/components/layout/header";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-1 bg-zinc-50">{children}</main>
    </>
  );
}
