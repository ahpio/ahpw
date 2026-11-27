# CLI

```sh
ahpw serve [options]
```

| Option | What it does |
| --- | --- |
| `--connect URL` | The server's socket: `ws://`, `wss://`, `http://`, `https://` or `HOST:PORT` |
| `--token SECRET` | The token to add to the socket |
| `--token-file PATH` | Read the token from a file |
| `--host ADDR` | Bind here, default `127.0.0.1` |
| `--port N` | Listen here, default `5190`. `0` picks a free port |
| `--open` | Open the page in a browser once it is served |
| `--client-name NAME` | The name the server's client list shows for the page, default `ahpw` |
| `--client-title TITLE` | The title the server's client list shows for the page, default `ahpw` |
| `--tls-cert PATH` | Serve https with this certificate, a PEM file. Needs `--tls-key` |
| `--tls-key PATH` | The private key of `--tls-cert`, a PEM file |
| `--domain NAME` | The name the page is reached by, as the certificate names it. A page there may open the socket, as one at an IP address or `localhost` may |

`http://` and `https://` name the same port as `ws://` and `wss://`. A bare `HOST:PORT` is taken as `ws://HOST:PORT`.

A `tkn=` in the `--connect` URL counts as the token. Give one of `--token`, `--token-file` or a `tkn=`, not two.

Give `--tls-cert` and `--tls-key` together, or neither. `--domain` is a bare host name, with no scheme, port or path.

A flag beats the [config file](CONFIG-FILE.md), and the file beats the [environment](ENVIRONMENT.md).
