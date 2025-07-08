import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ClientErrorBoundary from "./ClientErrorBoundary";
import QueryProvider from "@/components/QueryProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ClearMatch AI",
  description: "Contact Relationship Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <ClientErrorBoundary>{children}</ClientErrorBoundary>
        </QueryProvider>
      </body>
    </html>
  );
}
