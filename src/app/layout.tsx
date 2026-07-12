import type { Metadata, Viewport } from "next";
import { Inter, Lora } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SessionProvider } from "@/components/providers/SessionProvider";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Parakletos — Bible Study",
    template: "%s | Parakletos",
  },
  description:
    "A powerful, beautiful Bible study app with multiple translations, highlights, notes, and deep study tools.",
  keywords: ["Bible", "Bible study", "scripture", "devotional", "commentary"],
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Parakletos" },
};

export const viewport: Viewport = {
  themeColor: "#4051b5",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${lora.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider>
            {children}
            <Toaster richColors position="top-center" />
            <ServiceWorkerRegister />
            <Analytics />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
