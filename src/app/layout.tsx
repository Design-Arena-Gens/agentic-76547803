import "./globals.css";
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Agentic Viral Automation",
  description:
    "Design, simulate, and launch AI automation workflows for viral Instagram content with multi-platform autoposting.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-surface text-slate-50`}>
        <Providers>
          <div className="relative min-h-screen">
            <div className="absolute inset-0 -z-10 overflow-hidden">
              <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
              <div className="absolute bottom-0 left-[-8rem] h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
            </div>
            <main className="mx-auto max-w-6xl px-4 pb-16 pt-10">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
