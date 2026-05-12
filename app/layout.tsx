import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Lednice Marketing Kalendář',
  description: 'Roční marketingový plán pro Pivovar Lednice a Resort Lednice',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, background: '#faf9f6', minHeight: '100vh' }}>{children}</body>
    </html>
  )
}
