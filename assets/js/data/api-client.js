// Zenith API Client (updated & perfected)
// Based on your uploaded api-client.js (keeps same base URL and routes)
const API_BASE_URL = 'https://zenithfcm.com/api';


class ZenithAPIClient {
  constructor(baseURL = API_BASE_URL, options = {}) {
    this.baseURL = baseURL.replace(/\/+$/, ''); // no trailing slash
    this.cache = new Map();
    this.cacheTTL = options.cacheTTL ?? 5 * 60 * 1000; // default 5 minutes
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    };
    this.debug = options.debug ?? false;
  }

  // Internal: log when debug enabled
  _log(...args) {
    if (this.debug) console.log(...args);
  }

  // Build full URL from endpoint (endpoint may start with /)
  _url(endpoint) {
    if (!endpoint) throw new Error('Missing endpoint');
    return `${this.baseURL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  }

  // Flexible fetch with caching
  // options: { method, headers, body, cache: true/false, cacheTTL }
  async fetchWithCache(endpoint, options = {}) {
    const { cache = true, cacheTTL = this.cacheTTL, ...fetchOptions } = options;
    const cacheKey = `${endpoint}::${JSON.stringify(fetchOptions)}`;

    // Try cache
    if (cache) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheTTL) {
        this._log(`[API] Cache hit: ${endpoint}`);
        return cached.data;
      }
    }

    const url = this._url(endpoint);
    this._log(`[API] Fetching: ${url}`);

    // Merge headers
    fetchOptions.headers = {
      ...this.defaultHeaders,
      ...(fetchOptions.headers || {})
    };

    try {
      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        // attempt to parse JSON error, otherwise throw status text
        let errText;
        try {
          const errJson = await response.json();
          errText = JSON.stringify(errJson);
        } catch (e) {
          errText = await response.text();
        }
        throw new Error(`API Error: ${response.status} ${response.statusText} — ${errText}`);
      }

      // parse JSON safely
      const data = await response.json();

      if (cache) {
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
      }

      return data;
    } catch (error) {
      this._log(`[API] Error fetching ${endpoint}:`, error);
      throw error;
    }
  }

  // Clear entire cache
  clearCache() {
    this._log('[API] Cache cleared');
    this.cache.clear();
  }

  // Remove a single cache entry (helpful after updates)
  clearCacheEntry(endpoint, options = {}) {
    const key = `${endpoint}::${JSON.stringify(options)}`;
    this.cache.delete(key);
  }

  // ---------- Players / list ----------
  async getPlayers(filters = {}, opts = {}) {
      const params = new URLSearchParams();

      if (filters.limit !== undefined) params.append('limit', filters.limit);
      if (filters.offset !== undefined) params.append('offset', filters.offset);
      if (filters.position) params.append('position', filters.position);
      if (filters.min_ovr !== undefined) params.append('min_ovr', filters.min_ovr);
      if (filters.max_ovr !== undefined) params.append('max_ovr', filters.max_ovr);
      if (filters.team) params.append('team', filters.team);
      if (filters.league) params.append('league', filters.league);
      if (filters.nation) params.append('nation', filters.nation);
      if (filters.event) params.append('event', filters.event);
      if (filters.rank !== undefined) params.append('rank', filters.rank);
      if (filters.name_starts_with) params.append('name_starts_with', filters.name_starts_with);
      if (filters.skill_moves !== undefined) params.append('skill_moves', filters.skill_moves);
      if (filters.is_untradable !== undefined) params.append('is_untradable', filters.is_untradable);
      if (filters.sort_by) params.append('sort_by', filters.sort_by);
      if (filters.order) params.append('order', filters.order);

      const endpoint = `/players?${params.toString()}`;
      return this.fetchWithCache(endpoint, { cache: opts.cache ?? true, cacheTTL: opts.cacheTTL });
    }


  // ---------- Search (lightweight) ----------
  // IMPORTANT: this returns a light object suitable for autocomplete/search UI
  async searchPlayers(params = {}, opts = {}) {
    const q = new URLSearchParams();
    if (params.q) q.append('q', params.q);
    if (params.limit !== undefined) q.append('limit', params.limit);
    if (params.offset !== undefined) q.append('offset', params.offset);
    if (params.rank !== undefined) q.append('rank', params.rank);

    // Use the search endpoint which should return small objects (id, name, ovr, position, image, team, league)
    const endpoint = `/players/search?${q.toString()}`;
    return this.fetchWithCache(endpoint, { cache: opts.cache ?? true, cacheTTL: opts.cacheTTL });
  }

  // ---------- Player detail (full payload) ----------
  async getPlayerDetails(playerId, rank = 0, opts = {}) {
    if (playerId === undefined || playerId === null) throw new Error('playerId is required');
    const endpoint = `/players/${encodeURIComponent(playerId)}?rank=${encodeURIComponent(rank)}`;
    // Detailed endpoint may be used less frequently; still cacheable
    return this.fetchWithCache(endpoint, { cache: opts.cache ?? true, cacheTTL: opts.cacheTTL });
  }

  // ---------- Skills ----------
  async getSkills(opts = {}) {
    return this.fetchWithCache('/skills', { cache: opts.cache ?? true, cacheTTL: opts.cacheTTL });
  }

  async getSkillBoosts(skillId, opts = {}) {
    if (skillId === undefined || skillId === null) throw new Error('skillId is required');
    return this.fetchWithCache(`/skill-boosts/${encodeURIComponent(skillId)}`, { cache: opts.cache ?? true, cacheTTL: opts.cacheTTL });
  }

  // ==================== USER SKILL ALLOCATIONS ====================

  /**
   * Get user's skill allocations for a player at a specific rank
   */
  async getUserSkillAllocations(userId, playerId, rank = 0, opts = {}) {
    if (userId === undefined || userId === null) throw new Error('userId is required');
    if (playerId === undefined || playerId === null) throw new Error('playerId is required');
    
    const { allowLocalOverride = true, updateCache = true, ...requestOpts } = opts;
    if (allowLocalOverride && typeof window !== 'undefined' && typeof window.getSkillAllocationsCacheEntry === 'function') {
      const cachedEntry = window.getSkillAllocationsCacheEntry(userId, playerId, rank);
      if (cachedEntry && cachedEntry.source === 'local') {
        return { allocations: cachedEntry.allocations || [], source: 'local', cached: true };
      }
    }

    const endpoint = `skills/allocations/${encodeURIComponent(userId)}/${encodeURIComponent(playerId)}?rank=${encodeURIComponent(rank)}`;
    
    // Don't cache allocations - they change frequently
    const response = await this.fetchWithCache(endpoint, { 
      cache: false,  // Always fetch fresh
      ...requestOpts 
    });
    if (updateCache && typeof window !== 'undefined' && typeof window.setSkillAllocationsCacheEntry === 'function' && response?.allocations) {
      window.setSkillAllocationsCacheEntry(userId, playerId, rank, response.allocations, 'server');
    }
    return response;
  }

  /**
   * Upgrade a skill for a user's player
   */
  async upgradeSkill(userId, playerId, rank, skillId, newLevel, opts = {}) {
    if (!userId || !playerId || rank === undefined || skillId === undefined || skillId === null || newLevel === undefined || newLevel === null) {
      throw new Error('userId, playerId, rank, skillId, and newLevel are required');
    }
    
    const params = new URLSearchParams({
      user_id: userId,
      player_id: playerId,
      rank: rank,
      skill_id: skillId,
      new_level: newLevel
    });
    
    const endpoint = `skills/upgrade?${params.toString()}`;
    
    // POST request
    const response = await this.fetchWithCache(endpoint, {
      method: 'POST',
      cache: false,  // Don't cache POST requests
      ...opts
    });
    
    // Clear player detail cache after upgrade (stats changed)
    this.clearCacheEntry(`players/${playerId}?rank=${rank}`);
    
    return response;
  }

  /**
   * Reset all skill allocations for a user's player at a rank
   */
  async resetSkills(userId, playerId, rank, opts = {}) {
    if (!userId || !playerId || rank === undefined) {
      throw new Error('userId, playerId, and rank are required');
    }
    
    const params = new URLSearchParams({
      user_id: userId,
      player_id: playerId,
      rank: rank
    });
    
    const endpoint = `skills/reset?${params.toString()}`;
    
    // DELETE request
    const response = await this.fetchWithCache(endpoint, {
      method: 'DELETE',
      cache: false,
      ...opts
    });
    
    // Clear player detail cache after reset
    this.clearCacheEntry(`players/${playerId}?rank=${rank}`);
    
    return response;
  }


  // ---------- Filters ----------
  async getPositions(opts = {}) {
    return this.fetchWithCache('/filters/positions', { cache: opts.cache ?? true, cacheTTL: opts.cacheTTL });
  }

  async getTeams(opts = {}) {
    return this.fetchWithCache('/filters/teams', { cache: opts.cache ?? true, cacheTTL: opts.cacheTTL });
  }

  async getLeagues(opts = {}) {
    return this.fetchWithCache('/filters/leagues', { cache: opts.cache ?? true, cacheTTL: opts.cacheTTL });
  }

  async getNations(opts = {}) {
    return this.fetchWithCache('/filters/nations', { cache: opts.cache ?? true, cacheTTL: opts.cacheTTL });
  }

  async getEvents(opts = {}) {
    return this.fetchWithCache('/filters/events', { cache: opts.cache ?? true, cacheTTL: opts.cacheTTL });
  }

  // Convenience aliases (for backwards compatibility)
  async getTeamsWithFlags(opts = {}) {
    return this.getTeams(opts);
  }
  async getLeaguesWithFlags(opts = {}) {
    return this.getLeagues(opts);
  }

  // ---------- Stats ----------
  async getStatsSummary(opts = {}) {
    return this.fetchWithCache('/stats/summary', { cache: opts.cache ?? true, cacheTTL: opts.cacheTTL });
  }

  // ---------- Training Boosts ----------
  async getTrainingBoosts(position, level, opts = {}) {
      if (!position || level === undefined) {
          throw new Error('position and level are required');
      }
      const endpoint = `/training/boosts?position=${encodeURIComponent(position)}&level=${encodeURIComponent(level)}`;
      return this.fetchWithCache(endpoint, { cache: opts.cache ?? true, cacheTTL: opts.cacheTTL ?? 60000 });
  }


  
  // ---------- Health ----------
  async checkHealth() {
    // Build base (without /api)
    const rootBase = this.baseURL.replace(/\/api$/, '').replace(/\/api\/$/, '');
    const url = `${rootBase}/health`;
    try {
      const resp = await fetch(url, { headers: this.defaultHeaders });
      if (!resp.ok) {
        throw new Error(`Health check failed: ${resp.status} ${resp.statusText}`);
      }
      return resp.json();
    } catch (err) {
      this._log('[API] Health check error:', err);
      throw err;
    }
  }
}

// Export an instance for app-wide usage
const apiClient = new ZenithAPIClient(API_BASE_URL, { debug: false });

// If you use modules, export default
// export default apiClient;
