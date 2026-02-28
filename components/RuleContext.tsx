"use client";

import { ArrowRight, BookOpen } from "lucide-react";
import type { SandhiRule } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RuleContextProps {
  rule: SandhiRule;
  dependsOn?: SandhiRule[];
  enables?: SandhiRule[];
  className?: string;
}

export function RuleContext({ rule, dependsOn = [], enables = [], className }: RuleContextProps) {
  return (
    <div className={cn("space-y-3 p-4 rounded-xl border border-border bg-muted/30", className)}>
      <div className="flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium">{rule.name}</span>
        {rule.paniniReference && (
          <span className="text-xs text-muted-foreground">({rule.paniniReference})</span>
        )}
      </div>
      <p className="text-sm text-muted-foreground">{rule.mechanism}</p>
      <code className="block text-sm bg-background px-2 py-1 rounded">{rule.signature}</code>
      {dependsOn.length > 0 && (
        <div className="text-xs">
          <span className="text-muted-foreground">Depends on: </span>
          {dependsOn.map((r) => r.name).join(", ")}
        </div>
      )}
      {enables.length > 0 && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Enables:</span>
          {enables.map((r) => (
            <span key={r.id} className="inline-flex items-center gap-1">
              <ArrowRight className="w-3 h-3" />
              {r.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
