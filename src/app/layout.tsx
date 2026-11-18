import type { Metadata, Viewport } from "next";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "SULAP — Suka Lapor RT",
  description: "Aplikasi pelaporan dan pemantauan masalah fasilitas lingkungan warga RT",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-[#EEF2EE] text-[#121915]">
        <QueryProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
