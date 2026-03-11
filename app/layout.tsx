import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://comunicaciones-baseball.vercel.app"),
  title: "Comunicaciones Baseball",
  description: "Sitio oficial bilingue del equipo de beisbol Comunicaciones.",
  openGraph: {
    title: "Comunicaciones Baseball",
    description: "Roster, calendario, noticias, estadisticas y panel de administracion.",
    siteName: "Comunicaciones Baseball"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
