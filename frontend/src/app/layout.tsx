import type { Metadata } from "next";
import { Inter } from "next/font/google"
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import { MessageProvider } from "@/components/message-provider"
import { NotificationProvider } from "@/components/notification-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Instagram",
  description: "Instagram clone built with Next.js and Tailwind CSS",
  icons: {
    icon: '/favicon.ico',
  },
};

import { isMobile } from "@/lib/isMobile"

export default async function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  const mobile = await isMobile()

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body data-mobile={mobile ? "1" : "0"} className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <MessageProvider>
              <NotificationProvider>
                {children}
                {!mobile && modal}
              </NotificationProvider>
            </MessageProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
