function looksLikeHtml(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text);
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function renderBlock(block: string, key: number) {
  const trimmed = block.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('### ')) {
    return <h3 key={key} className="font-heading text-lg font-semibold">{renderInline(trimmed.slice(4))}</h3>;
  }
  if (trimmed.startsWith('## ')) {
    return <h2 key={key} className="font-heading text-xl font-semibold">{renderInline(trimmed.slice(3))}</h2>;
  }
  if (trimmed.startsWith('# ')) {
    return <h1 key={key} className="font-heading text-2xl font-semibold">{renderInline(trimmed.slice(2))}</h1>;
  }
  const lines = trimmed.split('\n');
  if (lines.every((line) => /^\s*[-*]\s+/.test(line))) {
    return (
      <ul key={key} className="list-disc space-y-1 pl-5">
        {lines.map((line, i) => (
          <li key={i}>{renderInline(line.replace(/^\s*[-*]\s+/, ''))}</li>
        ))}
      </ul>
    );
  }
  return (
    <p key={key} className="leading-7">
      {lines.map((line, i) => (
        <span key={i}>
          {i > 0 && <br />}
          {renderInline(line)}
        </span>
      ))}
    </p>
  );
}

export function LessonRichText({ content }: { content: string }) {
  if (looksLikeHtml(content)) {
    return (
      <div
        className="lesson-html space-y-3 text-base leading-7"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }
  const blocks = content.split(/\n{2,}/);
  return (
    <div className="space-y-4 text-base text-foreground">
      {blocks.map((block, i) => renderBlock(block, i))}
    </div>
  );
}
