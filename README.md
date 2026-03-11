# Prompt PII Remover (Client-Side)

A static web app that redacts likely names and numeric values from text before sharing with an LLM.

## Why this is private

- No backend code
- No API calls
- All processing happens in your browser (`app.js`)

## Run

Because this is static HTML/CSS/JS, you can:

1. Open `index.html` directly in your browser, or
2. Serve locally (optional):

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

## Features implemented

- Side-by-side input/output text areas
- Live redaction while typing (toggle)
- Manual `Redact Now` action
- Name anonymization with deterministic aliases (`X`, `Y`, `Z`, `A`...)
- Number masking to `XXX`
- Optional preserve-years mode (`1900-2099` untouched)
- Copy output button

## Current detection approach

- **Names**: heuristic matching on likely proper nouns (capitalized words in relevant context)
- **Numbers**: regex-based masking of numeric sequences

This works well for many informal text snippets, but it is not a full NER/PII engine. Always review the output before sharing.

## Next improvements to consider

- Better entity rules (emails, phone numbers, addresses, IDs)
- "Strict mode" vs "Balanced mode"
- Show optional redaction report (what was replaced) in a local-only panel
- Unit tests for edge cases and regressions
