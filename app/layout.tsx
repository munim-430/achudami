import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Achudami | Pixel-Perfect Client-Side PDF Text Modifier",
  description:
    "White-out and redraw targeted PDF text fields with 100% pixel-perfect font, layout, and coordinate calibration using pdf-lib on Next.js.",
  keywords: [
    "Next.js",
    "pdf-lib",
    "PDF editor",
    "client-side PDF",
    "pixel perfect",
    "white-out",
    "typography",
  ],
  authors: [{ name: "munim-430" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
