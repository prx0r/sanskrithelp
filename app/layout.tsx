import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Outfit, Noto_Sans_Devanagari } from "next/font/google";
import { Nav } from "@/components/Nav";
import { RagChatBar } from "@/components/RagChatBar";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});
const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });
const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-devanagari",
});

export const metadata: Metadata = {
  title: "Pāṇini — Sanskrit Grammar Engine",
  description: "Learn Sanskrit through Pāṇini's own formal system",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#2d1b4e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark bg-background" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add('dark');`,
          }}
        />
        <meta name="color-scheme" content="dark" />
        <link rel="icon" href="/icons/icon-192.png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={`${cormorant.variable} ${outfit.variable} ${notoDevanagari.variable} font-sans bg-background text-foreground min-h-screen antialiased`}>
        <Nav />
        <main className="max-w-4xl mx-auto px-4 py-6 pb-20 bg-background">{children}</main>
        <RagChatBar />
      </body>
    </html>
  );
}
