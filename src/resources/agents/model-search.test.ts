import { describe, expect, it } from 'vitest';
import { matchesModel, type AgentModel } from './model-search.js';

const model = (id: string, name: string): AgentModel => ({ id, name } as AgentModel);

describe('matchesModel', () => {
  it('matches the name or the id, ignoring case', () => {
    expect(matchesModel(model('claude-opus-5-5', 'Opus 5.5'), 'opus')).toBe(true);
    expect(matchesModel(model('claude-opus-5-5', 'Opus 5.5'), 'CLAUDE-OPUS')).toBe(true);
    expect(matchesModel(model('sonnet', 'Sonnet 5.5'), '5.5')).toBe(true);
  });

  it('keeps every model for an empty query', () => {
    expect(matchesModel(model('haiku', 'Haiku 5.5'), '  ')).toBe(true);
  });

  it('drops a model that holds neither', () => {
    expect(matchesModel(model('haiku', 'Haiku 5.5'), 'fable')).toBe(false);
  });
});
