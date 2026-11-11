---
title: A person signs in through their issuer
created: 2026-11-11
refs:
  - git://b8014ecb958b618615be677855af804c953bd24b - the commit of this repository the facts were checked at
  - "[code://src/App.tsx#L43](../../src/App.tsx#L43) - the porta, made with one provider: `tokenProvider()`"
  - "[code://src/porta/token-provider.ts#L54-L80](../../src/porta/token-provider.ts#L54-L80) - `tokenProvider`, a `form-fields` provider with one password field"
  - "[code://src/porta/token-provider.ts#L18-L25](../../src/porta/token-provider.ts#L18-L25) - `check`, which stores the token and lets the socket accept or refuse it"
  - "[code://src/bridges/data.ts#L608-L613](../../src/bridges/data.ts#L608-L613) - `openSocket`, which puts the stored token in the socket URL"
  - "[code://src/resources/connectors/SignInStep.tsx](../../src/resources/connectors/SignInStep.tsx) - the connector sign-in: a button, then a code from the page that opens"
  - https://github.com/softov/scena/blob/d1452e9cd6d19b775932db85a4d1700b490af6cd/packages/scena/src/porta/provider.ts#L9 - the porta provider kinds, `oauth-button` among them
  - https://github.com/softov/scena/blob/d1452e9cd6d19b775932db85a4d1700b490af6cd/packages/scena/src/ui/forms/LoginForm.tsx#L107-L166 - `LoginForm` draws each `oauth-button` provider as a button beside the form
  - https://github.com/softov/scena/blob/d1452e9cd6d19b775932db85a4d1700b490af6cd/packages/scena/src/porta/providers/examples/google-oauth.ts - scena's example `oauth-button` provider, a stub
  - https://github.com/ahpio/ahpd/blob/080dc479960713655b28bd47c32f762147909541/packages/server/src/config.ts#L220-L255 - `issuer`, `issuerVerify` and `requireIssuer`, the host's issuer settings
  - https://github.com/ahpio/ahpd/blob/080dc479960713655b28bd47c32f762147909541/packages/sdk/src/access/issuers.ts#L92-L100 - `githubIssuer`: a GitHub token's login, read from `api.github.com/user`
  - https://github.com/ahpio/ahpd/blob/080dc479960713655b28bd47c32f762147909541/packages/sdk/src/access/users.ts#L1352-L1370 - `verify` asks the issuers when no local token matched
  - https://github.com/ahpio/ahpd/blob/080dc479960713655b28bd47c32f762147909541/packages/server/src/commands/run.ts#L748-L763 - the socket door, which names the person an issuer token belongs to
  - https://github.com/ahpio/ahpd/blob/080dc479960713655b28bd47c32f762147909541/packages/sdk/src/access/users.ts#L414-L431 - `signInRecord`, which fills `authorization_servers` and `scopes_supported`
  - https://github.com/ahpio/ahpd/blob/080dc479960713655b28bd47c32f762147909541/packages/sdk/src/host/handshake.ts#L867-L884 - `authenticate` answers `-32007` with the sign-in record in `resources`
  - https://github.com/ahpio/ahpd/blob/080dc479960713655b28bd47c32f762147909541/packages/sdk/src/host/auth.ts#L121-L124 - `resourcesOf`, an agent's resources, which leave out the sign-in record
  - https://github.com/ahpio/ahpd/blob/080dc479960713655b28bd47c32f762147909541/packages/sdk/src/listen.ts#L203-L204 - `bearerChallenge`, the 401 challenge, with no `resource_metadata`
  - https://github.com/ahpio/ahpd/blob/080dc479960713655b28bd47c32f762147909541/packages/tunnel-devtunnel/src/adapter.ts#L39-L51 - the devtunnel plugin's own GitHub client id and device flow endpoints
  - https://github.com/microsoft/vscode/blob/ca4b8fdc197c067724fec712c9100b22b9cd04c9/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostAuth.ts#L459-L464 - VS Code's client finds an authentication provider for each `authorization_servers` entry
  - https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps - GitHub's web flow needs `client_secret`; its device flow does not; read 2026-11-11
  - https://www.rfc-editor.org/rfc/rfc9728 - OAuth 2.0 Protected Resource Metadata, the well-known document and `resource_metadata`
---

# A person signs in through their issuer

Softov wants a person to sign in to ahpw through the issuer their record names, such as GitHub, with a button on the sign-in screen.
Today the person has to get a token from the issuer by hand and paste it in the token field.
This is not a second porta and not a second lock. It is one porta with a second provider, and either one signs in the same person.
He asked on 2026-11-11, after a question on how ahpd's issuer works.

## What others do

- **VS Code's client** reads `authorization_servers` from a protected resource. For each entry it finds an authentication provider ([`agentHostAuth.ts`](https://github.com/microsoft/vscode/blob/ca4b8fdc197c067724fec712c9100b22b9cd04c9/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostAuth.ts#L459-L464)). It gets a session from that provider and sends the session's token with `authenticate`. GitHub is one of its built-in providers.
- **GitHub's web flow** needs `client_secret` at the token exchange, PKCE or not ([docs](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)). The docs say CORS preflight is not supported.
- **GitHub's device flow** needs no secret: the person types a code on `github.com/login/device`.
- On 2026-11-11, `github.com/login/device/code` and `github.com/login/oauth/access_token` sent no `Access-Control-Allow-Origin` to a cross-origin POST. `api.github.com/user` sent `*`. So a page alone cannot get a GitHub token. A server has to do the exchange.
- **ahpd's devtunnel plugin** already runs GitHub's device flow on the host, with its own client id ([`adapter.ts`](https://github.com/ahpio/ahpd/blob/080dc479960713655b28bd47c32f762147909541/packages/tunnel-devtunnel/src/adapter.ts#L39-L51)).
- **RFC 9728** puts a resource's metadata at `/.well-known/oauth-protected-resource`, and names it in a 401's `resource_metadata` parameter ([RFC 9728](https://www.rfc-editor.org/rfc/rfc9728)). A client reads `authorization_servers` there before it holds a token.

## What ahpw has today

- The porta has one provider, `tokenProvider()` ([`code://src/App.tsx`](../../src/App.tsx#L43)). It is a `form-fields` provider with one password field ([`code://src/porta/token-provider.ts`](../../src/porta/token-provider.ts#L54-L80)).
- `check` only stores the token. The socket accepts or refuses it, and a refused token shows as a failed connection ([`code://src/porta/token-provider.ts`](../../src/porta/token-provider.ts#L18-L25)).
- The token goes in the socket URL ([`code://src/bridges/data.ts`](../../src/bridges/data.ts#L608-L613)). ahpw sends no `authenticate` for the host's sign-in.
- In an embedder, the embedder keeps the host and its token, and the page has no sign-in screen of its own.
- scena's `LoginForm` draws each `oauth-button` provider as a button beside the form ([`LoginForm.tsx`](https://github.com/softov/scena/blob/d1452e9cd6d19b775932db85a4d1700b490af6cd/packages/scena/src/ui/forms/LoginForm.tsx#L107-L166)). scena's own `oauth-button` example is a stub ([`google-oauth.ts`](https://github.com/softov/scena/blob/d1452e9cd6d19b775932db85a4d1700b490af6cd/packages/scena/src/porta/providers/examples/google-oauth.ts)).
- The connector sign-in is ahpw's nearest pattern: a button, then a code from the page that opens ([`code://src/resources/connectors/SignInStep.tsx`](../../src/resources/connectors/SignInStep.tsx)).

## What ahpd has today

- A host names a default `issuer`, `github` or an issuer URL, and each record may name its own ([`config.ts`](https://github.com/ahpio/ahpd/blob/080dc479960713655b28bd47c32f762147909541/packages/server/src/config.ts#L220-L255)).
- `verify` compares local tokens first, then asks the issuers ([`users.ts`](https://github.com/ahpio/ahpd/blob/080dc479960713655b28bd47c32f762147909541/packages/sdk/src/access/users.ts#L1352-L1370)). For GitHub, the subject is the login from `api.github.com/user`, and it must equal the record's id ([`issuers.ts`](https://github.com/ahpio/ahpd/blob/080dc479960713655b28bd47c32f762147909541/packages/sdk/src/access/issuers.ts#L92-L100)).
- The socket door uses `verify`, so an issuer token in the socket URL names its person ([`run.ts`](https://github.com/ahpio/ahpd/blob/080dc479960713655b28bd47c32f762147909541/packages/server/src/commands/run.ts#L748-L763)). The code reads that a pasted GitHub token signs in a record with `issuer: github` today. Nobody has tried it in ahpw.
- With `requireIssuer`, a local token opens the socket and names nobody. `authenticate` with it answers `-32007`, `Sign in through your issuer` ([`handshake.ts`](https://github.com/ahpio/ahpd/blob/080dc479960713655b28bd47c32f762147909541/packages/sdk/src/host/handshake.ts#L867-L884)).
- `signInRecord` fills `authorization_servers` with every issuer of the host and its records ([`users.ts`](https://github.com/ahpio/ahpd/blob/080dc479960713655b28bd47c32f762147909541/packages/sdk/src/access/users.ts#L414-L431)).
- A client sees that record only after it connects: in a `-32007` answer's `resources`, and on `auth/required`. An agent's resources leave it out ([`auth.ts`](https://github.com/ahpio/ahpd/blob/080dc479960713655b28bd47c32f762147909541/packages/sdk/src/host/auth.ts#L121-L124)).
- The 401 at the door carries `Bearer realm="ahpd"`, with no `resource_metadata` ([`listen.ts`](https://github.com/ahpio/ahpd/blob/080dc479960713655b28bd47c32f762147909541/packages/sdk/src/listen.ts#L203-L204)). The host serves no `/.well-known/oauth-protected-resource`.
- So a page with no token cannot learn which issuers the host takes.

## Who writes

- ahpw has no open pull request.
- `sessions/pull-request-chip` is pushed and touches none of `src/App.tsx`, `src/porta/`, `src/lib/api.ts` or `src/bridges/data.ts`.
- `trust/read-the-hosts-trust` is local and changes `src/bridges/data.ts` in `greet`, not in `openSocket`.
- ahpd's one open pull request, #288, touches none of `listen.ts`, `issuers.ts`, `users.ts` or `http.ts`. No ahpd branch touches them.

## The change

- ahpd publishes its sign-in record before sign-in, at `/.well-known/oauth-protected-resource`, and names it in the 401's `resource_metadata`, as RFC 9728 says.
- ahpw reads that record when it shows the sign-in screen, and adds one `oauth-button` provider for each entry in `authorization_servers`.
- The button sits beside the token field, in the same Limen. The token field stays, unless every record requires the issuer.
- A token from the button goes where a pasted token goes: the socket URL. The host's door then names the person, as it does today.
- For GitHub, the page cannot do the exchange itself. The host runs it for the page, as the devtunnel plugin runs GitHub's device flow.
- For an OIDC issuer, the page runs the authorization code flow with PKCE against the issuer.
- In an embedder nothing changes, because the embedder holds the token.

## Open points

- Which flow the host runs for a GitHub sign-in. The device flow shows a code on the screen. The web flow needs a secret that the host keeps.
- Whose GitHub client id the host uses: one ahpd ships, or one the deployment registers.
- Where ahpw gets an OIDC issuer's client id, since RFC 9728 metadata carries none.
- Whether each OIDC issuer a deployment uses answers CORS on its token endpoint. Not checked.
- What ahpw does when an issuer token expires: sign in again, or refresh. A GitHub OAuth token does not expire; an OIDC token does.
- How a button is labelled: `GitHub` for GitHub, and the issuer's host name for an OIDC URL, or a name the deployment sets.
