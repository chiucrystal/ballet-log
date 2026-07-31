import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { Nav } from '@/components/nav'
import { getCorrections } from '@/lib/data'

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

export const metadata: Metadata = {
  title: 'Logbook',
  description: 'RAD Advanced Foundation — corrections and training log',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const corrections = await getCorrections()
  const exercises = corrections.exercises.map((e) => ({ code: e.code, name: e.name }))

  return (
    <html lang="en" className={`${displaySans.variable} ${bodySans.variable} ${GeistMono.variable} h-full antialiased`}>
      <body className="min-h-screen flex bg-background text-foreground">
        <Nav exercises={exercises} />
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
