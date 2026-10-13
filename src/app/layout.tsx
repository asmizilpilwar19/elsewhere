import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Manrope } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});
const sans = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  title: "ELSEWHERE — The world is not enough",
  description:
    "An immersive virtual travel experience. Explore imaginary destinations, surreal landscapes and places that feel like another world.",
  openGraph: {
    title: "ELSEWHERE — The world is not enough",
    description: "Somewhere beyond the familiar, another world is waiting.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#17294C",
  colorScheme: "light dark",
};

const themeScript = `try{var t=localStorage.getItem("elsewhere:theme");if(t==="night")document.documentElement.dataset.theme="night"}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <meta name="theme-color" content="#17294C" />
      </head>
      <body className="antialiased">
        <a
          href="#main"
          className="fixed left-4 top-4 z-[100] -translate-y-20 rounded-full bg-sand px-4 py-2 text-sm font-semibold text-midnight focus:translate-y-0"
        >
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
