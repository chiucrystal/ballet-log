"use client"

import { createContext, useContext, useState, useCallback, useRef } from "react"
import type { Exercise } from "@/lib/types"

type ExNavCtx = {
  exercises: Exercise[]
  activeCode: string
  scrollTo: (code: string) => void
  _register: (exercises: Exercise[], scrollTo: (code: string) => void) => void
  _setActive: (code: string) => void
  _unregister: () => void
}

const ExNavContext = createContext<ExNavCtx>({
  exercises: [],
  activeCode: "",
  scrollTo: () => {},
  _register: () => {},
  _setActive: () => {},
  _unregister: () => {},
})

export function ExNavProvider({ children }: { children: React.ReactNode }) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [activeCode, setActiveCode] = useState("")
  const scrollFnRef = useRef<(code: string) => void>(() => {})

  const register = useCallback((exs: Exercise[], scrollFn: (code: string) => void) => {
    setExercises(exs)
    scrollFnRef.current = scrollFn
  }, [])

  const unregister = useCallback(() => {
    setExercises([])
    setActiveCode("")
    scrollFnRef.current = () => {}
  }, [])

  return (
    <ExNavContext.Provider
      value={{
        exercises,
        activeCode,
        scrollTo: (code) => scrollFnRef.current(code),
        _register: register,
        _setActive: setActiveCode,
        _unregister: unregister,
      }}
    >
      {children}
    </ExNavContext.Provider>
  )
}

export function useExNav() {
  return useContext(ExNavContext)
}
