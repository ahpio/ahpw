---
title: A plugin is added or written from ahpw - deferred
date: 2026-11-12
---

These wait until ahpd's plugin rows say how each plugin came to be, because ahpw draws only what the host sends.

| What | Why it waits | Where it goes |
| --- | --- | --- |
| The Source tab of a plugin written in a client: both files in `CodeEditor`, Save and Reset, mockup sheet 7 | The row does not say which plugin was written with `x-ahpd/plugins/write`, and ahpw does not infer it from a path | An ahpd plan that marks the row, then an ahpw plan |
| Update beside Reimport and Disable, mockup sheet 5 | The row does not say which plugin npm installed, and `x-ahpd/plugins/update` refuses any other | The same ahpd plan, then an ahpw plan |
| "Keep its folder" in place of "Keep the package installed" on a written plugin | The same fact as the Source tab | The ahpw plan of the Source tab |
