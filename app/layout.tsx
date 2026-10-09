import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Achudami — Automated University Certificate Generation Portal",
  description:
    "Pixel-perfect automated certificate generation engine for university acceptance letters with 100% vector fidelity and zero visual drift.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
