import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider } from "@/context/ThemeContext";

export const metadata: Metadata = {
  title: "Agri-App — Tractor Bill Management & Fleet Operations",
  description: "Enterprise Agri Fleet Billing, Work Ledger, and Real-Time Telemetry with MongoDB Atlas",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/app-logo-192.png?v=3", sizes: "192x192", type: "image/png" },
      { url: "/icons/app-logo-512.png?v=3", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png?v=3", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Agri-App",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#1fa85a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#1fa85a" />
        <script
          id="pwa-service-worker-register"
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(reg) {
                    console.log('Agri-App Service Worker registered with scope: ' + reg.scope);
                  }).catch(function(err) {
                    console.warn('Agri-App Service Worker registration failed: ' + err);
                  });
                });
              }
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased bg-slate-50 dark:bg-[#080c14] text-slate-900 dark:text-slate-100 min-h-screen selection:bg-emerald-500 selection:text-black transition-colors duration-200">
        <ThemeProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
