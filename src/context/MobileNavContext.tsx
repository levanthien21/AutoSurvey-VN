'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MobileNavContextType {
  isMobileDrawerOpen: boolean;
  openMobileDrawer: () => void;
  closeMobileDrawer: () => void;
  toggleMobileDrawer: () => void;
}

const MobileNavContext = createContext<MobileNavContextType | undefined>(undefined);

export function MobileNavProvider({ children }: { children: ReactNode }) {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  return (
    <MobileNavContext.Provider
      value={{
        isMobileDrawerOpen,
        openMobileDrawer: () => setIsMobileDrawerOpen(true),
        closeMobileDrawer: () => setIsMobileDrawerOpen(false),
        toggleMobileDrawer: () => setIsMobileDrawerOpen((prev) => !prev),
      }}
    >
      {children}
    </MobileNavContext.Provider>
  );
}

export function useMobileNav() {
  const context = useContext(MobileNavContext);
  if (!context) {
    return {
      isMobileDrawerOpen: false,
      openMobileDrawer: () => {},
      closeMobileDrawer: () => {},
      toggleMobileDrawer: () => {},
    };
  }
  return context;
}
