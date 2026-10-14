import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TelcoIQ | Customer Churn Analytics",
  description:
    "Retro-inspired telecom customer churn prediction and retention analytics dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
