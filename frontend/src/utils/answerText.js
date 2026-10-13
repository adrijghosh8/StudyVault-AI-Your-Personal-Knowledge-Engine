// Prepares raw model output for display.
//  - removes inline citation tags such as "[Source: file.pdf, Page: 32, Chunk: ad10…]"
//  - converts LaTeX \( … \) and \[ … \] delimiters to $ … $ and $$ … $$ so they render as math
// Fenced code blocks are left untouched.

const CITATION = /[ \t]*\[\s*Sources?\s*:[^\]]*\]/gi;
const BLOCK_MATH = /\\\[([\s\S]+?)\\\]/g;
const INLINE_MATH = /\\\(([\s\S]+?)\\\)/g;

function transform(segment) {
  return segment
    .replace(CITATION, '')
    .replace(BLOCK_MATH, (_, m) => `\n$$\n${m.trim()}\n$$\n`)
    .replace(INLINE_MATH, (_, m) => `$${m.trim()}$`);
}

export function prepareAnswer(text = '') {
  // Even-numbered parts of the split are outside ``` fences.
  return text
    .split(/(```[\s\S]*?```)/g)
    .map((part, i) => (i % 2 === 0 ? transform(part) : part))
    .join('')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
