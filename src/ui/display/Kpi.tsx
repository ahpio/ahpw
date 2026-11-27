import type { ReactElement } from 'react';
import { resolveColorAlpha, type ScenaColor } from '@softov/scena/types';
import { Card, Column, Icon, Row, Text } from '@softov/scena/ui';

/** What a KPI card shows: its icon, label and value, the note below it, and its colour. */
export interface KpiProps {
  icon: string;
  label: string;
  value: string;
  /** Drawn below the value; nothing when empty. */
  note: string;
  /** The tint of `KpiCard2`; `KpiCard` draws no colour. */
  color: ScenaColor;
}

/**
 * A figure as scena's playground `kpiCard` builds one: its icon and label,
 * the value large, and a note below. scena exports no KPI card, so this is
 * ahpw's until it moves to scena.
 */
export function KpiCard({ icon, label, value, note }: KpiProps): ReactElement {
  return (
    <Card>
      <Column gap={4}>
        <Row gap={8} align="center">
          <Icon name={icon} size={18} />
          <Text text={label} variant="caption" muted />
        </Row>
        <Text text={value} variant="h1" />
        {note === '' ? null : <Text text={note} variant="caption" muted />}
      </Column>
    </Card>
  );
}

/**
 * A figure as scena's playground `kpiCard2` builds one: its icon in a box
 * tinted with its colour, the label over the value in that colour, and a note
 * below.
 */
export function KpiCard2({ icon, label, value, note, color }: KpiProps): ReactElement {
  return (
    <Card>
      <Column gap={4}>
        <Row gap={8} align="center">
          <Icon
            name={icon}
            size={24}
            style={{
              flexShrink: 0,
              color: resolveColorAlpha(color, 0.6),
              backgroundColor: resolveColorAlpha(color, 0.1),
              borderColor: resolveColorAlpha(color, 0.2),
              borderStyle: 'solid',
              borderWidth: 2,
              padding: 'var(--oo-spacing-sm)',
              borderRadius: 'var(--oo-radius-lg)',
              textAlign: 'center',
              width: '36px'
            }}
          />
          <Column gap={0}>
            <Text text={label} variant="caption" muted />
            <Text text={value} variant="h1" style={{ color: resolveColorAlpha(color) }} />
          </Column>
        </Row>
        {note === '' ? null : <Text text={note} variant="caption" muted />}
      </Column>
    </Card>
  );
}
