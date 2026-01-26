# RetailOps Command Center

RetailOps Command Center is a frontend-focused, production-style dashboard that
simulates real-time retail operations telemetry. It demonstrates clean
architecture, modular state management, and accessible UI design while using
zero external dependencies.

## Features

- **Live KPI telemetry** with 60-minute sparkline trends
- **Store performance table** with search, region filtering, and sortable KPIs
- **Alert stream** with severity tags and live updates
- **Fulfillment pipeline** showing throughput against targets
- **Scenario planner** to preview forecast impact in real time
- **Snapshot export** to download the current state as JSON
- **Theme toggle** with local persistence
- **Accessible defaults** (semantic HTML, readable contrast, reduced motion)

## Architecture

This project uses a lightweight, modular architecture designed for clarity and
maintainability:

- **`index.html`**: semantic layout and accessible markup
- **`styles/`**:
  - `base.css` - design tokens and global reset
  - `layout.css` - page-level layout and grids
  - `components.css` - reusable UI components
- **`scripts/`**:
  - `app.js` - orchestration, DOM wiring, and rendering
  - `state.js` - minimal state store with subscriptions
  - `data.js` - domain data + real-time simulation engine
  - `charts.js` - canvas-based sparkline rendering
  - `utils.js` - formatting and shared helpers

### Data flow

1. `createInitialState()` seeds the UI with baseline data.
2. `state.js` publishes updates to subscribed render functions.
3. `simulateTick()` generates live telemetry every 8 seconds.
4. `render()` updates KPIs, tables, alerts, and charts from state.
5. User input (search, filter, scenario planner) updates state in real time.

## How to run

Because ES modules require a local server, run the project with any static file
server. Example with Python:

```bash
cd projects/retail-ops-command-center
python -m http.server 5173
```

Open your browser at:

```
http://localhost:5173
```

## Customization

- **Branding + colors**: edit tokens in `styles/base.css`.
- **Store dataset**: update the `INITIAL_STORES` array in `scripts/data.js`.
- **Alert templates**: customize `ALERT_TEMPLATES` in `scripts/data.js`.
- **Forecast model**: modify `computeForecast()` in `scripts/data.js`.

## Notes

- Data is simulated for demo purposes.
- The architecture is intentionally framework-agnostic to highlight core
  frontend engineering skills.
