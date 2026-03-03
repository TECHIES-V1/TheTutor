import type { Metadata } from "next";
import { Comfortaa, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const comfortaa = Comfortaa({
  subsets: ["latin"],
  variable: "--font-comfortaa",
  weight: ["300", "400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "TheTutor - AI-Powered Personalized Learning",
  description:
    "Experience AI-powered education that adapts to your pace, learning style, and goals. From curriculum generation to verified certificates, all personalized for you.",
  keywords: [
    "AI learning",
    "personalized education",
    "online courses",
    "Amazon Nova",
  ],
  openGraph: {
    title: "TheTutor - AI-Powered Personalized Learning",
    description:
      "Experience AI-powered education that adapts to your pace, learning style, and goals.",
    type: "website",
  },
};

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
            __html: `try{var p=window.location.pathname||'/';var themed=['/dashboard','/explore','/learn','/profile','/settings'].some(function(prefix){return p===prefix||p.indexOf(prefix+'/')===0;});if(themed){var t=localStorage.getItem('thetutor-theme');document.documentElement.dataset.theme=(t==='dark'||t==='light')?t:'light';}else{document.documentElement.dataset.theme='light';}}catch(e){document.documentElement.dataset.theme='light';}`,
          }}
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1"
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
