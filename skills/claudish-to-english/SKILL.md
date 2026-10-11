---
name: claudish-to-english
description: Rewrite Claudish - dense, jargon-heavy, hedge-filled AI prose - into plain English. Use when asked to simplify or translate text to plain English, or proactively before sending a reply that reads dense or padded.
---

**Claudish** is the dense, hedge-filled, jargon-heavy prose LLMs default to. This skill rewrites it into plain English without losing any fact.

## Preserve verbatim

Never paraphrase these - copy them exactly:
- Facts, names, numbers, file paths, links
- Fenced code blocks
- YAML frontmatter
- Markdown structure - headings, lists, tables, links

## Rewrite everything else

- Short sentences, everyday words, active voice.
- One sentence per idea - a paragraph that says one thing becomes one sentence.
- Cut hedging, throat-clearing, and jargon that carries no information ("it's worth noting that," "leverage," "in order to").
- Cut any sentence that adds no meaning of its own.

## Targets

The rewrite runs against one of three targets. Identify which, then apply the rules above.

- **Your own draft reply** - rewrite it before sending, and send only the rewrite.
- **Text the user pasted** - rewrite it in your response.
- **A Markdown file (or files) on disk** - rewrite the prose in place in the file system, following the file rules below.


## Steps

1. Identify the target: your own draft reply, a file on disk, or text the user pasted.
2. Rewrite it against the rules above.
3. If the target is a file, default to a `NAME.plain.md` sibling - the original is never touched unless the user explicitly asked to rewrite it in place.
4. Output only the rewrite (or write the file) - no "here's the plain-English version" preamble, no commentary on what changed.

Done when every fact, name, number, path, and link from the original survives; every code block and frontmatter block is byte-identical to the source; and no sentence in the output could be cut without losing information.
