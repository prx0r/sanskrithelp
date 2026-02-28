"use client";

import { ChevronRight } from "lucide-react";
import { traverseTree, type DerivationTree as DerivationTreeType } from "@/lib/derivation";
import { cn } from "@/lib/utils";

interface DerivationTreeProps {
  tree: DerivationTreeType;
  expanded?: Set<string>;
  onToggle?: (id: string) => void;
}

export function DerivationTree({ tree, expanded = new Set(), onToggle }: DerivationTreeProps) {
  const items = traverseTree(tree);

  return (
    <div className="space-y-1">
      {items.map(({ node, depth }) => (
        <div
          key={node.id}
          style={{ paddingLeft: `${depth * 1.5}rem` }}
          className="flex items-center gap-2 py-1"
        >
          {depth > 0 && (
            <ChevronRight
              className={cn(
                "w-4 h-4 text-muted-foreground transition-transform",
                expanded.has(node.id) && "rotate-90"
              )}
            />
          )}
          <span className="font-mono text-lg text-primary">{node.devanagari}</span>
          <span className="text-muted-foreground">({node.iast})</span>
          <span className="text-sm">— {node.meaning}</span>
        </div>
      ))}
    </div>
  );
}
