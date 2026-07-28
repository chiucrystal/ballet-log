import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Nav } from '@/components/nav'
import { ExNavProvider } from '@/context/exercises-nav'

const displaySans = Inter({
  weight: '500',
  variable: '--font-display',
  subsets: ['latin'],
})

const bodySans = Inter({
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  subsets: ['latin'],
})

const monoCaps = JetBrains_Mono({
  weight: ['400', '500'],
  variable: '--font-mono',
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
    <html lang="en" className={`${displaySans.variable} ${bodySans.variable} ${monoCaps.variable} h-full antialiased`}>
      <body className="min-h-screen flex bg-background text-foreground">
        <ExNavProvider>
          <Nav />
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Spacer for mobile fixed top bar */}
            <div className="h-14 shrink-0 md:hidden" />
            <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 py-8">
              {children}
            </main>
          </div>
        </ExNavProvider>
      </body>
    </html>
  )
}
