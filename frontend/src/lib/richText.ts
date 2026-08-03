// Minimal, dependency-free "rich text" for user bios and gig descriptions —
// plain text in the database (no HTML stored), with **bold**, *italic*,
// __underline__, and "- " bullet lines as markdown-lite markers a toolbar
// inserts around the current textarea selection. Rendering escapes the raw
// text FIRST, then substitutes only these known-safe patterns, so there's no
// way for a pasted `<script>` or `<img onerror=...>` to survive into the
// dangerouslySetInnerHTML output.
export function renderBioHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/__([^_]+)__/g, "<u>$1</u>");

  const lines = escaped.split("\n");
  const blocks: string[] = [];
  let inList = false;
  for (const line of lines) {
    const bullet = /^-\s+(.+)$/.exec(line);
    if (bullet) {
      if (!inList) {
        blocks.push("<ul>");
        inList = true;
      }
      blocks.push(`<li>${bullet[1]}</li>`);
    } else {
      if (inList) {
        blocks.push("</ul>");
        inList = false;
      }
      blocks.push(line);
    }
  }
  if (inList) blocks.push("</ul>");

  return blocks
    .map((chunk, i) => {
      const isListPart = chunk === "<ul>" || chunk === "</ul>" || chunk.startsWith("<li>");
      if (isListPart) return chunk;
      const prev = blocks[i - 1];
      const prevIsListEnd = prev === "</ul>";
      return (i > 0 && !prevIsListEnd ? "<br />" : "") + chunk;
    })
    .join("");
}

// Wraps (or unwraps) the current selection in a textarea with the given
// marker — used by the Bold/Italic/Underline toolbar buttons. Returns the
// new value and where the selection should land afterward, since the caller
// owns the textarea ref and needs to restore focus/selection after the
// state update.
export function toggleMarkerAroundSelection(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  marker: string
): { value: string; selectionStart: number; selectionEnd: number } {
  const before = value.slice(0, selectionStart);
  const selected = value.slice(selectionStart, selectionEnd);
  const after = value.slice(selectionEnd);

  const alreadyWrapped = selected.startsWith(marker) && selected.endsWith(marker) && selected.length >= marker.length * 2;
  if (alreadyWrapped) {
    const unwrapped = selected.slice(marker.length, selected.length - marker.length);
    return { value: before + unwrapped + after, selectionStart, selectionEnd: selectionStart + unwrapped.length };
  }

  const wrapped = `${marker}${selected || "text"}${marker}`;
  return {
    value: before + wrapped + after,
    selectionStart: before.length + marker.length,
    selectionEnd: before.length + marker.length + (selected || "text").length,
  };
}

// Toggles "- " bullet prefixes on every line touched by the current
// selection — used by the bullet-list toolbar button. Expands the selection
// out to full lines first, since a partial-line selection shouldn't split a
// line in half.
export function toggleBulletList(
  value: string,
  selectionStart: number,
  selectionEnd: number
): { value: string; selectionStart: number; selectionEnd: number } {
  const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
  const nextBreak = value.indexOf("\n", selectionEnd);
  const lineEnd = nextBreak === -1 ? value.length : nextBreak;

  const before = value.slice(0, lineStart);
  const block = value.slice(lineStart, lineEnd);
  const after = value.slice(lineEnd);

  const lines = block.split("\n");
  const contentLines = lines.filter((l) => l.trim() !== "");
  const allBulleted = contentLines.length > 0 && contentLines.every((l) => l.startsWith("- "));

  const newLines = lines.map((l) => {
    if (l.trim() === "") return l;
    if (allBulleted) return l.replace(/^- /, "");
    return l.startsWith("- ") ? l : `- ${l}`;
  });
  const newBlock = newLines.join("\n");

  return { value: before + newBlock + after, selectionStart: lineStart, selectionEnd: lineStart + newBlock.length };
}

// Walks a live contentEditable element's DOM and converts it back into the
// same plain-text-with-markers format renderBioHtml expects — the inverse of
// renderBioHtml. Used so the bio editor can be a real contentEditable box
// (bold shows as actual bold while typing) while the value that reaches the
// backend stays plain text, same as the textarea-based editor always stored.
export function domToBioText(root: Node): string {
  function walk(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent ?? "";
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return "";

    const el = node as HTMLElement;
    const inner = Array.from(el.childNodes).map(walk).join("");

    switch (el.tagName) {
      case "B":
      case "STRONG":
        return inner.trim() ? `**${inner}**` : inner;
      case "I":
      case "EM":
        return inner.trim() ? `*${inner}*` : inner;
      case "U":
        return inner.trim() ? `__${inner}__` : inner;
      case "LI":
        return `- ${inner}\n`;
      case "BR":
        return "\n";
      case "DIV":
      case "P":
        return `${inner}\n`;
      default:
        return inner;
    }
  }

  return walk(root)
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\n+$/, "");
}
