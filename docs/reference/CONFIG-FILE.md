# Config file

`ahpw serve` reads `~/.config/ahpw/config.json`, and `pnpm dev` reads its `tlsCert`, `tlsKey` and `domain`. Every [option](CLI.md) can go in it, spelled the same without the dashes:

```json
{
  "connect": "ws://127.0.0.1:9187",
  "tokenFile": "~/.config/ahpd/token",
  "port": 5190
}
```

| Key | Type |
| --- | --- |
| `connect` | string |
| `token` | string |
| `tokenFile` | string. A `~` at the start is your home folder |
| `host` | string |
| `port` | integer |
| `open` | boolean |
| `clientName` | string |
| `clientTitle` | string |
| `tlsCert` | string, a path. A `~` at the start is your home folder |
| `tlsKey` | string, a path. A `~` at the start is your home folder |
| `domain` | string, a bare host name |

A key `serve` does not take, or a value of the wrong type, stops it with an error. Keep one of `token` and `tokenFile`.

A flag beats the file, and the file beats the [environment](ENVIRONMENT.md).
