import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata = {
  title: "Dairy Farm Management",
  description: "Manage milk collection, payments, and reporting",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
