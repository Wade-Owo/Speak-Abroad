// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext"; // <-- Import the provider

export const metadata: Metadata = {
  title: "SpeakAbroad",
  description:
    "AI roleplay scenarios that help international students build confidence through real conversations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-slate-50 text-slate-900">
        {/* Wrap your app so every page has access to the user state */}
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}