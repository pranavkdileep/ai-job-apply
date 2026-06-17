import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Job Apply | Autonomous Job Search Assistant",
  description:
    "Draft, tailor, and send job application emails powered by AI. Uses your Gmail account to send personalized applications directly. Requires Gmail send permission to deliver emails on your behalf.",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AI Job Apply",
  },
};

export const viewport: Viewport = {
  themeColor: "#0E0E0E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full antialiased flex flex-col">
        {children}
      </body>
    </html>
  );
}
