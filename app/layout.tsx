import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Placement Portal | GBPUAT",
  description: "The central placement workspace for GBPUAT students and coordinators.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
