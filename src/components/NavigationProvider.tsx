'use client';

import { createContext, useContext, useRef, type ReactNode } from 'react';

interface NavCtx {
  getDir: () => number;
  setBackward: () => void;
  resetDir: () => void;
}

const NavigationContext = createContext<NavCtx>({
  getDir: () => 1,
  setBackward: () => {},
  resetDir: () => {},
});

export function NavigationProvider({ children }: { children: ReactNode }) {
  const dirRef = useRef(1);
  return (
    <NavigationContext.Provider value={{
      getDir:      () => dirRef.current,
      setBackward: () => { dirRef.current = -1; },
      resetDir:    () => { dirRef.current = 1; },
    }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigationDir() {
  return useContext(NavigationContext);
}
