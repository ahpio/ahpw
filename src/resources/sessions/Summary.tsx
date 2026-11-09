import { useMemo, type ReactElement } from 'react';
import type { SessionState, SessionSummary } from '@microsoft/agent-host-protocol';
import { useI18n } from '@softov/scena/react';
import { Card, Column, Grid, Progress, Text } from '@softov/scena/ui';
import { elapsed } from '../../bridges/words.js';
import { plural } from '../../i18n/locales.js';
import { DividedRows } from '../../shell/view/DividedRows.js';
import { KpiCard, KpiCard2, type KpiProps } from '../../shell/view/Kpi.js';
import { StatusRow } from '../../shell/view/StatusRow.js';
import { customizationKinds } from '../agents/kinds.js';
import { EMOJIcon } from '../emojis.js';
import { TOOLS_SHOWN, type SessionFigures } from './figures.js';
import { tokens } from './turn.js';
import './summary.css';

/** How many skill names the Skills card lists before it counts the rest. */
const SKILLS_SHOWN = 5;

/** Which of the two KPI cards the Summary draws, while both are compared. */
const KPI_CARD: 1 | 2 = 2;

/** A figure as a KPI card, in the form `KPI_CARD` names. */
function Kpi(props: KpiProps): ReactElement {
  return KPI_CARD === 2 ? <KpiCard2 {...props} /> : <KpiCard {...props} />;
}

/** A tool's calls, and the ones that failed or were denied, as one value. */
function toolValue(t: (key: string, values?: Record<string, unknown>) => string, line: SessionFigures['tools'][number]): string {
  return [
    String(line.calls),
    ...(line.failed === 0 ? [] : [t('sessions/info/failed', { count: line.failed })]),
    ...(line.denied === 0 ? [] : [t('sessions/info/denied', { count: line.denied })]),
  ].join(' \u{00B7} ');
}

/**
 * A session's Summary: four KPIs (tokens, working time, turns and steps), then
 * cards for the newest turns, the tools, the MCP servers and the skills. A
 * click on a tool calls `onTool` with its name.
 */
export function Summary({ figures, summary, session, onTool }: { figures: SessionFigures; summary: SessionSummary; session: SessionState | undefined; onTool: (name: string) => void }): ReactElement {
  const { t } = useI18n();
  const kinds = useMemo(() => customizationKinds(session?.customizations), [session?.customizations]);
  const servers = kinds.find((one) => one.kind === 'mcpServer')?.groups.flatMap((group) => group.items) ?? [];
  const skills = kinds.find((one) => one.kind === 'skill')?.groups.flatMap((group) => group.items) ?? [];
  const widest = Math.max(1, ...figures.perTurn.map((line) => line.prompt));
  const mostCalls = Math.max(1, ...figures.tools.map((line) => line.calls));
  const tools = figures.tools.slice(0, TOOLS_SHOWN);
  const open = Date.parse(summary.modifiedAt) - Date.parse(summary.createdAt);
  return (
    <>
      <Grid minColumnWidth={150} gap={12}>
        <Kpi
          icon={EMOJIcon.tokensIn}
          label={t('sessions/info/tokens')}
          value={`\u{2191}${tokens(figures.input)} \u{2193}${tokens(figures.output)}`}
          note={t('sessions/details/cached', { count: tokens(figures.cached) })}
          color="purple"
        />
        <Kpi icon={EMOJIcon.running} label={t('sessions/info/working')} value={elapsed(figures.working)} note={t('sessions/info/open', { time: elapsed(open) })} color="green" />
        <Kpi icon={EMOJIcon.sessions} label={t('sessions/info/turns')} value={String(figures.turns)} note={figures.cancelled === 0 ? '' : plural('sessions/info/cancelled', figures.cancelled)} color="blue" />
        <Kpi
          icon={EMOJIcon.log}
          label={t('sessions/info/steps')}
          value={String(figures.steps)}
          note={[plural('sessions/info/calls', figures.toolCalls), ...(figures.outputPerSecond === undefined ? [] : [t('sessions/info/rate', { count: Math.round(figures.outputPerSecond) })])].join(' \u{00B7} ')}
          color="amber"
        />
      </Grid>
      <Grid minColumnWidth="max(40%, 280px)" gap={12} align="start">
        <Card title={t('sessions/info/perTurn')}>
          <Column gap={10}>
            {figures.perTurn.map((line) => (
              <Progress
                key={line.index}
                label={t('sessions/info/turn', { index: line.index })}
                display={t('sessions/info/turnValue', { prompt: tokens(line.prompt), cached: tokens(line.cached) })}
                value={line.prompt}
                max={widest}
              />
            ))}
          </Column>
        </Card>
        <Card title={t('sessions/info/tools')}>
          {tools.length === 0 ? <Text text={t('sessions/info/noTools')} muted /> : (
            <Column gap={10}>
              {tools.map((line) => (
                <button key={line.name} type="button" className="web-summary__tool" title={t('sessions/info/showCalls', { name: line.name })} onClick={() => onTool(line.name)}>
                  <Progress label={line.name} display={toolValue(t, line)} value={line.calls} max={mostCalls} />
                </button>
              ))}
              {figures.tools.length > TOOLS_SHOWN ? <Text text={t('sessions/info/more', { count: figures.tools.length - TOOLS_SHOWN })} variant="caption" muted /> : null}
            </Column>
          )}
        </Card>
        <Card title={t('sessions/info/mcp', { count: servers.length })}>
          {servers.length === 0 ? <Text text={t('sessions/info/noMcp')} muted /> : (
            <DividedRows>
              {servers.map((server) => <StatusRow key={server.key} name={server.name} {...(server.state === undefined ? {} : { tone: server.state.tone, detail: server.state.text })} />)}
            </DividedRows>
          )}
        </Card>
        <Card title={t('sessions/info/skills', { count: skills.length })}>
          {skills.length === 0 ? <Text text={t('sessions/info/noSkills')} muted /> : (
            <DividedRows>
              {[
                ...skills.slice(0, SKILLS_SHOWN).map((skill) => <StatusRow key={skill.key} name={skill.name} />),
                ...(skills.length > SKILLS_SHOWN ? [<Text key="more" text={t('sessions/info/more', { count: skills.length - SKILLS_SHOWN })} variant="caption" muted />] : []),
              ]}
            </DividedRows>
          )}
        </Card>
      </Grid>
    </>
  );
}
