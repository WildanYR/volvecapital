import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { BackgroundBlobs } from "@/components/background-blobs";
import { WhatsAppFloating } from "@/components/whatsapp-floating";
import Script from "next/script";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${outfit.variable} h-full antialiased dark`}>
      <head>
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <Providers>
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
