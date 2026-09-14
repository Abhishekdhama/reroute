"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { CommandPalette } from "@/components/layout/command-palette";
import { IconButton } from "@/components/ui/button";
import { CloseIcon, RerouteIcon, SearchIcon } from "@/components/ui/icons";

export function AppShell({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-base">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:border focus:border-line-strong focus:bg-surface focus:px-3 focus:py-1.5 focus:text-body focus:text-ink"
      >
        Skip to content
      </a>
      <aside className="hidden w-[232px] shrink-0 lg:block">
        <Sidebar onOpenCommandPalette={() => setPaletteOpen(true)} />
      </aside>

      {drawerOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-base/75" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 w-[260px]">
            <Sidebar
              onNavigate={() => setDrawerOpen(false)}
              onOpenCommandPalette={() => {
                setDrawerOpen(false);
                setPaletteOpen(true);
              }}
            />
          </div>
          <IconButton
            label="Close navigation"
            onClick={() => setDrawerOpen(false)}
            className="absolute left-[272px] top-3"
          >
            <CloseIcon />
          </IconButton>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-12 shrink-0 items-center gap-2 border-b border-line bg-surface px-3 lg:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-line-strong text-ink-muted"
          >
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
              <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" strokeLinecap="round" />
            </svg>
          </button>
          <span className="flex items-center gap-1.5 text-body font-semibold text-ink">
            <RerouteIcon width={13} height={13} className="text-brand" />
            Reroute
          </span>
          <IconButton label="Search" onClick={() => setPaletteOpen(true)} className="ml-auto">
            <SearchIcon width={13} height={13} />
          </IconButton>
        </div>
        <main id="main" tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
