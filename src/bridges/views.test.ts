import { describe, expect, it } from 'vitest';
import { connectorsReducer, type ConnectorRow } from './connectors.js';
import { setViewData, withViewData, type PluginView } from './views.js';

/** A `claude-login` connector's plan usage, as agent-claude shows it. */
const PLAN: PluginView = {
  root: 'plan',
  components: { plan: { id: 'plan', component: 'Text', text: { path: '/plan' } } },
  dataModel: { plan: 'max', windows: [{ name: '5h', used: 10 }] },
};

const LOGIN: ConnectorRow = { id: 'work', adapter: 'claude-login', owner: 'host', config: {}, state: 'ready', views: { main: PLAN } };

describe('setViewData', () => {
  it('sets one value at a path, and keeps the rest', () => {
    expect(setViewData(PLAN.dataModel, '/plan', 'pro')).toEqual({ plan: 'pro', windows: [{ name: '5h', used: 10 }] });
  });

  it('sets a value inside a list, and makes a missing step an object', () => {
    expect(setViewData(PLAN.dataModel, '/windows/0/used', 40)).toEqual({ plan: 'max', windows: [{ name: '5h', used: 40 }] });
    expect(setViewData({}, '/account/login', 'softov')).toEqual({ account: { login: 'softov' } });
  });

  it('reads ~1 and ~0 in a step', () => {
    expect(setViewData({}, '/a~1b/c~0d', 1)).toEqual({ 'a/b': { 'c~d': 1 } });
  });

  it('replaces the whole model at /, and only with an object', () => {
    expect(setViewData(PLAN.dataModel, '/', { plan: 'pro' })).toEqual({ plan: 'pro' });
    expect(setViewData(PLAN.dataModel, '/', 'pro')).toBe(PLAN.dataModel);
  });

  it('leaves the model as it was for a path that is not a pointer', () => {
    expect(setViewData(PLAN.dataModel, 'plan', 'pro')).toBe(PLAN.dataModel);
  });
});

describe('withViewData', () => {
  it('leaves a row with no view on the surface as it was', () => {
    expect(withViewData(LOGIN, { id: 'work', surface: 'side', path: '/plan', value: 'pro' })).toBe(LOGIN);
  });
});

describe('a records channel', () => {
  it('folds viewData into the record it names, and no other', () => {
    const other: ConnectorRow = { ...LOGIN, id: 'home' };
    const state = connectorsReducer(
      { records: [{ id: 'work', record: LOGIN }, { id: 'home', record: other }] },
      { type: 'x-ahpd-connectors/viewData', id: 'work', surface: 'main', path: '/plan', value: 'pro' },
    );
    expect(state.records[0]?.record.views?.main?.dataModel).toEqual({ plan: 'pro', windows: [{ name: '5h', used: 10 }] });
    expect(state.records[0]?.record.views?.main?.components).toBe(PLAN.components);
    expect(state.records[1]?.record).toBe(other);
  });
});
