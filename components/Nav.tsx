"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, Menu, Gamepad2, BookMarked, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { LearnOverlay } from "@/components/LearnOverlay";

const MAIN_TABS: Array<
  | { href: string; label: string; icon: typeof Home | typeof Zap | typeof BookMarked | typeof Gamepad2; isOverlay: false }
  | { label: string; icon: null; isOverlay: true }
> = [
  { href: "/", label: "Home", icon: Home, isOverlay: false },
  { label: "Learn", icon: null, isOverlay: true },
  { href: "/drill", label: "Drill", icon: Zap, isOverlay: false },
  { href: "/content", label: "Content", icon: BookMarked, isOverlay: false },
  { href: "/games", label: "Games", icon: Gamepad2, isOverlay: false },
];

const MOBILE_MENU_LINKS = [
  { href: "/", label: "Home" },
  { href: "/learn/", label: "Learn hub" },
  { href: "/drill", label: "Drill" },
  { href: "/content", label: "Content" },
  { href: "/games", label: "Games" },
];

export function Nav() {
  const path = usePathname() ?? "/";
  const [learnOverlayOpen, setLearnOverlayOpen] = useState(false);

  const isLearnActive = path.startsWith("/learn");

  return (
    <>
      <nav className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-center">
          <div className="flex items-center gap-1 sm:gap-2">
            {MAIN_TABS.map((tab) => {
              if (tab.isOverlay) {
                return (
                  <button
                    key="learn"
                    type="button"
                    onClick={() => setLearnOverlayOpen(true)}
                    className={cn(
                      "flex items-center gap-1 px-3 py-2 rounded-lg text-sm touch-target",
                      isLearnActive ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                    )}
                  >
                    Learn
                  </button>
                );
              }
              const Icon = tab.icon;
              const href = tab.href;
              const isActive =
                href === "/"
                  ? path === "/"
                  : path === href || (href !== "/" && path.startsWith(href));

              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-1 px-3 py-2 rounded-lg text-sm touch-target",
                    isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                  )}
                >
                  {Icon && <Icon className="w-4 h-4 shrink-0" />}
                  <span className="hidden sm:inline">{tab.label}</span>
                </Link>
              );
            })}
            <details className="relative md:hidden">
              <summary className="list-none p-2 rounded-lg hover:bg-accent touch-target cursor-pointer">
                <Menu className="w-5 h-5" />
              </summary>
              <div className="absolute right-0 top-full mt-1 py-2 rounded-lg border border-border bg-card shadow-lg min-w-[180px]">
                <button
                  type="button"
                  onClick={() => setLearnOverlayOpen(true)}
                  className={cn(
                    "block w-full text-left px-4 py-2 text-sm",
                    isLearnActive ? "bg-accent" : "hover:bg-accent/50"
                  )}
                >
                  Learn
                </button>
                {MOBILE_MENU_LINKS.filter((c) => c.href !== "/").map((c) => (
                  <Link
                    key={c.href}
                    href={c.href}
                    className={cn(
                      "block px-4 py-2 text-sm",
                      path === c.href || (c.href !== "/" && path.startsWith(c.href))
                        ? "bg-accent"
                        : "hover:bg-accent/50"
                    )}
                  >
                    {c.label}
                  </Link>
                ))}
              </div>
            </details>
          </div>
        </div>
      </nav>

      <LearnOverlay open={learnOverlayOpen} onClose={() => setLearnOverlayOpen(false)} />
    </>
  );
}
