import { useEffect, useId, useState, type ReactElement } from 'react';
import { Markdown } from '@softov/scena/ui';
import { useScheme } from '../HostIcon.js';
import './mermaid.css';

type Mermaid = typeof import('mermaid')['default'];

/** The Mermaid module, loaded on the first diagram drawn. */
let loading: Promise<Mermaid> | undefined;
const loadMermaid = (): Promise<Mermaid> => (loading ??= import('mermaid').then((module) => module.default));

/** The source as a fenced code block, as scena shows it. */
const asCode = (source: string): string => '```mermaid\n' + source + '\n```';

/**
 * A Mermaid diagram, drawn as SVG in the scheme shown. Until it parses, the
 * source shows as code; a diagram that already drew stays while an open
 * fence grows. A closed fence that does not parse shows its code and the
 * first line of Mermaid's error.
 */
export function MermaidDiagram({ source, closed }: { source: string; closed: boolean }): ReactElement {
  const scheme = useScheme();
  const id = `web-mermaid-${useId().replace(/[^\w-]/g, '')}`;
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    loadMermaid()
      .then((mermaid) => mermaid.render(id, source, { config: { theme: scheme === 'dark' ? 'dark' : 'default' } }))
      .then(
        (result) => {
          if (!live) return;
          setSvg(result.svg);
          setError(null);
        },
        (failed: unknown) => {
          if (live) setError((failed instanceof Error ? failed.message : String(failed)).split('\n')[0] ?? '');
        },
      );
    return () => {
      live = false;
    };
  }, [id, source, scheme]);

  if (svg !== null && (error === null || !closed)) {
    // Mermaid's own SVG: v13 draws labels as escaped text, with no script or foreignObject.
    return <div className="web-mermaid" dangerouslySetInnerHTML={{ __html: svg }} />;
  }
  return (
    <div className="web-mermaid-code">
      <Markdown text={asCode(source)} />
      {closed && error !== null ? <p className="web-mermaid-code__error">{error}</p> : null}
    </div>
  );
}
