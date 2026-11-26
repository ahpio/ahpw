---
title: A tool call asks in the chat
---

Plan: [a tool call asks in the chat](../plans/sessions/20261123-1359-a-tool-call-asks-in-the-chat/plan.md).

Use ahpw on 5180, with ahpd 37537 at 2b164c19f or later (ahpd #472). Set one command to Ask in the Tools panel.

- [ ] Have an agent run that command, and press Always allow. Pass: the command runs once, a toast shows, and the next call does not ask. Fail: it asks again, or runs twice.
- [ ] Open a file, then have the agent open the same file at lines 10 to 20. Pass: lines 10 to 20 are selected. Fail: the file opens at the top, or nothing is selected.
- [ ] Set a session to "Ask Before Edits". Have the agent run an ahpw command, and close the only window with that session while the host's approval shows. Wait about 40 s and open the session again. Pass: the turn went on, and the call is marked failed. Fail: the turn still waits.

The checks start agent runs on Softov's sign-in, so they wait for him.
