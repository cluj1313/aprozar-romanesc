import {
  createRootRoute,
  HeadContent,
  Link,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/auth/provider";
import { AppViewport } from "@/components/app-viewport";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { SplashScreen } from "@/components/splash-screen";
import { ThemeSync } from "@/components/theme-sync";
import { queryClient } from "@/lib/query-client";
import appCss from "../styles.css?url";

const APP_NAME = "Aprozar Românesc";

export const Route = createRootRoute({
  notFoundComponent: () => (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-fg">
      <p className="font-display text-2xl font-semibold">Pagina nu e pe tarabă</p>
      <Link to="/" className="font-semibold text-primary">
        Înapoi acasă
      </Link>
    </div>
  ),
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: APP_NAME },
      {
        name: "description",
        content:
          "Aprozar Românesc — 100% românesc, direct din grădină. Producători apropiați, produse de casă, prețul se vede mereu.",
      },
      { name: "theme-color", content: "#1B5E20" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png" },
      { rel: "icon", type: "image/png", href: "/images/logo-badge.png" },
      { rel: "apple-touch-icon", href: "/icon-180.png" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Barlow:wght@300;400;500;600;700&family=Barlow+Condensed:wght@600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Sans+Condensed:wght@600;700&family=Nunito:wght@400;600;700&display=swap",
      },
    ],
  }),
  component: () => (
    <html lang="ro" suppressHydrationWarning className="antialiased" data-font="oswald">
      <head>
        <HeadContent />
      </head>
      <body className="overflow-hidden">
        <PreviewHostBridge />
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ThemeSync />
            <AppViewport />
            <SplashScreen />
            <Outlet />
          </AuthProvider>
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  ),
});
