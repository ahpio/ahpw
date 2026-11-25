---
title: What the connectors plan set aside
---

## The host's public root

A connector's URL starts with the page's own origin, or with the daemon that the page names.
It is wrong for a host with `routes.port` set, and for a host behind a proxy with a public name.
ahpd sends no public address to a client, at main `d727e214d`.
Softov closed the plan without it on 2026-11-24.
It goes in a new plan once ahpd sends the address. [task-07-the-hosts-public-root.md](task-07-the-hosts-public-root.md) has the steps.
