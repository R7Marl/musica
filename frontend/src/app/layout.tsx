import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://qfit.app";
const googleTagId =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ??
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const googleAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "QFit",
  authors: [{ name: "QFit" }],
  creator: "QFit",
  publisher: "QFit",
  category: "Music software",
  title: {
    default: "QFit | Musica dinamica para locales, gimnasios y bares",
    template: "%s | QFit",
  },
  description:
    "QFit es una plataforma gratuita para implementar musica dinamica en locales, gimnasios, bares y salas: tus clientes piden canciones con QR y tu negocio controla la playlist desde un panel simple.",
  keywords: [
    "musica dinamica para locales",
    "musica dinamica para negocios",
    "playlist colaborativa",
    "playlist colaborativa para locales",
    "musica para gimnasios",
    "musica para bares",
    "musica para salones",
    "QR musical",
    "sistema de musica con QR",
    "pedir canciones con QR",
    "player para local",
    "software para musica ambiental",
    "musica interactiva para clientes",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "QFit | Musica dinamica para locales, gimnasios y bares",
    description:
      "Registra tu negocio gratis y deja que tus clientes pidan canciones con QR mientras vos controlas la playlist.",
    url: "/",
    siteName: "QFit",
    locale: "es_AR",
    type: "website",
    images: [
      {
        url: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&h=630&q=82",
        width: 1200,
        height: 630,
        alt: "Personas entrenando con musica dinamica en un local",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "QFit | Musica dinamica para locales",
    description:
      "Tus clientes piden canciones con QR y tu negocio controla la playlist desde un panel simple.",
    images: [
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&h=630&q=82",
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <script
          async
          defer
          id="google-identity-services"
          src="https://accounts.google.com/gsi/client"
        />
        {googleTagId ? (
          <>
            <Script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${googleTagId}`}
              strategy="afterInteractive"
            />
            <Script id="google-ads-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                ${gaMeasurementId ? `gtag('config', '${gaMeasurementId}');` : ""}
                ${googleAdsId ? `gtag('config', '${googleAdsId}');` : ""}
              `}
            </Script>
          </>
        ) : null}
      </head>
      <body>{children}</body>
    </html>
  );
}
