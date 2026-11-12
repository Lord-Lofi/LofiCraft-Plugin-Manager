# LofiCraft Panel

A polished, animated web panel for managing your Minecraft server's plugins — browse installed plugins, view their metadata, edit config files in-browser, and reload the server via RCON. Runs entirely in Docker.

---

## Features

- **Plugin discovery** — automatically scans your plugins folder and reads `plugin.yml` from every `.jar` to display name, version, description, and authors
- **Config editor** — Monaco-powered editor (same engine as VS Code) with syntax highlighting for YAML, JSON, TOML, and `.properties` files
- **File tree** — nested sidebar for navigating multi-file plugin configs
- **RCON reload** — send a reload command to your live server directly from the panel
- **Live file access** — the plugins folder is volume-mounted, so changes are always up to date without restarting the container
- **Search** — filter plugins by name, description, or author
- **Dark theme** — minimal dark UI with green accents and smooth animations

---

## Prerequisites

- Docker + Docker Compose on the server hosting your Minecraft instance
- RCON enabled in `server.properties`:
  ```
  enable-rcon=true
  rcon.port=25575
  rcon.password=your_password_here
  ```

---

## Setup

**1. Clone the repo**
```bash
git clone https://github.com/Lord-Lofi/LofiCraft-Plugin-Manager.git
cd LofiCraft-Plugin-Manager
```

**2. Configure environment**
```bash
cp .env.example .env
```

Edit `.env` (it is gitignored, so your real values never reach GitHub). At minimum set:
```env
# Absolute path to your Minecraft server's plugins folder on the host
PLUGINS_PATH=/path/to/minecraft/plugins

# Must match server.properties
RCON_PASSWORD=your_password_here

# UID/GID that own the plugins folder. Find them with:
#   stat -c '%u %g' /path/to/your/plugins
PUID=1000
PGID=1000
```

See `.env.example` and the table below for every setting.

**3. Build and start**
```bash
docker compose up --build -d
```

**4. Open the panel**

On the machine running Docker, open `http://localhost:3000`.

The panel has **no login of its own**: anyone who can reach it can edit configs and reload your server. By default it only listens on `127.0.0.1` (this machine). To use it from other devices, put it behind SWAG and Authelia (below). Never forward its port to the internet.

---

## Running behind SWAG + Authelia

1. Find SWAG's Docker network name (`docker network ls`) and add to `.env`:
   ```env
   SWAG_NETWORK=your_swag_network
   ALLOWED_HOSTS=localhost,127.0.0.1,loficraft.example.com
   ```
2. Remove the published port and join SWAG's network:
   ```bash
   cp docker-compose.swag.example.yml docker-compose.override.yml
   docker compose up -d
   ```
3. Copy `swag/loficraft.subdomain.conf.sample` to SWAG's `nginx/proxy-confs/loficraft.subdomain.conf` and restart SWAG. It requires an Authelia login before anything reaches the panel.

`docker-compose.override.yml` is gitignored, so your network name stays local.

---

## Usage

| Action | How |
|--------|-----|
| Browse plugins | Main page — all installed `.jar` files are listed automatically |
| View plugin info | Each card shows name, version, description, and authors |
| Edit a config | Click a plugin card → select a file in the sidebar → edit in Monaco |
| Save changes | Click **Save** in the editor toolbar |
| Reload server | Click **Reload** — sends the configured RCON command |

---

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Editor | Monaco Editor |
| Jar parsing | adm-zip + js-yaml |
| RCON | rcon-client |
| Runtime | Docker / Node 26 Alpine |

---

## Project Structure

```
src/
├── app/
│   ├── api/plugins/          # REST API routes
│   ├── plugins/[name]/       # Plugin detail page
│   └── page.tsx              # Plugin grid home page
├── components/
│   ├── PluginCard.tsx        # Animated plugin card
│   ├── PluginGrid.tsx        # Searchable grid with loading states
│   ├── ConfigEditor.tsx      # Monaco editor with save/reload
│   ├── ConfigFileTree.tsx    # Nested file tree sidebar
│   └── Navbar.tsx
└── lib/
    ├── plugin-reader.ts      # Jar inspection + config file I/O
    └── rcon.ts               # RCON client wrapper
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PLUGINS_PATH` | *(required)* | Host path to your plugins folder |
| `PUID` / `PGID` | `1000` | User and group the container runs as. Must own the plugins folder |
| `RCON_HOST` | `host.docker.internal` | Minecraft server address, as seen from the container |
| `RCON_PORT` | `25575` | RCON port |
| `RCON_PASSWORD` | *(required)* | RCON password |
| `RCON_RELOAD_COMMAND` | `reload confirm` | Command sent on reload (`%plugin%` = plugin name) |
| `BIND_ADDRESS` | `127.0.0.1` | Address the port listens on. Keep it local unless the network is trusted |
| `PORT` | `3000` | Port on the host |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Host names the panel answers to (add your SWAG subdomain) |
| `CONTAINER_NAME` | `loficraft-panel` | Container name (SWAG uses it to reach the panel) |
| `SWAG_NETWORK` | *(none)* | SWAG's Docker network, only for the SWAG override file |

---

## Security

- **No built-in login.** Keep the panel on `127.0.0.1` or behind SWAG + Authelia. The host allowlist (`ALLOWED_HOSTS`) blocks DNS-rebinding attacks from other websites.
- **Least privilege:** the container runs as your `PUID:PGID` (never root), with all Linux capabilities dropped, `no-new-privileges`, and a read-only filesystem except the plugins folder.
- **Limited file access:** only existing config files (`.yml`, `.yaml`, `.json`, `.toml`, `.conf`, `.properties`, `.txt`) inside a plugin's own folder can be read or saved, up to 2 MB. Symlinks that lead outside the folder are refused, and the panel never creates or deletes files.
- **Untrusted jars:** plugin names from `plugin.yml` are only used if they contain safe characters, and oversized `plugin.yml` files are ignored.
- **Browser protections:** save and reload require a same-site request with a custom header (CSRF protection), and every page sends a strict Content-Security-Policy and other security headers. Monaco Editor is bundled, not loaded from a CDN.
- **Supply chain:** dependencies install from `package-lock.json` with `npm ci --ignore-scripts`. Dependabot, CodeQL and CI check every pull request.

Report vulnerabilities privately; see [SECURITY.md](SECURITY.md).

---

## Roadmap

- **Plugin upgrades** — upload a new `.jar` through the panel to replace an existing plugin. The flow would be: upload via a file picker, swap the jar in the plugins folder, then trigger a server restart (most plugins require a full restart rather than `/reload` to properly swap jars). Requires either RCON restart support or a separate restart mechanism on the host.
- **Plugin enable/disable** — move jars in/out of a `disabled/` subfolder without deleting them
- **Dependency graph** — visualise `depend` and `softdepend` relationships between plugins
- **Config diff view** — show what changed since the last save with a side-by-side diff
- **Multi-server support** — manage plugins across multiple server instances from one panel
