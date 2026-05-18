import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { WhatsAppFloating } from "@/components/whatsapp-floating";
import Script from "next/script";
import { headers } from "next/headers";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  
  let tenantId: string | null = null;
  const parts = host.split('.');
  
  if (parts.length >= 2) {
    const subdomain = parts[0];
    if (subdomain !== 'www' && subdomain !== 'localhost' && !subdomain.includes(':')) {
      tenantId = subdomain;
    }
  }

  // Default SEO fallback
  let title = "Digital Premium — Premium Streaming Voucher System";
  let description = "Dapatkan akses premium untuk Netflix, Spotify, Disney+, dan layanan streaming lainnya dengan harga terjangkau dan proses instan.";
  let favicon = "/favicon.ico";

  if (tenantId) {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/public/settings`, {
        headers: { 'x-tenant-id': tenantId },
        next: { revalidate: 60 }, // Cache for 60 seconds
      });
      if (res.ok) {
        const data = await res.json();
        if (data.SITE_TITLE) {
          title = data.SITE_TITLE;
        }
        if (data.SITE_DESCRIPTION) {
          description = data.SITE_DESCRIPTION;
        }
        if (data.SITE_FAVICON) {
          favicon = data.SITE_FAVICON;
        }
      }
    } catch {
      // Silently fall back to default metadata
    }
  }

  return {
    title,
    description,
    keywords: ["streaming voucher", "netflix premium", "spotify premium", "digital premium"],
    icons: {
      icon: favicon,
    },
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  
  let tenantId: string | null = null;
  const parts = host.split('.');
  
  if (parts.length >= 2) {
    const subdomain = parts[0];
    if (subdomain !== 'www' && subdomain !== 'localhost' && !subdomain.includes(':')) {
      tenantId = subdomain;
    }
  }

  // Fetch theme CSS server-side to eliminate Flash of Unstyled Content (FOUC)
  let serverThemeCss: string | null = null;
  if (tenantId) {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/public/settings`, {
        headers: { 'x-tenant-id': tenantId },
        next: { revalidate: 60 }, // cache for 60s
      });
      if (res.ok) {
        const data = await res.json();
        if (data.LANDING_THEME_CSS) {
          serverThemeCss = data.LANDING_THEME_CSS;
        }
      }
    } catch {
      // silently fail — ThemeInjector client component will handle it
    }
  }

  return (
    <html lang="id" className={`${plusJakartaSans.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/*
          Blocking script: runs synchronously before first paint.
          Reads localStorage and applies dark/light class to <html> BEFORE
          React or next-themes hydrate — this is the only reliable fix for
          next-themes FOUC in Next.js App Router.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='light'){document.documentElement.classList.remove('dark')}else{document.documentElement.classList.add('dark')}}catch(e){}})();`,
          }}
        />
        {/* Inject tenant theme CSS server-side to prevent color-flash */}
        {serverThemeCss && (
          <style id="tenant-theme-css" dangerouslySetInnerHTML={{ __html: serverThemeCss }} />
        )}
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <Providers tenantId={tenantId} hostname={host}>
          {children}
          <WhatsAppFloating />
          {/* DOKU Checkout Scripts */}
          <Script src="https://sandbox.doku.com/jokul-checkout-js/v1/jokul-checkout-1.0.0.js" strategy="lazyOnload" />
          <Script src="https://doku.com/jokul-checkout-js/v1/jokul-checkout-1.0.0.js" strategy="lazyOnload" />
        </Providers>
      </body>
    </html>
  );
}
