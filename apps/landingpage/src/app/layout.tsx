import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { BackgroundBlobs } from "@/components/background-blobs";

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
        <script async src="https://app.sandbox.midtrans.com/snap/snap.js" data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}></script>
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <Providers>
          <BackgroundBlobs />
          {children}
        </Providers>
      </body>
    </html>
  );
}
