# Zenith Project Architecture

This document provides a high-level overview of the Zenith sports trading card application architecture, tech stack, and coding conventions.

## 1. Project Overview
Zenith is a specialized web application for FC Mobile sports trading card enthusiasts. It enables users to:
- Browse and search a comprehensive player database.
- Track real-time market prices and trends.
- Build and share custom squads.
- Manage a professional watchlist for price tracking.
- Calculate ROI and shard requirements for player upgrades.

## 2. Tech Stack
- **Backend**: FastAPI (Python) - High-performance asynchronous API framework.
- **Database**: PostgreSQL - Primary relational database for player metadata and user data.
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3 - Responsive SPA architecture.
- **External Services**: Supabase (PostgreSQL-as-a-Service) - Primarily used for price snapshots and real-time updates.
- **Infrastructure**: Hosted on DigitalOcean VPS with nginx serving as a reverse proxy and SSL termination.

## 3. Project Structure
The project follows a modular organization for frontend assets:

```text
/
├── assets/
│   ├── css/            # Component-specific stylesheets (style.css, tool-style.css, etc.)
│   ├── js/             # Application logic
│   │   ├── data/       # Data providers (api-client.js, supabase-provider.js, config.js)
│   │   ├── views/      # View-specific controllers (database.js, squadBuilder.js, etc.)
│   │   ├── utils/      # Shared helper functions
│   │   └── app.js      # Main entry point and state management
│   ├── images/         # Static visual assets and backgrounds
│   └── fonts/          # Custom typography
├── index.html          # Main application shell (SPA)
└── .junie/             # AI guidelines and project documentation
```

## 4. Database Schema
- **Players**: Core attributes (ID, name, OVR, position, team, league, nation, skills).
- **Price Snapshots**: (`price_snapshots` table in Supabase)
  - `asset_id`: Maps to `player_id`.
  - `price0` - `price5`: Prices for different rank levels.
  - `captured_at`: Timestamp for price tracking.
- **Skill Allocations**: User-specific upgrades and point distributions.

## 5. API Architecture
- **Endpoint Pattern**: `/api/{version}/{resource}`
- **Authentication**: Simple numeric `userId` stored in `localStorage`, passed to user-specific endpoints.
- **Key Patterns**:
  - `GET /players`: Filtered and paginated player list.
  - `GET /players/{id}`: Full player detail with skill trees.
  - `GET /filters/*`: Metadata for search filters (teams, leagues, nations).
  - `POST /skills/upgrade`: Updates user skill allocations.

## 6. Frontend Patterns
- **SPA Architecture**: Uses a single `index.html` shell with multiple `.view` containers. Visibility is managed via `switchView(viewId)` in `app.js`.
- **State Management**: A global `state` object tracks current filters, results, and active view.
- **Modular CSS**: Responsive layouts using Flexbox/Grid, with specific breakpoints for mobile devices.
- **Component Rendering**: Dynamic HTML generation via JavaScript (e.g., `createPlayerCard`).

## 7. Key File Locations
- **API Client**: `assets/js/data/api-client.js`
- **Main Logic**: `assets/js/app.js`
- **View Logic**: `assets/js/views/`
- **Global Styles**: `assets/css/style.css`
- **Environment Config**: `assets/js/data/config.js`

## 8. Coding Conventions
- **Naming**: 
  - JS: `camelCase` for functions/variables, `PascalCase` for classes.
  - CSS: `kebab-case` for class names (e.g., `btn--outline`).
- **Comments**: Purpose-driven comments for complex logic; block comments for module headers.
- **Async Pattern**: Unified use of `async/await` for all I/O and data fetching operations.

## 9. Development Workflow
- **Data Updates**: Backend cron jobs/async tasks handle scraping and price updates from external sources.
- **Deployment**: DigitalOcean deployment with nginx configuration for static assets and API proxying.
- **Testing**: UI-focused manual and integration testing for core workflows (Search -> Detail -> Watchlist).
