"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Zap, Menu, Gamepad2 } from "lucide-react";
import { cn } from "@/lib/utils";

const CHAPTERS = [
  { href: "/", label: "Home" },
  { href: "/learn/", label: "Learn" },
  { href: "/learn/pronunciation", label: "Pronunciation" },
  { href: "/learn/compression/", label: "1. Pratyāhāras" },
  { href: "/learn/phonetics/", label: "2. Phonemes" },
  { href: "/learn/gradation/", label: "3. Guṇa/Vṛddhi" },
  { href: "/learn/sandhi/", label: "4. Sandhi" },
  { href: "/learn/roots/", label: "5. Dhātus" },
  { href: "/learn/words/", label: "6. Words" },
  { href: "/learn/suffixes/", label: "7. Suffixes" },
  { href: "/learn/karakas/", label: "8. Kārakas" },
  { href: "/learn/verbs/", label: "9. Verbs" },
  { href: "/learn/compounds/", label: "10. Compounds" },
  { href: "/learn/reading/", label: "11. Reading" },
];

export function Nav() {
  const path = usePathname() ?? "/";

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Pāṇini
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/learn/"
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm touch-target"
          >
            Learn
          </Link>
          <Link
            href="/drill"
            className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-accent text-sm touch-target"
          >
            <Zap className="w-4 h-4" />
            Drill
          </Link>
          <Link
            href="/games"
            className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-accent text-sm touch-target"
          >
            <Gamepad2 className="w-4 h-4" />
            Games
          </Link>
          <details className="relative md:hidden">
            <summary className="list-none p-2 rounded-lg hover:bg-accent touch-target cursor-pointer">
              <Menu className="w-5 h-5" />
            </summary>
            <div className="absolute right-0 top-full mt-1 py-2 rounded-lg border border-border bg-card shadow-lg min-w-[200px]">
              <Link
                href="/games"
                className={cn(
                  "block px-4 py-2 text-sm",
                  path.startsWith("/games") ? "bg-accent" : "hover:bg-accent/50"
                )}
              >
                Games
              </Link>
              {CHAPTERS.map((c) => (
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
      <div className="max-w-4xl mx-auto px-4 pb-2 hidden md:flex flex-wrap gap-1">
        {CHAPTERS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className={cn(
              "px-2 py-1 rounded text-sm",
              path === c.href || (c.href !== "/" && path.startsWith(c.href))
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent"
            )}
          >
            {c.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
