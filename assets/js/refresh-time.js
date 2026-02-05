/**
 * ============================================================================
 * REFRESH TIME DISPLAY MODULE - FULLY OPTIMIZED & CORRECTED
 * ============================================================================
 * Handles player refresh time calculations with automatic timezone detection
 * and real-time countdown updates
 */

// ============================================================================
// 1. TIMEZONE AUTO-DETECTION
// ============================================================================
async function getUserTimezone() {
  try {
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log('[REFRESH] Browser timezone:', browserTz);
    return browserTz;
  } catch (error) {
    console.error('[REFRESH] Error detecting timezone:', error);
    return 'UTC'; // Fallback
  }
}

// ============================================================================
// 2. PARSE REFRESH TIME FROM STRING
// ============================================================================
function parseRefreshTime(timeStr) {
  if (!timeStr) return null;

  try {
    // Parse 12-hour format: "1:24:25 PM" or "01:30:45 AM"
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)/i);
    
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      const seconds = parseInt(timeMatch[3]);
      const meridiem = timeMatch[4].toUpperCase();

      // Convert to 24-hour format
      if (meridiem === 'PM' && hours !== 12) {
        hours += 12;
      } else if (meridiem === 'AM' && hours === 12) {
        hours = 0;
      }

      // Create UTC date object
      const now = new Date();
      const dt = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        hours,
        minutes,
        seconds
      ));

      console.log('[REFRESH] Parsed time:', timeStr, '->', dt.toISOString());
      return dt;
    }

    // Try 24-hour format: "HH:MM:SS"
    const time24Match = timeStr.match(/(\d{1,2}):(\d{2}):(\d{2})/);
    if (time24Match) {
      const hours = parseInt(time24Match[1]);
      const minutes = parseInt(time24Match[2]);
      const seconds = parseInt(time24Match[3]);

      const now = new Date();
      const dt = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        hours,
        minutes,
        seconds
      ));

      console.log('[REFRESH] Parsed 24h time:', timeStr, '->', dt.toISOString());
      return dt;
    }

    console.error('[REFRESH] Could not parse time format:', timeStr);
    return null;
  } catch (error) {
    console.error('[REFRESH] Error parsing time:', error);
    return null;
  }
}

// ============================================================================
// 3. GET ALL REFRESH TIMES (for given base time)
// ============================================================================
function getAllRefreshTimes(baseTime) {
  const now = new Date();
  const refreshTimes = [];

  // Create base datetime from base time
  const baseHours = baseTime.getUTCHours();
  const baseMinutes = baseTime.getUTCMinutes();
  const baseSeconds = baseTime.getUTCSeconds();

  // Generate refresh times for yesterday, today, tomorrow
  for (let dayOffset = -1; dayOffset <= 1; dayOffset++) {
    const baseDate = new Date(now);
    baseDate.setDate(baseDate.getDate() + dayOffset);
    baseDate.setUTCHours(baseHours, baseMinutes, baseSeconds, 0);

    // Generate times (every 2 hours for 12 hours from base)
    for (let i = -6; i <= 6; i++) {
      const refreshTime = new Date(baseDate);
      refreshTime.setHours(refreshTime.getHours() + i * 2);
      refreshTimes.push(refreshTime);
    }
  }

  // Remove duplicates and sort
  const uniqueTimes = [...new Set(refreshTimes.map(t => t.getTime()))];
  return uniqueTimes.map(t => new Date(t)).sort((a, b) => a - b);
}

// ============================================================================
// 4. GET NEXT REFRESH TIME
// ============================================================================
// ============================================================================
// 4. GET NEXT REFRESH TIME
// ============================================================================
function getNextRefresh(baseTime) {
  const now = new Date();
  const allRefreshes = getAllRefreshTimes(baseTime);

  // Filter to get only future refresh times
  let futureRefreshes = allRefreshes.filter(r => r > now);

  // If no future times, generate more for tomorrow
  if (futureRefreshes.length === 0) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 2);
    tomorrow.setUTCHours(baseTime.getUTCHours(), baseTime.getUTCMinutes(), baseTime.getUTCSeconds(), 0);

    for (let i = 0; i < 12; i++) {
      const refreshTime = new Date(tomorrow);
      refreshTime.setHours(refreshTime.getHours() + i * 2);
      futureRefreshes.push(refreshTime);
    }

    // Sort again after adding new times
    futureRefreshes.sort((a, b) => a - b);
  }

  return futureRefreshes[0] || null;
}

// ============================================================================
// 4B. GET UPCOMING REFRESHES (after the next one)
// ============================================================================
function getUpcomingRefreshes(baseTime, count = 2) {
  const now = new Date();
  const allRefreshes = getAllRefreshTimes(baseTime);

  // Filter to get only future refresh times
  let futureRefreshes = allRefreshes.filter(r => r > now);

  // If not enough future times, generate more
  if (futureRefreshes.length < count + 1) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 2);
    tomorrow.setUTCHours(baseTime.getUTCHours(), baseTime.getUTCMinutes(), baseTime.getUTCSeconds(), 0);

    for (let i = 0; i < 12; i++) {
      const refreshTime = new Date(tomorrow);
      refreshTime.setHours(refreshTime.getHours() + i * 2);
      futureRefreshes.push(refreshTime);
    }

    // Sort again after adding new times
    futureRefreshes.sort((a, b) => a - b);
  }

  // Return the next 'count' refreshes (skip the first one, which is the "next" refresh)
  return futureRefreshes.slice(1, count + 1);
}


// ============================================================================
// 5. FORMAT TIME UNTIL REFRESH
// ============================================================================
function formatTimeUntil(targetTime) {
  const now = new Date();
  const delta = targetTime - now;

  if (delta <= 0) {
    return 'Refreshing...';
  }

  const hours = Math.floor(delta / (1000 * 60 * 60));
  const minutes = Math.floor((delta / (1000 * 60)) % 60);

  if (hours > 0) {
    return `in ${hours}h ${minutes}m`;
  } else {
    return `in ${minutes}m`;
  }
}

// ============================================================================
// 6. FETCH REFRESH DATA FROM SUPABASE
// ============================================================================
async function fetchPlayerRefreshData(playerId) {
  console.log('[REFRESH-DEBUG] fetchPlayerRefreshData called with playerId =', playerId);

  try {
    if (!window.supabaseClient) {
      console.error('[REFRESH-DEBUG] window.supabaseClient is NOT defined');
      return null;
    }

    console.log('[REFRESH-DEBUG] Querying table: player_refresh_data');

    const { data, error } = await window.supabaseClient
      .from('player_refresh_data')        // ✅ FIXED
      .select('player_id, refresh_time, name, ovr')  // ✅ FIXED
      .eq('player_id', playerId)          // ✅ FIXED
      .maybeSingle();

    console.log('[REFRESH-DEBUG] Supabase response -> data:', data, 'error:', error);

    if (error) {
      console.error('[REFRESH-DEBUG] Supabase error:', error);
      return null;
    }

    if (!data) {
      console.warn('[REFRESH-DEBUG] No row found for player_id =', playerId);
      return null;
    }

    if (!data.refresh_time) {  // ✅ FIXED
      console.warn('[REFRESH-DEBUG] Row found but refresh_time is NULL/empty for player_id =', playerId, 'row =', data);
      return null;
    }

    return data;
  } catch (err) {
    console.error('[REFRESH-DEBUG] Exception in fetchPlayerRefreshData:', err);
    return null;
  }
}



// ============================================================================
// 7. BUILD REFRESH TIME CONTAINER (MAIN FUNCTION)
// ============================================================================
async function buildRefreshTimeContainer(player) {
  try {
    // Fetch refresh data from Supabase
    const refreshData = await fetchPlayerRefreshData(player.player_id);  // ✅ CORRECT

    console.log('[REFRESH] Raw refresh data:', refreshData);
    console.log('[REFRESH] Raw refreshtime value:', refreshData?.refreshtime);

    // Validate data
    if (!refreshData) {
      console.warn('[REFRESH-DEBUG] buildRefreshTimeContainer: refreshData is null for player', player.player_id);
      return '';
    }


    if (!refreshData.refresh_time) {
      console.warn('[REFRESH-DEBUG] buildRefreshTimeContainer: refreshtime is missing for player', player.playerid, 'data =', refreshData);
      return `<div class="player-refresh-container" style="background: var(--color-graphite-800); border: 1px solid rgba(255,255,255,0.08); border-radius: var(--radius-lg); padding: 20px; margin-top: 20px; text-align: center;">
        <div style="font-size: 14px; color: var(--color-text-muted); font-weight: 600;">No refreshtime value for this player</div>
      </div>`;
    }



    // Parse refresh time
    const baseTime = parseRefreshTime(refreshData.refresh_time);
    if (!baseTime) {
      return `<div class="player-refresh-container" style="background: var(--color-graphite-800); border: 1px solid rgba(255,255,255,0.08); border-radius: var(--radius-lg); padding: 20px; margin-top: 20px; text-align: center;">
        <div style="font-size: 14px; color: var(--color-text-muted); font-weight: 600;">Invalid refresh time format</div>
      </div>`;
    }

    // Get user timezone
    const userTz = await getUserTimezone();

    // Get next refresh time (SINGLE DECLARATION - NO REDECLARATION)
    const nextRefreshTime = getNextRefresh(baseTime);
    if (!nextRefreshTime) {
      return `<div class="player-refresh-container" style="background: var(--color-graphite-800); border: 1px solid rgba(255,255,255,0.08); border-radius: var(--radius-lg); padding: 20px; margin-top: 20px; text-align: center;">
        <div style="font-size: 14px; color: var(--color-text-muted); font-weight: 600;">Unable to calculate next refresh</div>
      </div>`;
    }

    // Format time
    let timeStr = 'N/A';
    let countdown = 'Calculating...';

    try {
      timeStr = nextRefreshTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: userTz
      });

      countdown = formatTimeUntil(nextRefreshTime);
      console.log('[REFRESH] Next refresh:', nextRefreshTime.toISOString());
      console.log('[REFRESH] User timezone:', userTz);
      console.log('[REFRESH] Formatted time:', timeStr);
    } catch (error) {
      console.error('[REFRESH] Error formatting time:', error);
      timeStr = 'Error';
      countdown = 'N/A';
    }

    // Get timezone abbreviation
    const tzAbbr = userTz.split('/').pop().replace(/_/g, ' ');
    const containerId = `refresh-container-${player.player_id}`;  // ✅ CORRECT

    // Get next 2 upcoming refreshes
    const upcomingRefreshes = getUpcomingRefreshes(baseTime, 2);

    // Format upcoming refreshes HTML
    let upcomingHtml = '';
    if (upcomingRefreshes.length > 0) {
      upcomingHtml = upcomingRefreshes.map(refresh => {
        const upcomingTimeStr = refresh.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
          timeZone: userTz
        });
        return `<div style="font-size: 13px; color: var(--color-text-muted); padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">• ${upcomingTimeStr}</div>`;
      }).join('');
    }


    // Start countdown timer
    setTimeout(() => startRefreshCountdown(containerId, nextRefreshTime), 100);

    // Return HTML
    return `<div id="${containerId}" class="player-refresh-container" style="background: var(--color-graphite-800); border: 1px solid rgba(255,255,255,0.08); border-radius: var(--radius-lg); padding: 20px; margin-top: 20px;">
      <!-- Title -->
      <div style="font-size: 16px; font-weight: 800; color: var(--color-text-primary); margin: 0 0 18px 0; text-transform: uppercase; font-family: var(--font-family-base); letter-spacing: 0.5px; display: flex; align-items: center; gap: 10px;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        Market Refresh
      </div>

      <!-- Next Refresh Time -->
      <div style="background: rgba(0, 194, 168, 0.08); border: 1px solid rgba(0, 194, 168, 0.25); border-radius: 10px; padding: 16px; margin-bottom: 12px;">
        <div style="font-size: 13px; font-weight: 700; color: var(--color-text-muted); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.3px;">Next Refresh</div>
        
        <!-- Time and Countdown on same line -->
        <div class="player-refresh-time-row" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
          <div class="player-refresh-time" style="font-size: 20px; font-weight: 900; color: var(--color-teal-500); font-family: var(--font-family-base);">${timeStr}</div>
          <div class="player-refresh-countdown" style="font-size: 14px; font-weight: 700; color: var(--color-teal-500); background: rgba(0,194,168,0.15); padding: 6px 12px; border-radius: 6px;">
            <span id="refresh-countdown-${player.player_id}">${countdown}</span>
          </div>
        </div>
        
        <div style="font-size: 12px; color: var(--color-text-muted); font-weight: 600;">${tzAbbr}</div>
      </div>

      <!-- Upcoming Refreshes -->
      ${upcomingRefreshes.length > 0 ? `
        <div style="margin-top: 12px;">
          <div style="font-size: 12px; font-weight: 700; color: var(--color-text-muted); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.3px;">Upcoming Refreshes</div>
          <div style="background: rgba(255,255,255,0.03); border-radius: 8px; padding: 8px 12px;">
            ${upcomingHtml}
          </div>
        </div>
      ` : ''}
    </div>`;
  } catch (error) {
    console.error('[REFRESH] Error building refresh container:', error);
    return `<div class="player-refresh-container" style="background: var(--color-graphite-800); border: 1px solid rgba(255,255,255,0.08); border-radius: var(--radius-lg); padding: 20px; margin-top: 20px; text-align: center;">
      <div style="font-size: 14px; color: var(--color-text-muted); font-weight: 600;">Error loading refresh time</div>
    </div>`;
  }
}

// ============================================================================
// 8. COUNTDOWN TIMER UPDATER
// ============================================================================
function startRefreshCountdown(containerId, targetTime) {
  const countdownId = containerId.replace('refresh-container-', 'refresh-countdown-');
  const countdownEl = document.getElementById(countdownId);

  if (!countdownEl) return;

  // Update countdown text
  const updateCountdown = () => {
    const countdown = formatTimeUntil(targetTime);
    countdownEl.textContent = countdown;

    // Stop timer if time has passed
    if (countdown === 'Refreshing...') {
      clearInterval(interval);
    }
  };

  // Update immediately
  updateCountdown();

  // Update every second
  const interval = setInterval(updateCountdown, 1000);

  // Store interval for cleanup
  if (!window.refreshTimerIntervals) {
    window.refreshTimerIntervals = {};
  }
  window.refreshTimerIntervals[containerId] = interval;
}

// ============================================================================
// 9. CLEANUP FUNCTION
// ============================================================================
function cleanupRefreshTimers() {
  if (window.refreshTimerIntervals) {
    Object.values(window.refreshTimerIntervals).forEach(interval => {
      clearInterval(interval);
    });
    window.refreshTimerIntervals = {};
  }
}

// ============================================================================
// 10. EXPORT TO WINDOW
// ============================================================================
window.buildRefreshTimeContainer = buildRefreshTimeContainer;
window.cleanupRefreshTimers = cleanupRefreshTimers;

console.log('[REFRESH] Module loaded successfully');
