import type { Metadata } from "next";
import { Comfortaa } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";

const comfortaa = Comfortaa({
  subsets: ["latin"],
  variable: "--font-comfortaa",
  weight: ["300", "400", "500", "600", "700"],
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
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1"
        />
      </head>
      <body className={comfortaa.variable}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
