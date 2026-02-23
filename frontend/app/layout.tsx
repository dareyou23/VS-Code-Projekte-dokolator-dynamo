import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dokolator - Doppelkopf Statistiken",
  description: "Mobile Doppelkopf Statistiken und Abrechnung",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {children}
      </body>
    </html>
  );
}
