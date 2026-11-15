import { useEffect, useState, type CSSProperties, type ReactElement, type ReactNode } from 'react';

/**
 * scena's `Tabs`, with the same props and markup, except that a panel stays
 * mounted once shown and is hidden while another tab is active: a form keeps
 * what was typed while its tab is not shown. Written to move into scena once
 * it has been used here.
 */

/** One tab: its key, its title and its panel; `label` and `content` are the older names scena still reads. */
export interface KeptTab {
  key?: string;
  title?: string;
  child?: ReactNode;
  label?: string;
  content?: ReactNode;
  disabled?: boolean;
}

export interface KeptTabsProps {
  tabs?: KeptTab[];
  /** The flex weight of the tabs in their container. */
  weight?: number;
  /** The active tab's key, when the caller holds it. */
  value?: string;
  /** The tab shown first, when the caller does not hold the active one. */
  defaultValue?: string;
  onChange?: (key: string) => void;
  style?: CSSProperties;
}

const titleOf = (tab: KeptTab): string => tab.title ?? tab.label ?? '';
const childOf = (tab: KeptTab): ReactNode => tab.child ?? tab.content;
const weightStyle = (weight: number | undefined): CSSProperties => (weight === undefined ? {} : { flex: `${weight}`, minWidth: 0, minHeight: 0 });

export function KeptTabs({ tabs = [], value, defaultValue, onChange, weight, style }: KeptTabsProps): ReactElement {
  // A tab's key is its own `key`, else its place: the active tab follows the key, not the title a language switch changes.
  const keys = tabs.map((tab, index) => tab.key ?? String(index));
  const [internal, setInternal] = useState(value ?? defaultValue ?? keys[0]);
  useEffect(() => {
    if (value !== undefined) setInternal(value);
  }, [value]);
  const activeIndex = [keys.indexOf(internal ?? ''), keys.indexOf(defaultValue ?? ''), 0].find((index) => index >= 0) ?? 0;
  const activeKey = keys[activeIndex];
  // The tabs shown so far: each keeps its panel mounted from then on.
  const [shown, setShown] = useState<ReadonlySet<string>>(() => new Set(activeKey === undefined ? [] : [activeKey]));
  useEffect(() => {
    if (activeKey !== undefined && !shown.has(activeKey)) setShown(new Set([...shown, activeKey]));
  }, [activeKey, shown]);

  const select = (key: string): void => {
    setInternal(key);
    onChange?.(key);
  };

  return (
    <div className="oo-tabs" style={{ ...weightStyle(weight), ...style }}>
      <div className="oo-tabs__strip" role="tablist">
        {tabs.map((tab, index) => (
          <button
            key={keys[index]}
            type="button"
            className="oo-tabs__tab"
            role="tab"
            aria-selected={index === activeIndex}
            disabled={tab.disabled}
            onClick={() => select(keys[index]!)}
          >
            {titleOf(tab)}
          </button>
        ))}
      </div>
      {tabs.map((tab, index) => {
        const key = keys[index]!;
        const active = index === activeIndex;
        if (!active && !shown.has(key)) return null;
        return (
          <div key={key} role="tabpanel" hidden={!active} style={active ? { flex: 1, minHeight: 0, overflow: 'auto' } : { display: 'none' }}>
            {childOf(tab)}
          </div>
        );
      })}
    </div>
  );
}
