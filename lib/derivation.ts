import type { LinguisticNode } from "./types";

export interface DerivationStep {
  form: string;
  suffix?: string;
  rule?: string;
  meaning: string;
}

export interface DerivationTree {
  root: LinguisticNode;
  steps: DerivationStep[];
  children: DerivationTree[];
}

// Build derivation tree from a dhātu (root)
export function buildDerivationTree(
  root: LinguisticNode,
  allNodes: LinguisticNode[]
): DerivationTree {
  const children: DerivationTree[] = [];
  const childIds = root.derivesTo || [];

  for (const id of childIds) {
    const childNode = allNodes.find((n) => n.id === id);
    if (childNode) {
      children.push(buildDerivationTree(childNode, allNodes));
    }
  }

  return {
    root,
    steps: [],
    children,
  };
}

// Common suffix meanings for display
export const SUFFIX_MEANINGS: Record<string, string> = {
  tṛ: "agent (doer)",
  ta: "past passive participle (done)",
  ana: "instrument/means",
  ya: "gerundive (what must be done)",
  tvā: "absolutive (having done)",
  ti: "action noun",
  man: "abstract noun",
  ika: "relating to",
  in: "characterised by",
  tva: "abstract quality",
};

// Traverse tree for display
export function traverseTree(tree: DerivationTree, depth = 0): Array<{ node: LinguisticNode; depth: number }> {
  const result: Array<{ node: LinguisticNode; depth: number }> = [];
  result.push({ node: tree.root, depth });
  for (const child of tree.children) {
    result.push(...traverseTree(child, depth + 1));
  }
  return result;
}

// Get root form from a derived word (simplified lookup)
export function findRootForWord(word: string, nodes: LinguisticNode[]): LinguisticNode | null {
  const dhatus = nodes.filter((n) => n.type === "dhatu");
  for (const d of dhatus) {
    const derivs = d.derivesTo || [];
    for (const id of derivs) {
      const node = nodes.find((n) => n.id === id);
      if (node?.iast === word || node?.devanagari === word) return d;
    }
  }
  return null;
}
