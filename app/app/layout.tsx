import type { Metadata } from 'next'
import { Forum, Spline_Sans } from 'next/font/google'
import './globals.css'
import { Nav } from '@/components/nav'

const forum = Forum({
  weight: '400',
  variable: '--font-display',
  subsets: ['latin'],
})

const splineSans = Spline_Sans({
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Ballet Log',
  description: 'RAD Advanced Foundation — corrections and training log',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${forum.variable} ${splineSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Nav />
        <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
