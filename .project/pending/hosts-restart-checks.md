---
title: The host restarts from ahpw
---

Plan: [the host restarts from ahpw](../plans/hosts/20261030-0650-the-host-restarts-from-ahpw/plan.md).

- [x] Press Restart in the host page's danger zone, answer no, and check that nothing restarts. Headless on a test daemon, 2026-11-13: the daemon kept its pid.
- [x] Press Restart again, answer yes, and check that ahpw connects again. Headless, 2026-11-13: the daemon got a new pid, and the host page showed Connected again.
- [x] Check that the host page does not scroll sideways. Headless, 2026-11-13: no sideways scroll at 1400 and 390 px.
- [ ] Start a turn, press Restart, and check that the notification names the session and says that the host waits for it.
- [ ] Press "Restart anyway", and check that the host restarts.

Since ahpd 3af3624c7, a restart while a turn runs waits for the turns to end, and the host answers `{ restarting: false, parked }`. The last two steps need the ahpw fix that reads that answer. They start an agent run, so they wait for Softov.
