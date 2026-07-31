'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, Layers, ClipboardList, Dumbbell, BookText, ListMusic, Footprints,
  ChevronLeft, ChevronRight, Menu, X,
} from 'lucide-react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { EXERCISES_TREE, getClassBySlug, slugify } from '@/lib/exercises-tree'

const NAV_WIDTH_DEFAULT = 224
const NAV_WIDTH_MIN = 160
const NAV_WIDTH_MAX = 480

const navLinks = [
  { href: '/', label: 'Home', icon: Home, children: undefined as { href: string; label: string }[] | undefined },
  { href: '/themes', label: 'Themes', icon: Layers, children: undefined },
  { href: '/exercises', label: 'Syllabus', icon: ClipboardList, children: undefined },
  { href: '/training', label: 'Home Exercises', icon: Dumbbell, children: undefined },
  { href: '/combinations', label: 'Combinations', icon: ListMusic, children: undefined },
  { href: '/pointe-shoes', label: 'Pointe Shoes', icon: Footprints, children: undefined },
  {
    href: '/terminology',
    label: 'Terminology',
    icon: BookText,
    children: [{ href: '/terminology/flashcards', label: 'Flash Cards' }],
  },
]

// Drill-down nav: shows only the children of wherever the user currently is
// in the syllabus (classes → sections → exercises), mirroring the page
// breadcrumbs (Syllabus > Class > Section > Exercise) instead of one long tree.
function SyllabusNav({
  pathname,
  exercises,
  onNavigate,
}: {
  pathname: string
  exercises: { code: string; name: string }[]
  onNavigate: () => void
}) {
  const segments = pathname.slice('/exercises'.length).split('/').filter(Boolean)

  const linkClass = (active: boolean) =>
    cn(
      'flex items-center gap-1.5 rounded-sm px-2 py-1.5 text-xs transition-colors',
      active
        ? 'bg-sidebar-accent text-sidebar-foreground font-medium'
        : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
    )

  if (segments.length === 0) {
    return (
      <div className="mt-1 space-y-0.5">
        {EXERCISES_TREE.map((cat) => (
          <Link
            key={cat.category}
            href={`/exercises/${slugify(cat.category)}`}
            onClick={onNavigate}
            className={linkClass(false)}
          >
            <span className="truncate">{cat.category}</span>
          </Link>
        ))}
      </div>
    )
  }

  const cls = getClassBySlug(segments[0])
  if (!cls) return null

  if (segments.length === 1) {
    return (
      <div className="mt-1 space-y-0.5">
        {cls.subgroups.map((sg) => (
          <Link
            key={sg.name}
            href={`/exercises/${segments[0]}/${slugify(sg.name)}`}
            onClick={onNavigate}
            className={linkClass(false)}
          >
            <span className="truncate">{sg.name}</span>
          </Link>
        ))}
      </div>
    )
  }

  const section = cls.subgroups.find((sg) => slugify(sg.name) === segments[1])
  if (!section) return null

  const activeCode = segments[2]

  return (
    <div className="mt-1 space-y-0.5">
      <p className="px-2 pb-0.5 font-mono text-[9px] font-medium uppercase tracking-widest text-sidebar-foreground/50">
        {section.name}
      </p>
      {section.codes.map((code) => {
        const ex = exercises.find((e) => e.code === code)
        return (
          <Link
            key={code}
            href={`/exercises/${segments[0]}/${segments[1]}/${code}`}
            onClick={onNavigate}
            title={`${ex?.name ?? code} (${code})`}
            className={linkClass(activeCode === code)}
          >
            <span className="truncate">{ex?.name ?? code}</span>
            <span className="shrink-0 text-[10px] opacity-50">{code}</span>
          </Link>
        )
      })}
    </div>
  )
}

export function Nav({ exercises }: { exercises: { code: string; name: string }[] }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [navWidth, setNavWidth] = useState(NAV_WIDTH_DEFAULT)
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef<{ x: number; width: number } | null>(null)
  const pathname = usePathname()

  const onResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragStart.current = { x: e.clientX, width: navWidth }
    setIsDragging(true)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [navWidth])

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragStart.current) return
      const delta = e.clientX - dragStart.current.x
      setNavWidth(Math.max(NAV_WIDTH_MIN, Math.min(NAV_WIDTH_MAX, dragStart.current.width + delta)))
    }
    function onMouseUp() {
      if (!dragStart.current) return
      dragStart.current = null
      setIsDragging(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

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
          'relative fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar border-r border-sidebar-border',
          'transition-transform duration-200 w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'md:sticky md:top-0 md:h-screen md:translate-x-0',
          !isDragging && 'md:transition-[width] md:duration-200',
          collapsed ? 'md:w-14' : '',
        )}
        style={!collapsed ? { width: navWidth } : undefined}
      >
        {/* Header */}
        <div className={cn(
          'flex h-14 shrink-0 items-center border-b border-sidebar-border px-3',
          collapsed ? 'md:justify-center' : 'justify-between'
        )}>
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className={cn('font-mono text-xl text-sidebar-foreground truncate', collapsed && 'md:hidden')}
          >
            Logbook
          </Link>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex items-center justify-center p-1 rounded text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            aria-label="Toggle sidebar"
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </button>

          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1 rounded text-sidebar-foreground/70 hover:text-sidebar-foreground"
            aria-label="Close menu"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {navLinks.map(({ href, label, icon: Icon, children }) => {
            const parentActive = pathname === href || pathname.startsWith(href + '/')
            const isExercisesLink = href === '/exercises'
            const showSyllabusNav = isExercisesLink && parentActive

            return (
              <div key={href}>
                <Link
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? label : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-sm border-l-2 border-transparent font-mono text-sm transition-colors',
                    'px-2 py-2',
                    collapsed && 'md:justify-center md:px-0',
                    parentActive
                      ? 'border-sidebar-primary bg-sidebar-accent text-sidebar-foreground font-medium'
                      : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className={cn(collapsed && 'md:hidden')}>{label}</span>
                </Link>

                {/* Syllabus drill-down — shown in nav when on the Syllabus pages */}
                {showSyllabusNav && (
                  <div className={cn('ml-7 mt-1', collapsed && 'md:hidden')}>
                    <SyllabusNav
                      pathname={pathname}
                      exercises={exercises}
                      onNavigate={() => setMobileOpen(false)}
                    />
                  </div>
                )}

                {/* Terminology children */}
                {children && (
                  <div className={cn('ml-7 mt-0.5 space-y-0.5', collapsed && 'md:hidden')}>
                    {children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          'flex items-center rounded-sm font-mono text-xs px-2 py-1.5 transition-colors',
                          pathname === child.href
                            ? 'text-sidebar-foreground font-medium bg-sidebar-accent'
                            : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Resize handle — desktop only, hidden when collapsed */}
        {!collapsed && (
          <div
            onMouseDown={onResizeStart}
            className="group absolute inset-y-0 right-0 hidden w-3 -mr-1.5 cursor-col-resize md:flex items-stretch justify-center z-10"
          >
            <div className={cn(
              'w-px transition-colors',
              isDragging ? 'bg-sidebar-primary/40' : 'bg-transparent group-hover:bg-sidebar-primary/30'
            )} />
          </div>
        )}
      </aside>

      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-20 h-14 flex items-center gap-3 px-4 bg-sidebar border-b border-sidebar-border md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1 -ml-1 rounded text-sidebar-foreground/70 hover:text-sidebar-foreground"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>
        <Link href="/" className="font-mono text-xl text-sidebar-foreground">
          Logbook
        </Link>
      </div>
    </>
  )
}
