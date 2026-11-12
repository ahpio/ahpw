import type { AgentInfo } from '@microsoft/agent-host-protocol';

/** One model an agent lists. */
export type AgentModel = AgentInfo['models'][number];

/** Whether a model's name or id holds `query`, ignoring case; an empty query keeps every model. */
export function matchesModel(model: AgentModel, query: string): boolean {
  const said = query.trim().toLowerCase();
  if (said === '') return true;
  return model.name.toLowerCase().includes(said) || model.id.toLowerCase().includes(said);
}
