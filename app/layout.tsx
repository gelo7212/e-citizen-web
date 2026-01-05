// Global styles
import '@/styles/globals.css';

export const metadata = {
  title: 'e-Citizen Platform',
  description: 'LGU e-Citizen Service Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#3B82F6" />
        {/* Google Material Icons */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined"
        />
      </head>
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}
