import type { Metadata } from "next";
import { Nunito, Pacifico } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

const body = Nunito({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const display = Pacifico({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "EsthyPyaourt — Gestion de stock & commandes",
  description:
    "EsthyPyaourt par P.Aktion — Yaourt vanille & arachide, formats 250 ml et 500 ml. Disponible à Kinshasa.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${body.variable} ${display.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border bg-white/70">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} EsthyPyaourt — produit P.Aktion
            </p>
            <p>
              WhatsApp +243 813 808 744 · Kinshasa · @esthypyaourt
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
