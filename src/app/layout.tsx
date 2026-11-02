import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Renaissance Kids Homeschool Hub",
  description: "Invitation-only beta for current Renaissance Kids families.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
