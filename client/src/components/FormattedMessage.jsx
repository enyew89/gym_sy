import React from 'react';

/**
 * Parses and renders inline markdown elements: **bold**, *italic*, and `code`
 */
function renderInlineMarkdown(str) {
  if (!str) return null;

  // Split on bold, italic, or inline code tokens
  const tokens = str.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);

  return tokens.map((token, idx) => {
    if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
      return (
        <strong key={idx} className="font-bold text-slate-900">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith('*') && token.endsWith('*') && token.length >= 2) {
      return (
        <em key={idx} className="italic text-slate-800">
          {token.slice(1, -1)}
        </em>
      );
    }
    if (token.startsWith('`') && token.endsWith('`') && token.length >= 2) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded bg-slate-100 text-violet-700 font-mono text-xs border border-slate-200"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    return token;
  });
}

/**
 * Beautiful, clean markdown message renderer for chat messages.
 * Replaces raw markdown syntax with rich styled headings, bullet lists, and paragraphs.
 */
export default function FormattedMessage({ text }) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let currentList = [];
  let listType = null; // 'ul' or 'ol'

  const flushList = () => {
    if (currentList.length > 0) {
      if (listType === 'ol') {
        elements.push(
          <ol
            key={`ol-${elements.length}`}
            className="list-decimal pl-5 space-y-1 my-2 text-slate-800"
          >
            {currentList.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {renderInlineMarkdown(item)}
              </li>
            ))}
          </ol>
        );
      } else {
        elements.push(
          <ul
            key={`ul-${elements.length}`}
            className="list-disc pl-5 space-y-1 my-2 text-slate-800"
          >
            {currentList.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {renderInlineMarkdown(item)}
              </li>
            ))}
          </ul>
        );
      }
      currentList = [];
      listType = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      flushList();
      continue;
    }

    // Horizontal Rule
    if (line === '---' || line === '***' || line === '___') {
      flushList();
      elements.push(<hr key={i} className="my-3 border-slate-200" />);
      continue;
    }

    // Heading 3: ### Heading
    if (line.startsWith('### ')) {
      flushList();
      elements.push(
        <h4
          key={i}
          className="text-sm font-bold text-slate-900 mt-3 mb-1.5 flex items-center gap-1.5"
        >
          {renderInlineMarkdown(line.slice(4))}
        </h4>
      );
      continue;
    }

    // Heading 2: ## Heading
    if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <h3
          key={i}
          className="text-base font-extrabold text-slate-900 mt-3.5 mb-1.5"
        >
          {renderInlineMarkdown(line.slice(3))}
        </h3>
      );
      continue;
    }

    // Heading 1: # Heading
    if (line.startsWith('# ')) {
      flushList();
      elements.push(
        <h2
          key={i}
          className="text-lg font-extrabold text-slate-900 mt-4 mb-2"
        >
          {renderInlineMarkdown(line.slice(2))}
        </h2>
      );
      continue;
    }

    // Heading 4: #### Heading
    if (line.startsWith('#### ')) {
      flushList();
      elements.push(
        <h5
          key={i}
          className="text-xs font-bold uppercase tracking-wider text-slate-700 mt-2.5 mb-1"
        >
          {renderInlineMarkdown(line.slice(5))}
        </h5>
      );
      continue;
    }

    // Numbered List: 1. Item
    const olMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (olMatch) {
      if (listType !== 'ol') flushList();
      listType = 'ol';
      currentList.push(olMatch[2]);
      continue;
    }

    // Bullet List: * Item, - Item, or • Item
    const ulMatch = line.match(/^[-*•]\s+(.*)$/);
    if (ulMatch) {
      if (listType !== 'ul') flushList();
      listType = 'ul';
      currentList.push(ulMatch[1]);
      continue;
    }

    // Regular Paragraph
    flushList();
    elements.push(
      <p key={i} className="leading-relaxed my-1 text-slate-800">
        {renderInlineMarkdown(line)}
      </p>
    );
  }

  flushList();

  return <div className="space-y-1">{elements}</div>;
}
