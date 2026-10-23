import type { Metadata, Viewport } from "next";
import { Bowlby_One, Bricolage_Grotesque } from "next/font/google";
import { Shell } from "@/components/shell";
import "./globals.css";

const display = Bowlby_One({ weight: "400", subsets: ["latin"], variable: "--f-display" });
const body = Bricolage_Grotesque({ subsets: ["latin"], variable: "--f-body" });

export const metadata: Metadata = {
  title: "Troublemaker-Board bei Trihow",
  description: "Wer ist der größte Troublemaker bei Trihow? Fälle melden, bestätigen lassen, Krone kassieren.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#f6f6f6" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${display.variable} ${body.variable}`}>
      <body className="antialiased">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
