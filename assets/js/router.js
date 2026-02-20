/* ============================================================
   ZENITH FCM - Client-Side Router
   File: assets/js/router.js

   Handles all SPA URL routing using HTML5 History API.
   Routes:
     /                    → Dashboard
     /players             → Player Database
     /player/:id          → Player Detail  (?rank=0)
     /watchlist           → Watchlist
     /market              → Market
     /squad-builder       → Squad Builder
     /compare             → Compare Tool
     /404                 → Not Found
   ============================================================ */

(function () {
  "use strict";

  /* ──────────────────────────────────────────────
     LOGGER — safe wrapper, won't crash if console
     is unavailable in some environments
  ────────────────────────────────────────────── */
  const ZRouter = {
    DEBUG: true, // set false in production to silence logs

    log(msg, data) {
      if (!this.DEBUG) return;
      data !== undefined
        ? console.log(`%c[ZRouter] ${msg}`, "color:#6366F1;font-weight:600", data)
        : console.log(`%c[ZRouter] ${msg}`, "color:#6366F1;font-weight:600");
    },

    warn(msg, data) {
      data !== undefined
        ? console.warn(`%c[ZRouter] ⚠️ ${msg}`, "color:#F59E0B;font-weight:600", data)
        : console.warn(`%c[ZRouter] ⚠️ ${msg}`, "color:#F59E0B;font-weight:600");
    },

    error(msg, err) {
      err !== undefined
        ? console.error(`%c[ZRouter] ❌ ${msg}`, "color:#EF4444;font-weight:600", err)
        : console.error(`%c[ZRouter] ❌ ${msg}`, "color:#EF4444;font-weight:600");
    },

    /* ──────────────────────────────────────────────
       ROUTE DEFINITIONS
       Each route has:
         - handler(params, query) → called when route matches
         - title                  → document.title
    ────────────────────────────────────────────── */
    routes: {
      "/": {
        title: "Zenith FCM - Home",
        handler(params, query) {
          ZRouter.log("Rendering → Dashboard");
          if (typeof switchView === "function") {
            switchView("dashboard");
          } else {
            ZRouter.error("switchView() not found. Is app.js loaded?");
          }
        },
      },

      "/players": {
        title: "Player Database - Zenith FCM",
        handler(params, query) {
          ZRouter.log("Rendering → Player Database", { query });
          if (typeof switchView === "function") {
            switchView("database");
            // If URL has filter params, apply them
            // e.g. /players?pos=ST&event=TOTY+25
            if (query.pos && typeof applyPositionFilter === "function") {
              ZRouter.log("Applying position filter from URL", query.pos);
              applyPositionFilter(query.pos);
            }
          } else {
            ZRouter.error("switchView() not found.");
          }
        },
      },

      "/player/:id": {
        title: "Player Details - Zenith FCM",
        handler(params, query) {
          const playerId = params.id;
          const rank = query.rank ? parseInt(query.rank, 10) : 0;

          ZRouter.log("Rendering → Player Detail", { playerId, rank });

          if (!playerId) {
            ZRouter.error("No player ID in route params!", params);
            ZRouter.navigate("/404");
            return;
          }

          if (isNaN(rank) || rank < 0 || rank > 5) {
            ZRouter.warn("Invalid rank in query param, defaulting to 0", query.rank);
          }

          if (typeof viewPlayerDetail === "function") {
            viewPlayerDetail(playerId, isNaN(rank) ? 0 : rank);
          } else {
            ZRouter.error("viewPlayerDetail() not found. Is app.js loaded?");
          }
        },
      },

      "/watchlist": {
        title: "My Watchlist - Zenith FCM",
        handler(params, query) {
          ZRouter.log("Rendering → Watchlist");
          if (typeof switchView === "function") {
            switchView("watchlist");
          } else {
            ZRouter.error("switchView() not found.");
          }
        },
      },

      "/market": {
        title: "Market Tracker - Zenith FCM",
        handler(params, query) {
          ZRouter.log("Rendering → Market (Under Construction)");
          // Show under construction modal, stay on current view
          if (typeof openMarketModal === "function") {
            openMarketModal();
          }
          // Replace URL back so it doesn't stay on /market
          window.history.replaceState(null, "", window.location.pathname === "/market" ? "/players" : window.location.pathname);
        },
      },

      "/squad-builder": {
        title: "Squad Builder - Zenith FCM",
        handler(params, query) {
          ZRouter.log("Rendering → Squad Builder");
          if (typeof openSquadBuilderModal === "function") {
            setTimeout(openSquadBuilderModal, 100);
          }
        },
      },

      "/compare": {
        title: "Player Comparison - Zenith FCM",
        handler(params, query) {
          ZRouter.log("Rendering → Compare Tool");
          if (typeof openCompareModal === "function") {
            setTimeout(openCompareModal, 100);
          }
        },
      },

      "/404": {
        title: "Page Not Found - Zenith FCM",
        handler(params, query) {
          ZRouter.warn("Rendering → 404 Page");
          // You can render a custom 404 view here or just redirect home
          if (typeof switchView === "function") {
            switchView("dashboard");
          }
        },
      },
    },

    /* ──────────────────────────────────────────────
       PARSE ROUTE
       Matches a pathname against all defined routes.
       Supports dynamic segments like /player/:id
       Returns { route, params } or null.
    ────────────────────────────────────────────── */
    parseRoute(pathname) {
      ZRouter.log("Parsing pathname", pathname);

      for (const pattern in this.routes) {
        // Convert route pattern to regex
        // /player/:id  →  ^\/player\/([^/]+)$
        const paramNames = [];
        const regexString = pattern
          .replace(/\//g, "\\/")
          .replace(/:(\w+)/g, (_, key) => {
            paramNames.push(key);
            return "([^\\/]+)";
          });

        const regex = new RegExp(`^${regexString}$`);
        const match = pathname.match(regex);

        if (match) {
          // Build params object from captured groups
          const params = {};
          paramNames.forEach((name, i) => {
            params[name] = decodeURIComponent(match[i + 1]);
          });

          ZRouter.log(`Matched route "${pattern}"`, { params });
          return { route: this.routes[pattern], params };
        }
      }

      ZRouter.warn(`No route matched for "${pathname}", falling back to /404`);
      return { route: this.routes["/404"], params: {} };
    },

    /* ──────────────────────────────────────────────
       PARSE QUERY PARAMS
       Converts "?rank=3&pos=ST" into { rank: "3", pos: "ST" }
    ────────────────────────────────────────────── */
    parseQuery(search) {
      const query = {};
      if (!search || search.length <= 1) return query;
      try {
        const params = new URLSearchParams(search);
        params.forEach((value, key) => {
          query[key] = value;
        });
      } catch (e) {
        ZRouter.error("Failed to parse query string", e);
      }
      return query;
    },

    /* ──────────────────────────────────────────────
       HANDLE ROUTE
       Main dispatcher. Called on every navigation.
    ────────────────────────────────────────────── */
    handleRoute() {
      const pathname = window.location.pathname;
      const search = window.location.search;
      const fullUrl = window.location.href;

      ZRouter.log("─".repeat(40));
      ZRouter.log("handleRoute() called", { pathname, search, fullUrl });

      try {
        const { route, params } = this.parseRoute(pathname);
        const query = this.parseQuery(search);

        // Update page title
        if (route.title) {
          document.title = route.title;
          ZRouter.log("Title updated", route.title);
        }

        // Call route handler
        route.handler(params, query);

        // Update active nav link
        this.updateActiveNav(pathname);

        ZRouter.log("Route handled successfully ✅");
      } catch (err) {
        ZRouter.error("Route handler threw an error", err);
        // Safety fallback: go home
        try {
          if (typeof switchView === "function") switchView("dashboard");
        } catch (fallbackErr) {
          ZRouter.error("Even fallback failed", fallbackErr);
        }
      }
    },

    /* ──────────────────────────────────────────────
       NAVIGATE
       Programmatic navigation. Updates URL + renders.
       Use this everywhere in app.js instead of switchView().

       Usage:
         ZRouter.navigate('/players')
         ZRouter.navigate('/player/23076')
         ZRouter.navigate('/player/23076?rank=3')
    ────────────────────────────────────────────── */
    navigate(path) {
      if (!path) {
        ZRouter.error("navigate() called with empty path");
        return;
      }

      const currentPath = window.location.pathname + window.location.search;

      // Don't push duplicate history entries
      if (path === currentPath) {
        ZRouter.warn("navigate() called with same path, re-handling route", path);
        this.handleRoute();
        return;
      }

      ZRouter.log("navigate() →", path);

      try {
        window.history.pushState({ path }, "", path);
        this.handleRoute();
        // Scroll to top on navigation
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (err) {
        ZRouter.error("pushState failed (are you on file:// protocol?)", err);
        ZRouter.warn("Hint: Use a local server (Live Server, nginx) not file://");
      }
    },

    /* ──────────────────────────────────────────────
       REPLACE
       Like navigate() but replaces history entry
       (no new entry in browser history stack).
       Use when redirecting, e.g. on errors.
    ────────────────────────────────────────────── */
    replace(path) {
      ZRouter.log("replace() →", path);
      try {
        window.history.replaceState({ path }, "", path);
        this.handleRoute();
      } catch (err) {
        ZRouter.error("replaceState failed", err);
      }
    },

    /* ──────────────────────────────────────────────
       UPDATE ACTIVE NAV
       Adds .active class to the matching nav link.
    ────────────────────────────────────────────── */
    updateActiveNav(pathname) {
      try {
        document.querySelectorAll("[data-nav-link]").forEach((el) => {
          el.classList.remove("active");
          const href = el.getAttribute("href") || el.getAttribute("data-nav-path");
          if (href && (pathname === href || (href !== "/" && pathname.startsWith(href)))) {
            el.classList.add("active");
            ZRouter.log("Active nav updated", href);
          }
        });
      } catch (err) {
        ZRouter.error("updateActiveNav() failed", err);
      }
    },

    /* ──────────────────────────────────────────────
       INIT
       Bootstrap the router. Call once on DOMContentLoaded.
    ────────────────────────────────────────────── */
    init() {
      ZRouter.log("Initializing Zenith Router...");
      ZRouter.log("Environment", {
        protocol: window.location.protocol,
        host: window.location.host,
        pathname: window.location.pathname,
      });

      // Safety: pushState doesn't work on file:// protocol
      if (window.location.protocol === "file:") {
        ZRouter.warn(
          "You are running on file:// protocol. URL routing won't work properly."
        );
        ZRouter.warn(
          "Use VS Code Live Server or nginx. Routing is disabled for safety."
        );
        return; // Exit early, don't break the app
      }

      // Handle back/forward browser buttons
      window.addEventListener("popstate", (e) => {
        ZRouter.log("popstate fired (back/forward button)", e.state);
        this.handleRoute();
      });

      // Intercept all clicks on [data-link] elements
      document.addEventListener("click", (e) => {
        const target = e.target.closest("[data-link]");
        if (!target) return;

        e.preventDefault();
        const href = target.getAttribute("href");

        if (!href) {
          ZRouter.warn("data-link element has no href attribute", target);
          return;
        }

        ZRouter.log("data-link clicked", href);
        this.navigate(href);
      });

      // Handle initial route (page load / direct URL)
      ZRouter.log("Handling initial route on page load...");
      this.handleRoute();

      ZRouter.log("Router initialized ✅");
    },
  };

  // Expose globally so app.js can call ZRouter.navigate()
  window.ZRouter = ZRouter;
  ZRouter.log("ZRouter attached to window ✅");

})();
