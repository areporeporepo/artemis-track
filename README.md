<h1 align="center">orion-status</h1>
<p align="center">Real-time Artemis II tracker for your terminal.</p>

<p align="center">
  <img src="docs/demo.gif" alt="orion-status live demo" width="100%"/>
</p>

## Install

```bash
npm i -g orion-status
```

### Claude Code status line

```json
{
  "statusLine": {
    "type": "command",
    "command": "echo '{\"unused\":true}' | npx orion-status"
  }
}
```

## Architecture

```
NASA DSN XML ──> CF Durable Object (1s alarm) ──> KV ──> GET /position
JPL Horizons  ──> CF Cron (1s)                 ──> KV ──/
                                                        |
                                              Client (interpolation)
                                                        |
                                              Terminal status line
```

## License

MIT
