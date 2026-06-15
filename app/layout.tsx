import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MZ Weather",
  description: "Weather search app with Supabase history"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
