---
title: The host is told the language
---

Plan: [the host is told the language](../plans/hosts/20261030-1037-the-host-is-told-the-language/plan.md).

- [x] Open the Log, and check that the `initialize` frame carries `locale`. Headless on a test daemon, 2026-11-13: `initialize` carried `locale: "en"`.
- [x] Change the language to Portuguese, and check that each host connects again. Headless, 2026-11-13: ahpw sent `reconnect` with `locale: "pt-BR"`.
- [ ] Open the new session form, and check that the host's text is in Portuguese.

Step 3 failed on 2026-11-13. After a change of language, ahpw does not ask `resolveSessionConfig` again, so the form keeps the English text until a reload. A load in Portuguese shows the host's keys in Portuguese. The step needs the ahpw fix.

On the same load, agent-claude's own keys, such as Approvals, stay in English. That is ahpd's side, in its check `the-pt-catalogs-read-right.md`.
