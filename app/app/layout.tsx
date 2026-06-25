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
      <body className="min-h-screen flex bg-background text-foreground">
        <Nav />
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Spacer for mobile fixed top bar */}
          <div className="h-14 shrink-0 md:hidden" />
          <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
