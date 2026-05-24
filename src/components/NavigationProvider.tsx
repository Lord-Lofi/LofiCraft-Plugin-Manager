'use client';

import { createContext, useContext, useMemo, useRef, type ReactNode } from 'react';

type NavGuard = ((nav: () => void) => void) | null;

interface NavCtx {
  getDir: () => number;
  setBackward: () => void;
  resetDir: () => void;
  setGuard: (guard: NavGuard) => void;
  callGuard: (nav: () => void) => void;
}

const NavigationContext = createContext<NavCtx>({
  getDir: () => 1,
  setBackward: () => {},
  resetDir: () => {},
  setGuard: () => {},
  callGuard: (nav) => nav(),
});

export function NavigationProvider({ children }: { children: ReactNode }) {
  const dirRef = useRef(1);
  const guardRef = useRef<NavGuard>(null);

  const value = useMemo<NavCtx>(() => ({
    getDir:      () => dirRef.current,
    setBackward: () => { dirRef.current = -1; },
    resetDir:    () => { dirRef.current = 1; },
    setGuard:    (guard) => { guardRef.current = guard; },
    callGuard:   (nav) => { guardRef.current ? guardRef.current(nav) : nav(); },
  }), []);

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigationDir() {
  return useContext(NavigationContext);
}
