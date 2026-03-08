import type { Metadata } from "next";
import { Comfortaa, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { generateMetadata as genMeta, jsonLd } from "@/lib/seo";

const comfortaa = Comfortaa({
  subsets: ["latin"],
  variable: "--font-comfortaa",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = genMeta({});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Apply stored theme before React hydrates to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var p=window.location.pathname||'/';var themed=['/dashboard','/explore','/learn','/profile','/settings','/create-course'].some(function(prefix){return p===prefix||p.indexOf(prefix+'/')===0;});if(themed){var t=localStorage.getItem('thetutor-theme');document.documentElement.dataset.theme=t==='dark'?'dark':'light';}else{document.documentElement.dataset.theme='light';}}catch(e){document.documentElement.dataset.theme='light';}`,
          }}
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1"
        />
        <link rel="canonical" href={process.env.NEXT_PUBLIC_SITE_URL || "https://thetutor.app"} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd.organization) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd.website) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd.educationalOrganization) }}
        />
      </head>
      <body className={`${comfortaa.variable} ${playfair.variable}`}>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
