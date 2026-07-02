'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, Layers, ClipboardList, Dumbbell, BookText, ListMusic,
  ChevronLeft, ChevronRight, ChevronDown, Menu, X,
} from 'lucide-react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useExNav } from '@/context/exercises-nav'
import { EXERCISES_TREE } from '@/lib/exercises-tree'
import type { Exercise } from '@/lib/types'

const NAV_WIDTH_DEFAULT = 224
const NAV_WIDTH_MIN = 160
const NAV_WIDTH_MAX = 480

const navLinks = [
  { href: '/', label: 'Home', icon: Home, children: undefined as { href: string; label: string }[] | undefined },
  { href: '/themes', label: 'Themes', icon: Layers, children: undefined },
  { href: '/exercises', label: 'Syllabus', icon: ClipboardList, children: undefined },
  { href: '/training', label: 'Home Exercises', icon: Dumbbell, children: undefined },
  { href: '/combinations', label: 'Combinations', icon: ListMusic, children: undefined },
  {
    href: '/terminology',
    label: 'Terminology',
    icon: BookText,
    children: [{ href: '/terminology/flashcards', label: 'Flash Cards' }],
  },
]

function ExerciseTree({
  exercises,
  activeCode,
  onSelect,
}: {
  exercises: Exercise[]
  activeCode: string
  onSelect: (code: string) => void
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  return (
    <div className="mt-1 space-y-2">
      {EXERCISES_TREE.map((cat) => {
        const isCollapsed = collapsed[cat.category]
        return (
          <div key={cat.category}>
            <button
              onClick={() => setCollapsed((prev) => ({ ...prev, [cat.category]: !prev[cat.category] }))}
              className="flex w-full items-center justify-between px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <span>{cat.category}</span>
              <ChevronDown
                className={cn('size-3 shrink-0 transition-transform', isCollapsed && '-rotate-90')}
              />
            </button>

            {!isCollapsed && (
              <div className="ml-2 space-y-2">
                {cat.subgroups.map((sg) => {
                  const sgExercises = sg.codes
                    .map((code) => exercises.find((e) => e.code === code))
                    .filter(Boolean) as Exercise[]

                  return (
                    <div key={sg.name ?? '__flat__'}>
                      {sg.name && (
                        <p className="px-2 pt-1 pb-0.5 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                          {sg.name}
                        </p>
                      )}
                      {sgExercises.map((ex) => (
                        <button
                          key={ex.code}
                          onClick={() => onSelect(ex.code)}
                          title={`${ex.name} (${ex.code})`}
                          className={cn(
                            'flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-xs transition-colors',
                            activeCode === ex.code
                              ? 'bg-accent text-accent-foreground font-medium'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                          )}
                        >
                          <span className="truncate">{ex.name}</span>
                          <span className="shrink-0 text-[10px] opacity-50">{ex.code}</span>
                        </button>
                      ))}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function Nav() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [navWidth, setNavWidth] = useState(NAV_WIDTH_DEFAULT)
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef<{ x: number; width: number } | null>(null)
  const pathname = usePathname()
  const { exercises, activeCode, scrollTo } = useExNav()

  const onExerciseSelect = (code: string) => {
    scrollTo(code)
    setMobileOpen(false)
  }

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
          'relative fixed inset-y-0 left-0 z-40 flex flex-col bg-background border-r border-border',
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
          {navLinks.map(({ href, label, icon: Icon, children }) => {
            const parentActive = pathname === href || (!!children && pathname.startsWith(href + '/'))
            const isExercisesLink = href === '/exercises'
            const showExerciseTree = isExercisesLink && parentActive && exercises.length > 0

            return (
              <div key={href}>
                <Link
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? label : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-md text-sm transition-colors',
                    'px-2 py-2',
                    collapsed && 'md:justify-center md:px-0',
                    parentActive
                      ? 'bg-muted text-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className={cn(collapsed && 'md:hidden')}>{label}</span>
                </Link>

                {/* Exercise tree — shown in nav when on Syllabus page */}
                {showExerciseTree && (
                  <div className={cn('ml-7 mt-1', collapsed && 'md:hidden')}>
                    <ExerciseTree
                      exercises={exercises}
                      activeCode={activeCode}
                      onSelect={onExerciseSelect}
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
                          'flex items-center rounded-md text-xs px-2 py-1.5 transition-colors',
                          pathname === child.href
                            ? 'text-foreground font-medium bg-muted'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
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
              isDragging ? 'bg-primary/40' : 'bg-transparent group-hover:bg-primary/30'
            )} />
          </div>
        )}
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
