---
name: document-functions
description: Writes JSDoc documentation comments for code functions. Use this skill whenever the user asks to document functions, add JSDoc, add comments to code, write documentation for a file or function, explain what functions do, or annotate code. Trigger even if the user just says "document this", "add docs", or "add comments".
---

# Document Functions Skill

Add JSDoc documentation to functions that are missing it.

## Steps

1. **Read the target file** to understand its functions and context.
2. **Identify undocumented functions** — any function, method, or arrow function that has no JSDoc block (`/** ... */`) above it.
3. **Write a JSDoc comment for each** undocumented function using the format below.
4. **Edit the file** to insert the comments — do not rewrite or refactor the code, only add documentation.

## JSDoc Format

```js
/**
 * One-sentence description of what the function does.
 *
 * @param {type} paramName - What this parameter represents.
 * @param {type} [optionalParam] - Optional parameters use square brackets.
 * @returns {type} What the function returns, or omit if void.
 */
```

## Guidelines

- Keep descriptions concise and factual — describe what the function does, not how.
- Use the actual parameter names from the function signature.
- Infer types from usage (e.g. `string`, `number`, `boolean`, `Object`, `Array`, `Promise`).
- If a function is self-evident from its name (e.g. a 2-line getter), a single-line `/** ... */` is fine.
- Do not add `@author`, `@date`, or any other tags unless asked.
- Do not modify any existing code — only insert comments.
- If the file already has complete documentation, say so and stop.

## Example

**Before:**
```js
function pickForbiddenCard() {
    const idx = Math.floor(Math.random() * FORBIDDEN_CARDS.length);
    return FORBIDDEN_CARDS[idx];
}
```

**After:**
```js
/**
 * Picks a random card from the Forbidden Word card pool.
 *
 * @returns {Object} A card object with `word` and `forbidden` properties.
 */
function pickForbiddenCard() {
    const idx = Math.floor(Math.random() * FORBIDDEN_CARDS.length);
    return FORBIDDEN_CARDS[idx];
}
```
