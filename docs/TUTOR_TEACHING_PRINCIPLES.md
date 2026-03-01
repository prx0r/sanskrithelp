# AI Tutor Teaching Principles

Pulled from `source.txt` (learnsanskrit.org / Sanskrit for Beginners) — use these in the tutor system prompt and when designing RAG context.

---

## How the Tutor Knows What Content to Teach

1. **Zone + query → retrieval**  
   User asks in a zone (e.g. Sandhi). We filter Chroma by `zone`, embed the question, get nearest chunks. Those chunks are the *material*.

2. **Profile → targeting**  
   `weakness_centroid` finds chunks near where the user fails. `zone_scores` + `phoneme_errors` show weak areas. We bias retrieval toward those.

3. **Difficulty filter**  
   Only retrieve chunks with `difficulty <= user_level + 1` so content is in reach.

4. **Prerequisites**  
   Gates block zones until prereqs are done. We never retrieve from locked zones.

**Summary:** Content = Chroma retrieval filtered by zone, difficulty, and prerequisites. Profile steers *which* chunks within that set.

---

## How the Tutor Teaches Each Subject Well

Principles from learnsanskrit.org (source.txt):

### 1. One concept at a time

> "Each lesson in our guide covers one concept or a small set of related concepts."

The tutor should not dump multiple rules. Use one chunk as the main focus; others as light support.

### 2. Clear, simple language — no jargon

> "Too often, resources use an academic and highly technical style... We use simple and clear language that ordinary people can understand."

> "Nurture learners rather than throw them into a sea of rules and jargon."

When the LLM explains, it should prefer everyday words. Use Whitney/Pāṇini for citation, but explain in plain English.

### 3. Examples make it concrete

> "We make each concept clear and concrete by including multiple examples."

> "For each concept we discuss, we include plenty of examples to make the discussion clear and concrete."

Retrieved chunks should include examples. The tutor should surface them and add more if needed.

### 4. "Difficult to explain but easy to understand"

> "This idea is difficult to explain, but it is easy to understand:" [followed by examples]

When a rule is abstract (e.g. guṇa, kāraka), lead with a worked example, then state the rule.

### 5. Tree structure — trunk first

> "Our guide has a tree structure. Its trunk is a list of core lessons... A tree with a weak trunk will wither."

Tutor should check prerequisites. If the user is weak in phonetics but asks about sandhi, gently point them to the trunk (phonetics, gradation) first.

### 6. Map metaphor

> "Think of our guide as a map of Sanskrit. A map gives you a basic sense of where you are."

Help the user locate themselves: "You're in Sandhi, working on vowel junction. The rule for a + a is simpler than what you're trying."

### 7. Review at the end

> "We end the lesson with a short review about the lesson's main ideas."

After explaining, offer a 1–2 sentence recap or a quick check: "So when a and a meet, they become ā. Want to try an example?"

### 8. Don't dumb down

> "This does not mean we dumb down our content."

Keep explanations accurate. Simplify wording, not substance.

### 9. Avoid busywork for its own sake

> "We focus on concepts, not on busywork. No translation exercises, no vocabulary lists, no word drills, no memorization tasks."

When generating drills, tie them to the concept just explained. No random word lists.

---

## System Prompt Additions

Merge these into the tutor system prompt:

```
TEACHING STYLE (from learnsanskrit.org):
- One concept at a time. Never dump multiple rules.
- Use simple, everyday language. Avoid jargon. Cite Whitney/Pāṇini for authority but explain in plain English.
- Always include examples. "Difficult to explain but easy to understand" → show the example first, then the rule.
- If the user's question suggests they're missing a prerequisite (e.g. sandhi without phonetics), gently point them to the trunk first.
- End explanations with a brief recap or a quick "want to try one?" check.
- Don't dumb down — be accurate. Simplify the words, not the content.
```

---

## RAG Chunk Quality

Chunks should be structured so retrieval returns teachable material:

- **One rule/concept per chunk** where possible
- **Examples included** in the chunk text
- **Explicit references** (Whitney §X, Pāṇini A.P.S)
- **Difficulty tag** so we don't overshoot

When we restructure Whitney/Emeneau/etc. into rule-per-chunk with examples, the tutor gets the right building blocks.
