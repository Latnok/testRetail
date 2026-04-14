import "./globals.css";

export const metadata = {
  title: "Retail Orders Dashboard",
  description: "Material dashboard for orders stored in Supabase"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
