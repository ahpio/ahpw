import type { ReactElement } from 'react';
import { Row, Spinner, StatusDot, Text } from '@softov/scena/ui';
import './status-row.css';

/** A dot's tone, or `busy` for a spinner in its place. */
export type StatusTone = 'success' | 'info' | 'warning' | 'danger' | 'default' | 'busy';

/** A text that keeps to one line and is cut with an ellipsis. */
const ONE_LINE = { display: 'block', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as const;

/**
 * A row as scena's dashboard `statusRow` draws one: a dot and a name on the
 * left, and a detail on the right. The detail gives way first, cut to the row
 * with its whole words as a tooltip, so the name stays whole. Without a tone
 * the row has no dot; without a detail, no right side.
 */
export function StatusRow({ name, tone, detail }: { name: string; tone?: StatusTone; detail?: string }): ReactElement {
  return (
    <Row gap={12} align="center" justify="spaceBetween">
      <Row gap={8} align="center" style={{ minWidth: 0 }}>
        {tone === undefined ? null : tone === 'busy' ? <Spinner size={10} /> : <StatusDot tone={tone} />}
        <Text text={name} weight="bold" style={ONE_LINE} />
      </Row>
      {detail === undefined ? null : (
        <span className="web-status-row__detail" title={detail}>
          <Text text={detail} variant="caption" muted style={ONE_LINE} />
        </span>
      )}
    </Row>
  );
}
