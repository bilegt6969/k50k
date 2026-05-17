'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

function readStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function writeStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // quota exceeded or private mode — ignore
  }
}

export function clearAdminSessionState(key: string) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(key)
  } catch {
    // ignore
  }
}

/**
 * Like useState but persists to sessionStorage so admin form values survive
 * sidebar navigation and browser back/forward within the same tab.
 */
export function useAdminSessionState<T>(
  key: string,
  initial: T | (() => T),
  options?: { debounceMs?: number }
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const debounceMs = options?.debounceMs ?? 300
  const initialRef = useRef(initial)
  const hydrated = useRef(false)

  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return typeof initialRef.current === 'function'
        ? (initialRef.current as () => T)()
        : initialRef.current
    }
    const stored = readStorage<T>(key)
    if (stored !== null) return stored
    return typeof initialRef.current === 'function'
      ? (initialRef.current as () => T)()
      : initialRef.current
  })

  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true
      const stored = readStorage<T>(key)
      if (stored !== null) setState(stored)
    }
  }, [key])

  useEffect(() => {
    if (!hydrated.current) return
    const id = window.setTimeout(() => writeStorage(key, state), debounceMs)
    return () => window.clearTimeout(id)
  }, [key, state, debounceMs])

  return [state, setState]
}

/** Persist a snapshot whenever `value` changes (debounced). */
export function usePersistAdminSession<T>(key: string, value: T, debounceMs = 300) {
  useEffect(() => {
    const id = window.setTimeout(() => writeStorage(key, value), debounceMs)
    return () => window.clearTimeout(id)
  }, [key, value, debounceMs])
}

export function readAdminSessionState<T>(key: string): T | null {
  return readStorage<T>(key)
}
