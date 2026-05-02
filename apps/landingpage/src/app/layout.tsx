import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { BackgroundBlobs } from "@/components/background-blobs";
import { WhatsAppFloating } from "@/components/whatsapp-floating";
import Script from "next/script";
import { headers } from "next/headers";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Volve Capital — Premium Streaming Voucher System",
  description: "Dapatkan akses premium untuk Netflix, Spotify, Disney+, dan layanan streaming lainnya dengan harga terjangkau dan proses instan.",
  keywords: ["streaming voucher", "netflix premium", "spotify premium", "volve capital"],
  openGraph: {
    title: "Volve Capital — Premium Streaming Voucher",
    description: "Sistem voucher streaming otomatis, cepat, dan terpercaya.",
    type: "website",
  },
};

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

  return (
    <html lang="id" className={`${outfit.variable} h-full antialiased`}>
      <head>
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <Providers tenantId={tenantId} hostname={host}>
          <BackgroundBlobs />
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
