import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TRPCProvider } from "@/components/trpc-provider";
import { CookieNotice } from "@/components/cookie-notice";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "NovaCRM — The Easiest CRM Builder in the World",
    template: "%s | NovaCRM",
  },
  description:
    "Build a fully custom CRM in minutes, no code required. Drag-and-drop tables, pipelines, automations, and an AI CRM Builder that sets everything up for you.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TRPCProvider>
            <TooltipProvider>{children}</TooltipProvider>
            <CookieNotice />
          </TRPCProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
