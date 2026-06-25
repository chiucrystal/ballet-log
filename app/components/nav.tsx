'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Layers, ClipboardList, Dumbbell, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/themes', label: 'Themes', icon: Layers },
  { href: '/exercises', label: 'Exercises', icon: ClipboardList },
  { href: '/training', label: 'Training', icon: Dumbbell },
]

export function Nav() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col bg-background border-r border-border',
          'transition-transform duration-200 w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'md:sticky md:top-0 md:h-screen md:translate-x-0 md:transition-[width] md:duration-200',
          collapsed ? 'md:w-14' : 'md:w-56',
        )}
      >
        {/* Header */}
        <div className={cn(
          'flex h-14 shrink-0 items-center border-b border-border px-3',
          collapsed ? 'md:justify-center' : 'justify-between'
        )}>
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className={cn('font-heading text-xl truncate', collapsed && 'md:hidden')}
          >
            Ballet Log
          </Link>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex items-center justify-center p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Toggle sidebar"
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </button>

          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1 rounded text-muted-foreground hover:text-foreground"
            aria-label="Close menu"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-md text-sm transition-colors',
                'px-2 py-2',
                collapsed && 'md:justify-center md:px-0',
                pathname === href
                  ? 'bg-muted text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className={cn(collapsed && 'md:hidden')}>{label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-20 h-14 flex items-center gap-3 px-4 bg-background border-b border-border md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1 -ml-1 rounded text-muted-foreground hover:text-foreground"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>
        <Link href="/" className="font-heading text-xl">
          Ballet Log
        </Link>
      </div>
    </>
  )
}
