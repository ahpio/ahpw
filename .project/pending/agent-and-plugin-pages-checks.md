---
title: The agent and plugin pages link and ask
---

Plan: [the agent and plugin pages link and ask](../plans/plugins/20261119-2340-agent-and-plugin-pages-link-and-ask/plan.md).
The dev server on port 5180 serves the branch `plugins/20261119-2340-agent-and-plugin-pages-link-and-ask`.

- [ ] Open Agent Claude in Plugins at a window 1280 px wide. Pass: *Installation*, *Categories* and *Resources* are one section above the README, with a line under it. Fail: a column beside the README.
- [ ] Make the window 760 px wide. Pass: the parts wrap under each other and the path breaks inside its line. Fail: a sideways scroll.
- [ ] Check both widths in light and dark.
- [ ] Open *Features* and *Changelog*. Pass: no facts, full width.
- [ ] Open a plugin that is not installed, from the Plugins search. Pass: the same facts section with *Marketplace*, on *Overview* only.
- [ ] Press Disable on a plugin, then answer *Cancel*. Pass: the plugin stays enabled. Then press Disable and answer yes. Pass: it is disabled.
- [ ] Open a plugin's menu in the Plugins explorer and choose Reimport. Pass: a question comes first.
- [ ] Press Install on a listed plugin and answer *Cancel*. Pass: nothing installs and no *Installing…* shows.
- [ ] Open the Cofold agent and press Pause, then *Cancel*. Pass: it stays ready.
- [ ] On the Cofold agent page, press *agent-cofold*. Pass: the plugin page opens.
- [ ] On the Cofold agent page, press the session count. Pass: Sessions opens with the Agent button pressed and only Cofold sessions.
- [ ] In the Sessions header, open Agent and choose *All agents*. Pass: every session shows again.
