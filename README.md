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

Edit `.env`:
```env
# Absolute path to your Minecraft server's plugins folder on the host
PLUGINS_PATH=/path/to/minecraft/plugins

# Must match server.properties
RCON_PORT=25575
RCON_PASSWORD=your_password_here

# Optional: per-plugin reload with PluginMan (default reloads entire server)
# RCON_RELOAD_COMMAND=plugman reload %plugin%
```

**3. Build and start**
```bash
docker compose up --build -d
```

**4. Open the panel**

Navigate to `http://your-server-ip:3000`

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
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Editor | Monaco Editor |
| Jar parsing | adm-zip + js-yaml |
| RCON | rcon-client |
| Runtime | Docker / Node 22 Alpine |

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
| `RCON_HOST` | `host.docker.internal` | Minecraft server hostname from Docker |
| `RCON_PORT` | `25575` | RCON port |
| `RCON_PASSWORD` | *(required for reload)* | RCON password |
| `RCON_RELOAD_COMMAND` | `reload confirm` | Command sent on reload (`%plugin%` = plugin name) |
| `PORT` | `3000` | Web panel port |
