// FC Market Pro - Main Application
// Handles app initialization, routing, and event listeners

// ========== VIEW PLAYER DETAIL ==========
// ========== VIEW PLAYER DETAIL (FULL DETAILS) ==========
// ==================== USER SESSION ====================
// Simple user ID system (use real auth in production)
function getUserId() {
  let userId = localStorage.getItem('zenith_user_id');
  if (!userId) {
    // Generate numeric user ID from timestamp
    userId = Date.now().toString();
    localStorage.setItem('zenith_user_id', userId);
    console.log('[USER] Generated new user ID:', userId);
  }
  return parseInt(userId);  // Return as integer
}

const CURRENT_USER_ID = getUserId();
console.log('[USER] User ID:', CURRENT_USER_ID);


async function viewPlayerDetail(playerId, fallbackPlayer = null) {
    try {
        // Switch view first
        switchView('player-detail');

        const container = document.getElementById('player-detail-view');
        if (container) {
            container.innerHTML = `
                <div style="
                    min-height: 60vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #98A0A6;
                    font-family: var(--font-family-base);
                ">
                    Loading player details...
                </div>
            `;
        }

        // Use existing data only for basic info while loading
        const allAvailable = [
            ...(state.allPlayers || []),
            ...(state.filteredPlayers || []),
            ...(state.searchResults || [])
        ];
        let lightweight = allAvailable.find(p => String(p.player_id) === String(playerId));
        if (!lightweight && fallbackPlayer) {
            console.warn('[DETAIL] Using fallback player from dashboard');
            lightweight = fallbackPlayer;
        }

        // Make sure apiClient exists
        if (!window.apiClient) {
            throw new Error('API client not available');
        }

        console.log('[DETAIL] Fetching full details for player', playerId);

        // 🔥 CALL BACKEND DETAIL ENDPOINT
        const resp = await window.apiClient.getPlayerDetails(playerId, lightweight?.rank ?? 0);
        const fullPlayer = resp.player;

        // ✅ Merge skills data from response root level
        const mergedPlayer = {
          ...lightweight,
          ...fullPlayer,
          skills: resp.skills,  // ← Add this
          available_skill_points: resp.available_skill_points  // ← Add this
        };

        // Save to state for debugging / re-render
        state.selectedPlayer = mergedPlayer;

        // Finally render using your big renderPlayerDetail()
        renderPlayerDetail(mergedPlayer);

    } catch (error) {
        console.error('[DETAIL] Error loading player details', error);
        const container = document.getElementById('player-detail-view');
        if (container) {
            container.innerHTML = `
                <div style="
                    min-height: 60vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column;
                    gap: 8px;
                    color: #FF6B6B;
                    font-family: var(--font-family-base);
                ">
                    <div style="font-weight: 700; font-size: 16px;">Failed to load player details</div>
                    <div style="font-size: 13px; opacity: 0.8;">${error.message}</div>
                </div>
            `;
        }
    }
}


// ========== ANIMATED RANK ICON SYSTEM ==========
const RANK_CONFIG = {
    frameCount: 36,     // ✅ 36 frames total
    fps: 36,            // 36 FPS
    frameWidth: 32,     // ✅ 192px ÷ 6 = 32px per frame
    frameHeight: 32,    // ✅ 192px ÷ 6 = 32px per frame
    columns: 6,         // ✅ 6 columns per row
    rows: 6,            // ✅ 6 rows total
    ranks: {
        1: 'assets/images/ranks/green_rank.png',
        2: 'assets/images/ranks/blue_rank.png',
        3: 'assets/images/ranks/purple_rank.png',
        4: 'assets/images/ranks/gold_rank.png',
        5: 'assets/images/ranks/red_rank.png'
    },
    skillPoints: {
        0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5
    },
    rankNames: {
        0: 'Base', 1: 'Green', 2: 'Blue', 3: 'Purple', 4: 'Gold', 5: 'Red'
    },
    rankColors: {
        0: '#98A0A6', 1: '#3BD671', 2: '#6366F1', 3: '#8B5CF6', 4: '#FFB86B', 5: '#FF6B6B'
    }
};

// Helper to convert hex color to rgba
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}` : '255,255,255';
}

// Store active animations for cleanup
const activeRankAnimations = new Map();

function createAnimatedRankIcon(rank, size = 48) {
    if (!rank || rank < 1 || rank > 5) return '';

    const spriteUrl = RANK_CONFIG.ranks[rank];
    if (!spriteUrl) return '';

    const uniqueId = `rank-icon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return `
        <div class="animated-rank-icon"
             id="${uniqueId}"
             data-rank="${rank}"
             style="
                width: ${size}px;
                height: ${size}px;
                background-image: url('${spriteUrl}');
                background-size: auto ${size}px;
                background-position: 0 0;
                background-repeat: no-repeat;
                display: inline-block;
             ">
        </div>
    `;
}

function startRankAnimation(element) {
    if (!element) return;

    const rank = element.dataset.rank;
    if (!rank) return;

    // ✅ ROBUST: Get ACTUAL rendered size multiple ways
    const computedStyle = window.getComputedStyle(element);
    const actualWidth = parseFloat(computedStyle.width);
    const actualHeight = parseFloat(computedStyle.height);
    
    // Use actual rendered size, fallback to dataset, then default
    const iconSize = Math.round(actualWidth || parseInt(element.dataset.iconSize) || 70);
    
    console.log(`[RANK ANIMATION] Element size: ${actualWidth}px, Using: ${iconSize}px`); // Debug log
    
    const scaleFactor = iconSize / RANK_CONFIG.frameWidth;
    
    const scaledFrameWidth = RANK_CONFIG.frameWidth * scaleFactor;
    const scaledFrameHeight = RANK_CONFIG.frameHeight * scaleFactor;
    
    // ✅ Update background-size to match actual icon size
    const spriteSheetSize = Math.round(192 * scaleFactor);
    element.style.backgroundSize = `${spriteSheetSize}px ${spriteSheetSize}px`;
    
    console.log(`[RANK ANIMATION] Background size set to: ${spriteSheetSize}px`); // Debug log
    
    let currentFrame = 0;
    const columns = RANK_CONFIG.columns; // 6
    const interval = 1000 / RANK_CONFIG.fps; // ~27.78ms

    // Clear any existing animation
    if (activeRankAnimations.has(element.id)) {
        clearInterval(activeRankAnimations.get(element.id));
    }

    const animationId = setInterval(() => {
        currentFrame = (currentFrame + 1) % RANK_CONFIG.frameCount; // 0-35
        
        // Calculate 6x6 grid position
        const col = currentFrame % columns;  // 0-5
        const row = Math.floor(currentFrame / columns); // 0-5
        
        // Calculate exact position with scaling
        const xOffset = -(col * scaledFrameWidth);
        const yOffset = -(row * scaledFrameHeight);
        
        element.style.backgroundPosition = `${xOffset}px ${yOffset}px`;
    }, interval);

    activeRankAnimations.set(element.id, animationId);
}





function stopRankAnimation(elementId) {
    if (activeRankAnimations.has(elementId)) {
        clearInterval(activeRankAnimations.get(elementId));
        activeRankAnimations.delete(elementId);
    }
}

function initAllRankAnimations() {
    document.querySelectorAll('.animated-rank-icon').forEach(el => {
        startRankAnimation(el);
    });
    
    // Also initialize rank selector animations specifically
    document.querySelectorAll('.rank-selector-icon').forEach(el => {
        startRankAnimation(el);
    });
}


function cleanupRankAnimations() {
    activeRankAnimations.forEach((intervalId, elementId) => {
        clearInterval(intervalId);
    });
    activeRankAnimations.clear();
}
// ========== GLOBAL STAT TAB FUNCTIONS ==========
window.switchStatTab = function(statId) {
    // Update tabs
    const tabs = document.querySelectorAll('.stat-tab');
    tabs.forEach(tab => {
        const isActive = tab.dataset.statId === statId;
        tab.classList.toggle('active', isActive);
        tab.style.background = isActive ? 'var(--color-teal-500, #00C2A8)' : 'transparent';
        tab.style.borderColor = isActive ? 'var(--color-teal-500, #00C2A8)' : 'rgba(255,255,255,0.1)';
        tab.style.color = isActive ? 'var(--color-graphite-900, #0E1114)' : 'var(--color-text-muted, #98A0A6)';
    });

    // Update content panels
    const panels = document.querySelectorAll('.stat-content-panel');
    panels.forEach(panel => {
        const isActive = panel.dataset.statContent === statId;
        panel.classList.toggle('active', isActive);
        panel.style.display = isActive ? 'block' : 'none';
    });
};

window.togglePlayerWatchlist = function(uniqueId) {
    if (typeof toggleWatchlist === 'function') {
        toggleWatchlist(uniqueId);
        if (state && state.selectedPlayer) {
            renderPlayerDetail(state.selectedPlayer);
        }
    }
};


function renderPlayerDetail(player) {
    const container = document.getElementById('player-detail-view');
    if (!container) {
        console.error('[DETAIL] player-detail-view container not found in HTML');
        return;
    }

    // Cleanup old animations
    cleanupRankAnimations();

    const uniqueId = `${player.player_id}_${player.rank || 0}_${player.is_untradable ? 1 : 0}`;
    const isWatchlisted = state.watchlist && state.watchlist.includes(uniqueId);

    const nationField = player.nation_region || player.nation || '';
    const flagUrl = typeof getCountryFlagUrl === 'function' ? getCountryFlagUrl(nationField) : '';

    const rankIconHtml = '';  // Disable blinking rank icon


    // Check if player is a goalkeeper
    const isGoalkeeper = player.position === 'GK';

    // ---- helpers ----
    const getBaseColor = (value) => {
        // base color (used for substats)
        if (value >= 90) return '#3BD671';      // green
        if (value >= 80) return '#00C2A8';      // teal
        if (value >= 70) return '#FFB86B';      // orange
        return '#98A0A6';                       // gray
    };

    const getStat = (obj, ...names) => {
        for (const n of names) {
            if (obj[n] !== undefined && obj[n] !== null) return obj[n];
        }
        return 0;
    };

    // Helper to get stat with training boost applied
    const getStatWithBoost = (player, boosts, ...names) => {
        // Get base stat value
        let baseStat = getStat(player, ...names);
        
        // If no boosts, return base
        if (!boosts) return baseStat;
        
        // Try to find matching boost for this stat
        for (const name of names) {
            const normalizedName = name.toLowerCase().replace(/_/g, '');
            
            // Check if boost exists for this stat
            for (const boostKey in boosts) {
                const normalizedBoostKey = boostKey.toLowerCase().replace(/_/g, '');
                
                if (normalizedBoostKey === normalizedName) {
                    const boost = parseInt(boosts[boostKey]) || 0;
                    console.log(`[TRAINING] Applying boost to ${name}: ${baseStat} + ${boost} = ${baseStat + boost}`);
                    return baseStat + boost;
                }
            }
        }
        
        return baseStat;
    };

    // ========== WEIGHTED MAIN CATEGORY CALCULATIONS ==========
    const roundHalfUp = (val) => Math.floor(val + 0.5);

    const calculatePaceWithBoosts = (player, boosts) => {
        const acceleration = getStatWithBoost(player, boosts, 'acceleration');
        const sprint_speed = getStatWithBoost(player, boosts, 'sprint_speed');
        const val = (
            0.49299585008602 * acceleration +
            0.50528383239125 * sprint_speed +
            -0.13701200270336
        );
        return roundHalfUp(val);
    };

    const calculateShootingWithBoosts = (player, boosts) => {
        const finishing = getStatWithBoost(player, boosts, 'finishing');
        const long_shot = getStatWithBoost(player, boosts, 'long_shot', 'longshots');
        const shot_power = getStatWithBoost(player, boosts, 'shot_power');
        const positioning = getStatWithBoost(player, boosts, 'positioning');
        const volley = getStatWithBoost(player, boosts, 'volley', 'volleys');
        const penalties = getStatWithBoost(player, boosts, 'penalties');
        const val = (
            0.35066661652365 * finishing +
            0.20012280256486 * long_shot +
            0.19946956407192 * shot_power +
            0.15019769557113 * positioning +
            0.04977322484935 * volley +
            0.04962618730771 * penalties +
            -0.46621901229077
        );
        return roundHalfUp(val);
    };

    const calculatePassingWithBoosts = (player, boosts) => {
        const short_passing = getStatWithBoost(player, boosts, 'short_passing');
        const long_passing = getStatWithBoost(player, boosts, 'long_passing');
        const vision = getStatWithBoost(player, boosts, 'vision');
        const crossing = getStatWithBoost(player, boosts, 'crossing');
        const curve = getStatWithBoost(player, boosts, 'curve');
        const free_kick = getStatWithBoost(player, boosts, 'free_kick', 'fk_accuracy');
        const val = (
            0.30073301682698 * short_passing +
            0.19979430277541 * long_passing +
            0.24897437527999 * vision +
            0.15031023108744 * crossing +
            0.05004649307871 * curve +
            0.05012756181062 * free_kick +
            -0.48084074176376
        );
        return roundHalfUp(val);
    };

    const calculateDribblingWithBoosts = (player, boosts) => {
        const dribbling = getStatWithBoost(player, boosts, 'dribbling');
        const balance = getStatWithBoost(player, boosts, 'balance');
        const agility = getStatWithBoost(player, boosts, 'agility');
        const reactions = getStatWithBoost(player, boosts, 'reactions');
        const ball_control = getStatWithBoost(player, boosts, 'ball_control');
        const val = (
            0.25044329239850 * dribbling +
            0.10001066600723 * balance +
            0.25025392646353 * agility +
            0.15074674532686 * reactions +
            0.24872793523704 * ball_control +
            -0.48832284057254
        );
        return roundHalfUp(val);
    };

    const calculateDefendingWithBoosts = (player, boosts) => {
        const marking = getStatWithBoost(player, boosts, 'marking');
        const standing_tackle = getStatWithBoost(player, boosts, 'standing_tackle');
        const sliding_tackle = getStatWithBoost(player, boosts, 'sliding_tackle');
        const awareness = getStatWithBoost(player, boosts, 'awareness', 'interceptions');
        const heading = getStatWithBoost(player, boosts, 'heading');
        const val = (
            0.25029448767320 * marking +
            0.20107682619015 * standing_tackle +
            0.19924427638513 * sliding_tackle +
            0.19952899013166 * awareness +
            0.15010172584902 * heading +
            -0.49709228500345
        );
        return roundHalfUp(val);
    };

    const calculatePhysicalWithBoosts = (player, boosts) => {
        const strength = getStatWithBoost(player, boosts, 'strength');
        const aggression = getStatWithBoost(player, boosts, 'aggression');
        const jumping = getStatWithBoost(player, boosts, 'jumping');
        const stamina = getStatWithBoost(player, boosts, 'stamina_stat', 'stamina');
        const val = (
            0.44955969076149 * strength +
            0.29976663944687 * aggression +
            0.25058507302003 * jumping +
            0.00061181921524 * stamina +
            -0.50936016832054
        );
        return roundHalfUp(val);
    };

    const calculateGKPhysicalWithBoosts = (player, boosts) => {
        const reactions = getStatWithBoost(player, boosts, 'reactions');
        const agility = getStatWithBoost(player, boosts, 'agility');
        const sprint_speed = getStatWithBoost(player, boosts, 'sprint_speed');
        const strength = getStatWithBoost(player, boosts, 'strength');
        const val = (
            0.64960512284621 * reactions +
            0.15093757174982 * agility +
            0.09981357061375 * sprint_speed +
            0.09995255942967 * strength +
            -0.48764601442207
        );
        return roundHalfUp(val);
    };



    // ---- build stat categories based on position ----
    let statCategories;
    if (isGoalkeeper) {
        // GK-specific stat categories
        statCategories = [
            {
                name: 'Diving',
                key: 'diving',
                mainValue: getStatWithBoost(player, player.training_boosts, 'diving'),  // Direct stat
                substats: [
                    { label: 'GK Diving', value: getStatWithBoost(player, player.training_boosts, 'gk_diving', 'diving') }
                ]
            },
            {
                name: 'Positioning',
                key: 'gk_positioning',
                mainValue: getStatWithBoost(player, player.training_boosts, 'gk_positioning', 'positioning'),  // Direct stat
                substats: [
                    { label: 'GK Positioning', value: getStatWithBoost(player, player.training_boosts, 'gk_positioning', 'positioning') }
                ]
            },
            {
                name: 'Handling',
                key: 'handling',
                mainValue: getStatWithBoost(player, player.training_boosts, 'handling'),  // Direct stat
                substats: [
                    { label: 'GK Handling', value: getStatWithBoost(player, player.training_boosts, 'gk_handling', 'handling') }
                ]
            },
            {
                name: 'Reflexes',
                key: 'reflexes',
                mainValue: getStatWithBoost(player, player.training_boosts, 'reflexes'),  // Direct stat
                substats: [
                    { label: 'GK Reflexes', value: getStatWithBoost(player, player.training_boosts, 'gk_reflexes', 'reflexes') },
                    { label: 'Jumping', value: getStatWithBoost(player, player.training_boosts, 'jumping') }
                ]
            },
            {
                name: 'Kicking',
                key: 'kicking',
                mainValue: getStatWithBoost(player, player.training_boosts, 'kicking'),  // Direct stat
                substats: [
                    { label: 'GK Kicking', value: getStatWithBoost(player, player.training_boosts, 'gk_kicking', 'kicking') },
                    { label: 'Long Passing', value: getStatWithBoost(player, player.training_boosts, 'long_passing') }
                ]
            },
            {
                name: 'Physical',
                key: 'physical',
                mainValue: calculateGKPhysicalWithBoosts(player, player.training_boosts),  // ✅ Weighted formula
                substats: [
                    { label: 'Reactions', value: getStatWithBoost(player, player.training_boosts, 'reactions') },
                    { label: 'Agility', value: getStatWithBoost(player, player.training_boosts, 'agility') },
                    { label: 'Sprint Speed', value: getStatWithBoost(player, player.training_boosts, 'sprint_speed') },
                    { label: 'Strength', value: getStatWithBoost(player, player.training_boosts, 'strength') }
                ]
            }
        ];
    
   } else {
        // Outfield player stat categories - WEIGHTED CALCULATIONS
        statCategories = [
            {
                name: 'Pace',
                key: 'pace',
                mainValue: calculatePaceWithBoosts(player, player.training_boosts),  // ✅ CORRECT
                substats: [
                    { label: 'Acceleration', value: getStatWithBoost(player, player.training_boosts, 'acceleration') },
                    { label: 'Sprint Speed', value: getStatWithBoost(player, player.training_boosts, 'sprint_speed') }
                ]
            },
            {
                name: 'Shooting',
                key: 'shooting',
                mainValue: calculateShootingWithBoosts(player, player.training_boosts),  // ✅ CORRECT
                substats: [
                    { label: 'Finishing', value: getStatWithBoost(player, player.training_boosts, 'finishing') },
                    { label: 'Long Shot', value: getStatWithBoost(player, player.training_boosts, 'long_shot', 'long_shots') },
                    { label: 'Shot Power', value: getStatWithBoost(player, player.training_boosts, 'shot_power') },
                    { label: 'Positioning', value: getStatWithBoost(player, player.training_boosts, 'positioning') },
                    { label: 'Volley', value: getStatWithBoost(player, player.training_boosts, 'volley', 'volleys') },
                    { label: 'Penalties', value: getStatWithBoost(player, player.training_boosts, 'penalties') }
                ]
            },
            {
                name: 'Passing',
                key: 'passing',
                mainValue: calculatePassingWithBoosts(player, player.training_boosts),  // ✅ CORRECT
                substats: [
                    { label: 'Short Passing', value: getStatWithBoost(player, player.training_boosts, 'short_passing') },
                    { label: 'Long Passing', value: getStatWithBoost(player, player.training_boosts, 'long_passing') },
                    { label: 'Vision', value: getStatWithBoost(player, player.training_boosts, 'vision') },
                    { label: 'Crossing', value: getStatWithBoost(player, player.training_boosts, 'crossing') },
                    { label: 'Curve', value: getStatWithBoost(player, player.training_boosts, 'curve') },
                    { label: 'Free Kick', value: getStatWithBoost(player, player.training_boosts, 'free_kick', 'fk_accuracy') }
                ]
            },
            {
                name: 'Dribbling',
                key: 'dribbling',
                mainValue: calculateDribblingWithBoosts(player, player.training_boosts),  // ✅ CORRECT
                substats: [
                    { label: 'Dribbling', value: getStatWithBoost(player, player.training_boosts, 'dribbling') },
                    { label: 'Balance', value: getStatWithBoost(player, player.training_boosts, 'balance') },
                    { label: 'Agility', value: getStatWithBoost(player, player.training_boosts, 'agility') },
                    { label: 'Reactions', value: getStatWithBoost(player, player.training_boosts, 'reactions') },
                    { label: 'Ball Control', value: getStatWithBoost(player, player.training_boosts, 'ball_control') }
                ]
            },
            {
                name: 'Defending',
                key: 'defending',
                mainValue: calculateDefendingWithBoosts(player, player.training_boosts),  // ✅ CORRECT
                substats: [
                    { label: 'Marking', value: getStatWithBoost(player, player.training_boosts, 'marking') },
                    { label: 'Standing Tackle', value: getStatWithBoost(player, player.training_boosts, 'standing_tackle') },
                    { label: 'Sliding Tackle', value: getStatWithBoost(player, player.training_boosts, 'sliding_tackle') },
                    { label: 'Awareness', value: getStatWithBoost(player, player.training_boosts, 'awareness', 'interceptions') },
                    { label: 'Heading', value: getStatWithBoost(player, player.training_boosts, 'heading') }
                ]
            },
            {
                name: 'Physical',
                key: 'physical',
                mainValue: calculatePhysicalWithBoosts(player, player.training_boosts),  // ✅ CORRECT
                substats: [
                    { label: 'Strength', value: getStatWithBoost(player, player.training_boosts, 'strength') },
                    { label: 'Aggression', value: getStatWithBoost(player, player.training_boosts, 'aggression') },
                    { label: 'Jumping', value: getStatWithBoost(player, player.training_boosts, 'jumping') },
                    { label: 'Stamina', value: getStatWithBoost(player, player.training_boosts, 'stamina_stat', 'stamina') }
                ]
            }
        ];
    }



    // ---- major stat color ranking (top3 green, next2 orange, last red) ----
    const sorted = [...statCategories]
        .map(c => ({ key: c.key, value: c.mainValue }))
        .sort((a, b) => b.value - a.value);

    const majorColors = {};
    sorted.forEach((item, idx) => {
        if (idx <= 2) majorColors[item.key] = '#3BD671';      // top 3
        else if (idx <= 4) majorColors[item.key] = '#FFB86B'; // next 2
        else majorColors[item.key] = '#FF6B6B';               // last
    });

    const getMajorColor = (cat) => majorColors[cat.key] || getBaseColor(cat.mainValue);

    // progress bar max for main + sub stats
    const MAX_BAR = 280;
    const clampBarWidth = (value) => {
        const v = Math.max(0, Math.min(Number(value) || 0, MAX_BAR));
        return (v / MAX_BAR) * 100;
    };

    container.innerHTML = `
        <div style="background: var(--color-graphite-900, #0E1114); min-height: 100vh; padding: 0;">
            <!-- Top Section: Player Card + Rank/Training -->
            <div style="
                max-width: 1400px;
                margin: 0 auto;
                padding: 24px 24px 0 24px;
            ">
                <!-- Back Button -->
                <button onclick="switchView('database')" style="
                    background: transparent;
                    border: 1px solid rgba(255,255,255,0.1);
                    color: var(--color-text-muted, #98A0A6);
                    padding: 12px 20px;
                    border-radius: var(--radius-base, 8px);
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                    font-family: var(--font-family-base);
                    transition: all 0.2s;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 20px;
                " onmouseover="this.style.borderColor='rgba(0,194,168,0.4)'; this.style.color='#E6EEF2'" onmouseout="this.style.borderColor='rgba(255,255,255,0.1)'; this.style.color='#98A0A6'">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                    Back to Players
                </button>

                <div class="player-top-section" style="
                    display: grid;
                    grid-template-columns: 400px 1fr;
                    gap: 28px;
                    margin-bottom: 32px;
                ">
                    <!-- LEFT: Player Card -->
                    <div>
                        <div style="
                            background: var(--color-graphite-800, #14181C);
                            border: 1px solid rgba(0,194,168,0.15);
                            border-radius: var(--radius-lg, 12px);
                            padding: 32px;
                            box-shadow: var(--shadow-lg);
                            position: relative;
                            overflow: hidden;
                        ">
                       

                            <div style="
                                width: 260px;
                                height: 260px;
                                margin: 0 auto 24px;
                                background: var(--color-graphite-700, #1B2126);
                                border-radius: var(--radius-md, 10px);
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                position: relative;
                                overflow: hidden;
                                border: 2px solid rgba(0,194,168,0.2);
                            ">
                                ${player.player_image ?
                                    `<img src="${player.player_image}" alt="${player.name}" style="width: 100%; height: 100%; object-fit: cover;">` :
                                    `<span style="font-size: 80px; font-weight: 800; color: var(--color-text-muted, #98A0A6); font-family: var(--font-family-base);">${typeof getInitials === 'function' ? getInitials(player.name) : player.name.substring(0,2)}</span>`
                                }
                                <div style="
                                    position: absolute;
                                    top: 14px;
                                    left: 14px;
                                    background: var(--color-teal-500, #00C2A8);
                                    color: var(--color-graphite-900, #0E1114);
                                    width: 64px;
                                    height: 64px;
                                    border-radius: var(--radius-base, 8px);
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                    justify-content: center;
                                    box-shadow: 0 4px 16px rgba(0,194,168,0.5);
                                    font-family: var(--font-family-base);
                                ">
                                    <div style="font-size: 32px; font-weight: 900; line-height: 1;">
                                        ${player.ovr || 'N/A'}
                                        ${player.training_level > 0 ? `<span style="font-size: 14px; color: #00C2A8; margin-left: 4px;">+${player.training_level}</span>` : ''}
                                    </div>
                                    <div style="font-size: 11px; font-weight: 700; opacity: 0.8; text-transform: uppercase;">
                                        OVR${player.training_level > 0 ? ' (Trained)' : ''}
                                    </div>

                                </div>
                                <div style="
                                    position: absolute;
                                    top: 14px;
                                    right: 14px;
                                    background: rgba(0,0,0,0.75);
                                    backdrop-filter: blur(10px);
                                    color: white;
                                    padding: 10px 16px;
                                    border-radius: var(--radius-base, 8px);
                                    font-size: 15px;
                                    font-weight: 800;
                                    font-family: var(--font-family-base);
                                    border: 1px solid rgba(255,255,255,0.15);
                                ">${player.position || 'N/A'}</div>
                            </div>

                            <h1 style="
                                font-size: 28px;
                                font-weight: 800;
                                color: var(--color-text-primary, #E6EEF2);
                                margin: 0 0 12px 0;
                                text-align: center;
                                font-family: var(--font-family-base);
                                line-height: 1.2;
                            ">${player.name}</h1>

                            <div style="
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 14px;
                                margin-bottom: 24px;
                                flex-wrap: wrap;
                            ">
                                <span style="
                                    color: var(--color-text-muted, #98A0A6);
                                    font-size: 15px;
                                    font-weight: 600;
                                    font-family: var(--font-family-base);
                                ">${player.team || 'N/A'}</span>
                                ${flagUrl ? `
                                    <img src="${flagUrl}" alt="${nationField}" style="
                                        width: 32px;
                                        height: 22px;
                                        object-fit: cover;
                                        border-radius: 4px;
                                        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                                    ">
                                ` : ''}
                            </div>

                            <div style="
                                display: grid;
                                grid-template-columns: 1fr 1fr;
                                gap: 14px;
                                margin-bottom: 20px;
                            ">
                                <div style="
                                    background: rgba(255,255,255,0.03);
                                    border: 1px solid rgba(255,255,255,0.08);
                                    border-radius: var(--radius-base, 8px);
                                    padding: 14px;
                                    text-align: center;
                                ">
                                    <div style="
                                        font-size: 11px;
                                        color: var(--color-text-muted, #98A0A6);
                                        font-weight: 600;
                                        margin-bottom: 8px;
                                        text-transform: uppercase;
                                        font-family: var(--font-family-base);
                                        letter-spacing: 0.5px;
                                    ">Skill Moves</div>
                                    <div style="font-size: 18px; color: #FFB86B; letter-spacing: 2px;">
                                        ${'★'.repeat(getStat(player, 'skill_moves_stars', 'skill_moves') || 0)}${'☆'.repeat(5 - (getStat(player, 'skill_moves_stars', 'skill_moves') || 0))}
                                    </div>
                                </div>
                                <div style="
                                    background: rgba(255,255,255,0.03);
                                    border: 1px solid rgba(255,255,255,0.08);
                                    border-radius: var(--radius-base, 8px);
                                    padding: 14px;
                                    text-align: center;
                                ">
                                    <div style="
                                        font-size: 11px;
                                        color: var(--color-text-muted, #98A0A6);
                                        font-weight: 600;
                                        margin-bottom: 8px;
                                        text-transform: uppercase;
                                        font-family: var(--font-family-base);
                                        letter-spacing: 0.5px;
                                    ">Weak Foot</div>
                                    <div style="font-size: 18px; color: #FFB86B; letter-spacing: 2px;">
                                        ${'★'.repeat(getStat(player, 'weak_foot_stars', 'weak_foot') || 0)}${'☆'.repeat(5 - (getStat(player, 'weak_foot_stars', 'weak_foot') || 0))}
                                    </div>
                                </div>
                            </div>

                            <div style="
                                background: rgba(255,255,255,0.03);
                                border: 1px solid rgba(255,255,255,0.08);
                                border-radius: var(--radius-base, 8px);
                                padding: 16px;
                                margin-bottom: 20px;
                            ">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                                    <span style="font-size: 13px; color: var(--color-text-muted, #98A0A6); font-weight: 600; font-family: var(--font-family-base);">League</span>
                                    <span style="font-size: 13px; color: var(--color-text-primary, #E6EEF2); font-weight: 700; font-family: var(--font-family-base);">${player.league || 'N/A'}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between;">
                                    <span style="font-size: 13px; color: var(--color-text-muted, #98A0A6); font-weight: 600; font-family: var(--font-family-base);">Nation</span>
                                    <span style="font-size: 13px; color: var(--color-text-primary, #E6EEF2); font-weight: 700; font-family: var(--font-family-base);">${nationField || 'N/A'}</span>
                                </div>
                            </div>

                            <div style="
                                background: rgba(0,194,168,0.08);
                                border: 1px solid rgba(0,194,168,0.25);
                                border-radius: var(--radius-base, 8px);
                                padding: 18px;
                                text-align: center;
                            ">
                                <div style="
                                    font-size: 12px;
                                    color: var(--color-text-muted, #98A0A6);
                                    font-weight: 600;
                                    margin-bottom: 8px;
                                    text-transform: uppercase;
                                    font-family: var(--font-family-base);
                                    letter-spacing: 0.5px;
                                ">Market Value</div>
                                <div style="
                                    font-size: 26px;
                                    font-weight: 900;
                                    color: var(--color-teal-500, #00C2A8);
                                    font-family: var(--font-family-base);
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    gap: 10px;
                                ">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <circle cx="12" cy="12" r="10"/>
                                    </svg>
                                    ${player.price ? (typeof formatPrice === 'function' ? formatPrice(player.price) : player.price.toLocaleString()) : 'Non-Auctionable'}
                                </div>
                            </div>
                        </div>

                        <button onclick="window.togglePlayerWatchlist('${uniqueId}')" style="
                            width: 100%;
                            background: ${isWatchlisted ? 'rgba(0,194,168,0.15)' : 'transparent'};
                            border: 1px solid ${isWatchlisted ? 'var(--color-teal-500, #00C2A8)' : 'rgba(255,255,255,0.15)'};
                            color: ${isWatchlisted ? 'var(--color-teal-500, #00C2A8)' : 'var(--color-text-muted, #98A0A6)'};
                            padding: 16px 24px;
                            border-radius: var(--radius-base, 8px);
                            cursor: pointer;
                            font-size: 15px;
                            font-weight: 700;
                            font-family: var(--font-family-base);
                            transition: all 0.2s;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 10px;
                            margin-top: 16px;
                        " onmouseover="this.style.borderColor='var(--color-teal-500, #00C2A8)'; this.style.color='var(--color-teal-500, #00C2A8)'" onmouseout="this.style.borderColor='${isWatchlisted ? '#00C2A8' : 'rgba(255,255,255,0.15)'}'; this.style.color='${isWatchlisted ? '#00C2A8' : '#98A0A6'}'">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="${isWatchlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            ${isWatchlisted ? 'In Watchlist' : 'Add to Watchlist'}
                        </button>
                    </div>

                    <!-- RIGHT: Rank / Training area + Skills -->
                    <div>
                        ${buildRankSelectionSection(player)}
                        
                        <!-- ⚡ SKILLS SECTION - Now below rank box -->
                        <div class="player-skills-section" style="margin-top: 24px;">
                          <div class="skills-header">
                            <h3>⚡ Skills & Abilities</h3>
                            <button class="reset-skills-btn" onclick="resetPlayerSkills(${player.player_id}, ${player.rank || 0})">
                              🔄 Reset Skills
                            </button>
                          </div>
                          
                          <!-- Skills Grid -->
                          <div class="skills-grid" id="player-skills-grid">
                            <!-- Skill cards rendered by JavaScript -->
                          </div>
                          
                          <!-- Skill Details Modal (for viewing stat boosts) -->
                          <div class="skill-detail-modal" id="skill-detail-modal" style="display: none;">
                            <div class="skill-modal-content">
                              <!-- Populated dynamically -->
                            </div>
                          </div>
                        </div>
                    </div>

                </div>
            </div>

            <!-- Bottom Section: Stats Table -->
            <div style="
                max-width: 1400px;
                margin: 0 auto;
                padding: 0 24px 32px 24px;
            ">
                <h2 style="
                    font-size: 22px;
                    font-weight: 800;
                    color: var(--color-text-primary, #E6EEF2);
                    margin: 0 0 20px 0;
                    font-family: var(--font-family-base);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                ">${isGoalkeeper ? 'Goalkeeper Statistics' : 'Player Statistics'}</h2>

                <div class="stats-grid-container">
                    <div style="
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 20px;
                    ">
                        ${statCategories.map(cat => {
                            const majorColor = getMajorColor(cat);
                            const mainBarWidth = clampBarWidth(cat.mainValue);
                            return `
                                <div style="
                                    background: var(--color-graphite-800, #14181C);
                                    border: 1px solid rgba(255,255,255,0.08);
                                    border-left: 4px solid ${majorColor};
                                    border-radius: var(--radius-lg, 12px);
                                    padding: 24px;
                                    box-shadow: var(--shadow-md);
                                ">
                                    <div style="
                                        display: flex;
                                        justify-content: space-between;
                                        align-items: center;
                                        margin-bottom: 20px;
                                        padding-bottom: 16px;
                                        border-bottom: 1px solid rgba(255,255,255,0.08);
                                    ">
                                        <h3 style="
                                            font-size: 16px;
                                            font-weight: 700;
                                            color: var(--color-text-primary, #E6EEF2);
                                            margin: 0;
                                            font-family: var(--font-family-base);
                                            text-transform: uppercase;
                                            letter-spacing: 0.5px;
                                        ">${cat.name}</h3>
                                        <div style="
                                            font-size: 36px;
                                            font-weight: 900;
                                            color: ${majorColor};
                                            font-family: var(--font-family-base);
                                            line-height: 1;
                                        ">${cat.mainValue}</div>
                                    </div>

                                    <div style="
                                        width: 100%;
                                        height: 10px;
                                        background: rgba(255,255,255,0.08);
                                        border-radius: 5px;
                                        overflow: hidden;
                                        margin-bottom: 20px;
                                    ">
                                        <div style="
                                            width: ${mainBarWidth}%;
                                            height: 100%;
                                            background: ${majorColor};
                                            border-radius: 5px;
                                            box-shadow: 0 0 10px ${majorColor}60;
                                            transition: width 0.6s ease;
                                        "></div>
                                    </div>

                                    <div style="display: grid; gap: 12px;">
                                        ${cat.substats.map(sub => {
                                            const subColor = getBaseColor(sub.value);
                                            const subWidth = clampBarWidth(sub.value);
                                            return `
                                                <div>
                                                    <div style="
                                                        display: flex;
                                                        justify-content: space-between;
                                                        align-items: center;
                                                        margin-bottom: 6px;
                                                    ">
                                                        <span style="
                                                            font-size: 13px;
                                                            color: var(--color-text-muted, #98A0A6);
                                                            font-weight: 600;
                                                            font-family: var(--font-family-base);
                                                        ">${sub.label}</span>
                                                        <span style="
                                                            font-size: 17px;
                                                            font-weight: 800;
                                                            color: ${subColor};
                                                            font-family: var(--font-family-base);
                                                        ">${sub.value}</span>
                                                    </div>
                                                    <div style="
                                                        width: 100%;
                                                        height: 6px;
                                                        background: rgba(255,255,255,0.08);
                                                        border-radius: 3px;
                                                        overflow: hidden;
                                                    ">
                                                        <div style="
                                                            width: ${subWidth}%;
                                                            height: 100%;
                                                            background: ${subColor};
                                                            border-radius: 3px;
                                                            transition: width 0.5s ease;
                                                        "></div>
                                                    </div>
                                                </div>
                                            `;
                                        }).join('')}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        </div>

        <style>
            * {
                box-sizing: border-box;
            }
            
            /* Tablet and below - Stack player card vertically */
            @media (max-width: 1200px) {
                .player-top-section {
                    grid-template-columns: 1fr !important;
                    max-width: 500px;
                    margin-left: auto;
                    margin-right: auto;
                }
            }
            
            /* Medium tablets - 2 column stats grid */
            @media (max-width: 900px) {
                .stats-grid-container > div {
                    grid-template-columns: repeat(2, 1fr) !important;
                    gap: 16px !important;
                }
            }
            
            /* Mobile devices - Perfect 2x2 grid */
            @media (max-width: 640px) {
                /* Reduce outer container padding */
                #player-detail-view > div > div {
                    padding: 16px 12px !important;
                }
                
                /* Stats grid - 2 columns with tighter spacing */
                .stats-grid-container > div {
                    grid-template-columns: repeat(2, 1fr) !important;
                    gap: 10px !important;
                }
                
                /* Reduce stat card padding */
                .stats-grid-container > div > div {
                    padding: 16px 12px !important;
                }
                
                /* Scale down stat category headers */
                .stats-grid-container h3 {
                    font-size: 13px !important;
                }
                
                /* Scale down main stat number */
                .stats-grid-container > div > div > div:first-child > div:last-child {
                    font-size: 28px !important;
                }
                
                /* Reduce substat font sizes */
                .stats-grid-container span {
                    font-size: 11px !important;
                }
                
                /* Reduce substat values */
                .stats-grid-container > div > div > div:last-child span:last-child {
                    font-size: 14px !important;
                }
                
                /* Reduce progress bar heights */
                .stats-grid-container > div > div > div:nth-child(2) {
                    height: 8px !important;
                }
                
                .stats-grid-container > div > div > div:last-child > div > div:last-child {
                    height: 5px !important;
                }
                
                /* Reduce spacing in substats */
                .stats-grid-container > div > div > div:last-child {
                    gap: 10px !important;
                }
                
                /* Player card adjustments */
                .player-top-section > div:first-child > div:first-child {
                    padding: 20px 16px !important;
                }
            }
            
            /* Small mobile devices - Extra tight 2x2 */
            @media (max-width: 480px) {
                /* Even tighter outer padding */
                #player-detail-view > div > div {
                    padding: 12px 8px !important;
                }
                
                /* Minimal gap between stat cards */
                .stats-grid-container > div {
                    gap: 8px !important;
                }
                
                /* Compact stat card padding */
                .stats-grid-container > div > div {
                    padding: 12px 10px !important;
                }
                
                /* Further reduce headers */
                .stats-grid-container h3 {
                    font-size: 12px !important;
                }
                
                /* Smaller main stat */
                .stats-grid-container > div > div > div:first-child > div:last-child {
                    font-size: 24px !important;
                }
                
                /* Smaller substat labels */
                .stats-grid-container span {
                    font-size: 10px !important;
                }
                
                /* Smaller substat values */
                .stats-grid-container > div > div > div:last-child span:last-child {
                    font-size: 13px !important;
                }
                
                /* Reduce player image size */
                .player-top-section img[alt]:first-of-type {
                    width: 220px !important;
                    height: 220px !important;
                }
                
                /* Reduce OVR badge */
                .player-top-section > div:first-child > div:first-child > div:first-child > div:first-child {
                    width: 54px !important;
                    height: 54px !important;
                }
                
                .player-top-section > div:first-child > div:first-child > div:first-child > div:first-child > div:first-child {
                    font-size: 26px !important;
                }
                
                /* Back button adjustment */
                button[onclick="switchView('database')"] {
                    padding: 10px 16px !important;
                    font-size: 13px !important;
                }
                
                /* Title adjustments */
                h1 {
                    font-size: 22px !important;
                }
                
                h2 {
                    font-size: 18px !important;
                    margin-bottom: 12px !important;
                }
            }
            
            /* Extra small devices - Ensure no overflow */
            @media (max-width: 360px) {
                .stats-grid-container > div {
                    gap: 6px !important;
                }
                
                .stats-grid-container > div > div {
                    padding: 10px 8px !important;
                }
                
                .stats-grid-container h3 {
                    font-size: 11px !important;
                }
                
                .stats-grid-container > div > div > div:first-child > div:last-child {
                    font-size: 22px !important;
                }
            }

            /* Tablet (768px - 1020px) */
            @media (max-width: 1020px) {
                .rank-cards-grid {
                    gap: 16px !important; /* ✅ Keep good spacing */
                    max-width: 550px !important;
                }
                
                .rank-card {
                    min-width: 75px !important; /* ✅ Smaller card */
                    min-height: 100px !important;
                    padding: 14px 10px !important;
                    gap: 8px !important;
                }
                
                .rank-selector-icon {
                    width: 56px !important; /* ✅ Smaller icon */
                    height: 56px !important;
                    background-repeat: no-repeat !important;
                    image-rendering: pixelated !important;
                }
                
                .rank-selector-icon[data-icon-size] {
                    background-size: 336px 336px !important; /* 56/32 * 192 */
                }
                
                .rank-card div:first-child {
                    font-size: 14px !important;
                }
            }

            /* Mobile (480px - 768px) */
            @media (max-width: 768px) {
                .rank-cards-grid {
                    gap: 14px !important; /* ✅ Maintain good spacing */
                    max-width: 100% !important;
                    padding: 0 10px !important;
                }
                
                .rank-card {
                    min-width: 60px !important; /* ✅ Even smaller card */
                    min-height: 85px !important;
                    padding: 12px 8px !important;
                    gap: 6px !important;
                }
                
                .rank-selector-icon {
                    width: 48px !important; /* ✅ Smaller icon */
                    height: 48px !important;
                    background-repeat: no-repeat !important;
                    image-rendering: pixelated !important;
                }
                
                .rank-selector-icon[data-icon-size] {
                    background-size: 288px 288px !important; /* 48/32 * 192 */
                }
                
                .rank-card div:first-child {
                    font-size: 13px !important;
                }
            }

            /* Small Mobile (< 480px) */
            @media (max-width: 480px) {
                .rank-cards-grid {
                    gap: 12px !important; /* ✅ Still good spacing */
                    padding: 0 8px !important;
                }
                
                .rank-card {
                    min-width: 50px !important; /* ✅ Compact card */
                    min-height: 72px !important;
                    padding: 10px 6px !important;
                    gap: 4px !important;
                }
                
                .rank-selector-icon {
                    width: 40px !important; /* ✅ Compact icon */
                    height: 40px !important;
                    background-repeat: no-repeat !important;
                    image-rendering: pixelated !important;
                }
                
                .rank-selector-icon[data-icon-size] {
                    background-size: 240px 240px !important; /* 40/32 * 192 */
                }
                
                .rank-card div:first-child {
                    font-size: 12px !important;
                }
            }

            /* Extra Small Mobile (< 360px) */
            @media (max-width: 360px) {
                .rank-cards-grid {
                    gap: 12px !important; /* ✅ Minimum breathing room */
                    padding: 0 6px !important;
                }
                
                .rank-card {
                    min-width: 42px !important; /* ✅ Very compact */
                    min-height: 65px !important;
                    padding: 8px 4px !important;
                    gap: 5px !important;
                }
                
                .rank-selector-icon {
                    width: 36px !important; /* ✅ Tiny icon */
                    height: 36px !important;
                    background-repeat: no-repeat !important;
                    image-rendering: pixelated !important;
                }
                
                .rank-selector-icon[data-icon-size] {
                    background-size: 216px 216px !important; /* 36/32 * 192 */
                }
                
                .rank-card div:first-child {
                    font-size: 11px !important;
                }
            }

            /* Training Dropdown Styles */
            select#training-level-${player.player_id}:hover {
                border-color: var(--color-teal-500, #00C2A8) !important;
            }

            select option {
                background: var(--color-graphite-900, #0E1114);
                color: var(--color-text-primary, #E6EEF2);
                padding: 12px;
                font-weight: 600;
            }

            select option:checked {
                background: var(--color-teal-500, #00C2A8);
                color: var(--color-graphite-900, #0E1114);
            }

            /* Responsive Training Dropdown */
            @media (max-width: 640px) {
                select[id^="training-level"] {
                    font-size: 13px !important;
                    padding: 10px 14px !important;
                }
            }

        </style>
    `;

    setTimeout(() => {
        renderPlayerSkills(player);
        initAllRankAnimations();
    }, 100);
}

// Add this function after renderPlayerDetail()
// ==================== RENDER PLAYER SKILLS ====================
// ==================== CALCULATE MAX LEVELS ====================
function calculateMaxLevels(skills) {
  const maxLevels = {};
  
  // Default: all skills have max level 1
  skills.forEach(skill => {
    maxLevels[skill.skill_id] = 1;
  });
  
  // Find skills that appear as prerequisites and update their max levels
  skills.forEach(skill => {
    if (skill.unlock_requirement_skillname && skill.unlock_requirement_level) {
      // Find the skill_id of the prerequisite by matching name
      const prereqSkill = skills.find(s => 
        s.skill_name && skill.unlock_requirement_skillname &&
        s.skill_name.toUpperCase() === skill.unlock_requirement_skillname.toUpperCase()
      );
      
      if (prereqSkill) {
        // Update max level to the highest requirement level seen
        const currentMax = maxLevels[prereqSkill.skill_id] || 1;
        const requiredLevel = skill.unlock_requirement_level || 1;
        maxLevels[prereqSkill.skill_id] = Math.max(currentMax, requiredLevel);
      }
    }
  });
  
  console.log('[SKILLS] Calculated max levels:', maxLevels);
  return maxLevels;
}


// ==================== RENDER PLAYER SKILLS ====================
async function renderPlayerSkills(player) {
  console.log('[SKILLS] Rendering skills for player:', player.player_id, 'Rank:', player.rank);
  
  const skillsGrid = document.getElementById('player-skills-grid');
  if (!skillsGrid) {
    console.error('[SKILLS] Grid element not found');
    return;
  }

  const skills = player.skills || [];
  const availablePoints = player.available_skill_points || player.rank || 0;
  const currentRank = player.rank || 0;

  if (skills.length === 0) {
    skillsGrid.innerHTML = '<p style="color: #98A0A6; text-align: center;">No skills available</p>';
    return;
  }

  // Calculate max levels for each skill
  const maxLevels = calculateMaxLevels(skills);

  // Fetch user's current allocations
  let userAllocations = [];
  try {
    const response = await window.apiClient.getUserSkillAllocations(
      CURRENT_USER_ID, 
      player.player_id, 
      currentRank
    );
    userAllocations = response.allocations || [];
    console.log('[SKILLS] User allocations:', userAllocations);
  } catch (error) {
    console.error('[SKILLS] Error fetching allocations:', error);
  }

  // Build a map of skill_id -> current level
  const allocationMap = {};
  userAllocations.forEach(a => {
    allocationMap[a.skill_id] = a.skill_level;
  });

  // Calculate points spent
  const pointsSpent = userAllocations.reduce((sum, a) => sum + a.skill_level, 0);
  const pointsRemaining = availablePoints - pointsSpent;

  console.log('[SKILLS] Points - Available:', availablePoints, 'Spent:', pointsSpent, 'Remaining:', pointsRemaining);

  // Render skill cards
  skillsGrid.innerHTML = '';
  
  skills.forEach(skill => {
    const currentLevel = allocationMap[skill.skill_id] || 0;
    const isUnlocked = checkIfSkillUnlocked(skill, allocationMap, skills);
    
    const card = createSkillCard(skill, currentLevel, isUnlocked, pointsRemaining, player, maxLevels);
    skillsGrid.appendChild(card);
  });
}


// ==================== CHECK IF SKILL UNLOCKED ====================
function checkIfSkillUnlocked(skill, allocationMap, allSkills) {
  // Check if skill has unlock requirements
  const hasUnlockRequirement = skill.unlock_requirement_type && 
                                skill.unlock_requirement_type === 'skill_level' &&
                                skill.unlock_requirement_skillname && 
                                skill.unlock_requirement_level;
  
  // If no unlock requirement, skill is unlocked
  if (!hasUnlockRequirement) {
    return true;
  }
  
  const requiredSkillName = skill.unlock_requirement_skillname.toUpperCase();
  const requiredLevel = skill.unlock_requirement_level;
  
  // Try using prerequisite_skill_id first (most reliable)
  if (skill.prerequisite_skill_id && skill.prerequisite_skill_id !== 0) {
    const prereqLevel = allocationMap[skill.prerequisite_skill_id] || 0;
    return prereqLevel >= requiredLevel;
  }
  
  // Fallback: Find by skill name
  const prereqSkill = allSkills.find(s => 
    s.skill_name && s.skill_name.toUpperCase() === requiredSkillName
  );
  
  if (prereqSkill) {
    const prereqLevel = allocationMap[prereqSkill.skill_id] || 0;
    return prereqLevel >= requiredLevel;
  }
  
  // Can't find prerequisite = assume locked
  return false;
}


// ==================== CREATE SKILL CARD ====================
// ==================== CREATE SKILL CARD (UPDATED) ====================
function createSkillCard(skill, currentLevel, isUnlocked, pointsRemaining, player, maxLevels) {
  const card = document.createElement('div');
  card.className = `skill-card ${!isUnlocked ? 'locked' : ''}`;
  
  // Get max level from calculated map
  const maxLevel = maxLevels[skill.skill_id] || 1;
  
  // ✅ Make entire card clickable to open modal
  card.style.cursor = 'pointer';
  card.addEventListener('click', (e) => {
    openSkillDetailModal(skill.skill_id, skill.skill_name);
  });
  
  card.innerHTML = `
    <div class="skill-card-inner">
      <!-- Skill Icon -->
      <div class="skill-icon">
        <img src="${skill.skill_image}" alt="${skill.skill_name}" 
             onerror="this.src='https://via.placeholder.com/80?text=SKILL'">
        ${!isUnlocked ? '<div class="lock-overlay">🔒</div>' : ''}
      </div>
      
      <!-- Skill Name -->
      <div class="skill-name">${skill.skill_name}</div>
      
      <!-- Current Level -->
      <div class="skill-level">
        Level: <span class="level-number">${currentLevel}</span>/${maxLevel}
      </div>
      
      <!-- Unlock Requirement or Status -->
      ${!isUnlocked ? `
        <div class="unlock-requirement">
          <small>${skill.unlock_requirement_text || 'Locked'}</small>
        </div>
      ` : `
        <div class="skill-actions">
          ${currentLevel >= maxLevel ? `
            <div class="max-level-badge">MAX LEVEL</div>
          ` : ''}
          ${currentLevel < maxLevel && pointsRemaining === 0 ? `
            <small style="color: #FF6B6B;">No points remaining</small>
          ` : ''}
        </div>
      `}
    </div>
  `;
  
  return card;
}



// ==================== SKILL BOOST HELPERS ====================

/**
 * Calculate skill boosts from user's allocated skills
 * @param {Array} userAllocations - Array of skill allocations with skill_id and skill_level
 * @returns {Object} Accumulated skill boosts (e.g., { finishing: 3, shot_power: 2 })
 */
async function calculateSkillBoosts(userAllocations) {
  const skillBoosts = {};
  
  for (const allocation of userAllocations) {
    if (allocation.skill_level > 0) {
      try {
        const boostData = await window.apiClient.getSkillBoosts(allocation.skill_id);
        
        if (boostData && boostData.boosts) {
          const levelBoost = boostData.boosts.find(b => b.level_number === allocation.skill_level);
          
          if (levelBoost) {
            for (const [key, value] of Object.entries(levelBoost)) {
              if (key.startsWith('boost_') && value != null && value !== 0) {
                const statName = key.replace('boost_', '');
                skillBoosts[statName] = (skillBoosts[statName] || 0) + value;
              }
            }
          }
        }
      } catch (error) {
        console.error(`[SKILLS] Error fetching boosts for skill ${allocation.skill_id}:`, error);
      }
    }
  }
  
  return skillBoosts;
}

/**
 * Merge training boosts and skill boosts
 * @param {Object} trainingBoosts - Boosts from position training
 * @param {Object} skillBoosts - Boosts from allocated skills
 * @returns {Object} Combined boosts
 */
function mergeBoosts(trainingBoosts, skillBoosts) {
  const merged = { ...(trainingBoosts || {}) };
  
  for (const [stat, value] of Object.entries(skillBoosts || {})) {
    merged[stat] = (merged[stat] || 0) + value;
  }
  
  return merged;
}

// ==================== UPGRADE SKILL ====================
window.upgradeSkillLevel = async function(skillId, newLevel, playerId, rank) {
  console.log('[SKILLS] Upgrading skill:', skillId, 'to level', newLevel);
  
  try {
    const result = await window.apiClient.upgradeSkill(
      CURRENT_USER_ID,
      playerId,
      rank,
      skillId,
      newLevel
    );
    
    console.log('[SKILLS] Upgrade success:', result);
    
    // Show success message
    if (typeof showToast === 'function') {
      showToast(`✅ Skill upgraded to Level ${newLevel}!`, 'success');
    }
    
    // Re-fetch player data and re-render
    if (state.selectedPlayer) {
      const resp = await window.apiClient.getPlayerDetails(playerId, rank);
      
      // Fetch user's skill allocations
      const allocationsResp = await window.apiClient.getUserSkillAllocations(
        CURRENT_USER_ID,
        playerId,
        rank
      );
      
      // Calculate skill boosts from allocations
      const skillBoosts = await calculateSkillBoosts(allocationsResp.allocations || []);
      
      // Merge training boosts with skill boosts
      const combinedBoosts = mergeBoosts(resp.player.training_boosts, skillBoosts);
      
      const updatedPlayer = {
        ...state.selectedPlayer,
        ...resp.player,
        skills: resp.skills,
        available_skill_points: resp.available_skill_points,
        training_boosts: combinedBoosts,  // Use combined boosts
        skill_boosts: skillBoosts          // Store separately for reference
      };
      
      state.selectedPlayer = updatedPlayer;
      
      // Re-render skills section only
      await renderPlayerSkills(updatedPlayer);
      
      // Optionally re-render entire detail view to show updated stats
         await renderPlayerSkills(updatedPlayer);
         renderPlayerDetail(updatedPlayer);
         cleanupRankAnimations();
    }
    
  } catch (error) {
    console.error('[SKILLS] Upgrade error:', error);
    if (typeof showToast === 'function') {
      showToast(`❌ ${error.message}`, 'error');
    } else {
      alert(`Error: ${error.message}`);
    }
  }
};

// ==================== RESET SKILLS BUTTON ====================
window.resetPlayerSkills = async function(playerId, rank) {
  console.log('[SKILLS] Resetting all skills for player', playerId, 'at rank', rank);
  
  try {
    // Call API to reset skills
    const result = await window.apiClient.resetSkills(CURRENT_USER_ID, playerId, rank);
    
    console.log('[SKILLS] Reset successful:', result);
    
    // Show success message
    if (typeof showToast === 'function') {
      showToast(`✅ Skills reset! ${rank} points available`, 'success');
    }
    
    // Re-fetch player data and re-render
    if (state.selectedPlayer) {
      const resp = await window.apiClient.getPlayerDetails(playerId, rank);
      const updatedPlayer = {
        ...state.selectedPlayer,
        ...resp.player,
        skills: resp.skills,
        available_skill_points: resp.available_skill_points,
        skill_boosts: {}  // Clear skill boosts after reset
      };
      
      state.selectedPlayer = updatedPlayer;
      
      // Re-render both skills section and player detail
      await renderPlayerSkills(updatedPlayer);
      renderPlayerDetail(updatedPlayer);
    }
    
  } catch (error) {
    console.error('[SKILLS] Reset error:', error);
    if (typeof showToast === 'function') {
      showToast(`❌ Reset failed: ${error.message}`, 'error');
    } else {
      alert(`Error resetting skills: ${error.message}`);
    }
  }
};



// ==================== SKILL DETAIL MODAL ====================
window.openSkillDetailModal = async function(skillId, skillName) {
  console.log('[SKILLS] Opening modal for skill:', skillId);
  
  const modal = document.getElementById('skill-detail-modal');
  if (!modal) {
    console.error('[SKILLS] Modal element not found');
    return;
  }
  
  // Store skill info in modal dataset for re-opening
  modal.dataset.skillId = skillId;
  modal.dataset.skillName = skillName;
  
  // Show loading state
  modal.innerHTML = `
    <div class="skill-modal-content">
      <h3>Loading ${skillName}...</h3>
    </div>
  `;
  modal.style.display = 'flex';
  
  try {
    // Get current player data
    if (!state.selectedPlayer) {
      throw new Error('No player selected');
    }
    
    const player = state.selectedPlayer;
    
    // Fetch skill boosts
    const boostsData = await window.apiClient.getSkillBoosts(skillId);
    const boosts = boostsData.boosts || [];
    
    // Fetch user's skill allocations to determine current level
    const allocationsResp = await window.apiClient.getUserSkillAllocations(
      CURRENT_USER_ID,
      player.player_id,
      player.rank
    );
    const userAllocations = allocationsResp.allocations || [];
    
    // Find current level for this skill
    const allocation = userAllocations.find(a => a.skill_id === skillId);
    const currentLevel = allocation ? allocation.skill_level : 0;
    
    // Calculate points remaining
    const availablePoints = player.available_skill_points || player.rank || 0;
    const pointsSpent = userAllocations.reduce((sum, a) => sum + a.skill_level, 0);
    const pointsRemaining = availablePoints - pointsSpent;
    
    console.log('[SKILLS] Current level:', currentLevel, 'Points remaining:', pointsRemaining);
    
    // Render modal content
    renderSkillDetailModal(skillName, boosts, currentLevel, pointsRemaining, skillId, player);
    
  } catch (error) {
    console.error('[SKILLS] Error loading skill details:', error);
    modal.innerHTML = `
      <div class="skill-modal-content">
        <h3>Error Loading Skill</h3>
        <p style="color: #FF6B6B;">${error.message}</p>
        <button onclick="closeSkillDetailModal()" style="margin-top: 15px; padding: 10px 20px; background: #00C2A8; border: none; border-radius: 8px; cursor: pointer;">Close</button>
      </div>
    `;
  }
};

function renderSkillDetailModal(skillName, boosts, currentLevel, pointsRemaining, skillId, player) {
  const modal = document.getElementById('skill-detail-modal');
  
  let boostsHTML = '';
  
  boosts.forEach(boost => {
    const levelNum = boost.level_number;
    // FIX: Only mark as selected if this exact level is currently active
    const isSelected = currentLevel === levelNum;
    // FIX: Calculate points needed for upgrade (negative means downgrade - always allowed)
    const pointsNeeded = levelNum - currentLevel;
    const canAfford = pointsNeeded <= pointsRemaining;
    // Only disable if NOT selected AND requires MORE points than available
    const isDisabled = !isSelected && !canAfford;
    
    // FIX: Allow clicking any affordable level (including lower levels for downgrade)
    // Add event.stopPropagation() to prevent modal from closing
    const onclickAttr = isDisabled ? '' : `onclick="event.stopPropagation(); selectSkillLevel(${skillId}, ${levelNum}, ${currentLevel}, ${player.player_id}, ${player.rank})"`;
    const cursorStyle = isDisabled ? 'cursor: not-allowed;' : 'cursor: pointer;';
    
    boostsHTML += `
      <div class="boost-level-section ${isSelected ? 'selected' : ''} ${currentLevel >= levelNum && !isSelected ? 'unlocked' : ''} ${isDisabled ? 'disabled' : ''}" 
           ${onclickAttr}
           style="${cursorStyle}">
        <div class="level-checkbox ${isSelected ? 'checked' : ''} ${currentLevel >= levelNum && !isSelected ? 'partial' : ''} ${isDisabled ? 'disabled' : ''}">
          ${isSelected ? '✓' : (currentLevel >= levelNum ? '○' : '')}
        </div>
        <h4>Level ${levelNum}</h4>
        ${isDisabled && pointsNeeded > 0 ? `<div class="insufficient-points">Need ${pointsNeeded} more point${pointsNeeded > 1 ? 's' : ''}</div>` : ''}
        <div class="boost-stats">
    `;
    
    // Show all non-zero boosts
    for (const [key, value] of Object.entries(boost)) {
      if (key.startsWith('boost_') && value && value !== 0) {
        const statName = key.replace('boost_', '').replace(/_/g, ' ').toUpperCase();
        boostsHTML += `<div class="boost-stat">+${value} ${statName}</div>`;
      }
    }
    
    boostsHTML += `
        </div>
      </div>
    `;
  });
  
  // FIX: Add event.stopPropagation() to modal content to prevent closing
  modal.innerHTML = `
    <div class="skill-modal-content" onclick="event.stopPropagation()">
      <button class="modal-close-btn" onclick="closeSkillDetailModal()">✕</button>
      <h2>${skillName}</h2>
      <div class="points-info">
        <div class="current-level-badge">Current Level: ${currentLevel}</div>
        <div class="points-remaining-badge">${pointsRemaining} point${pointsRemaining !== 1 ? 's' : ''} available</div>
      </div>
      <div class="boosts-container">
        ${boostsHTML || '<p>No boost data available</p>'}
      </div>
      <button class="modal-action-btn" onclick="closeSkillDetailModal()">Close</button>
    </div>
  `;
}

// ==================== SELECT SKILL LEVEL ====================
window.selectSkillLevel = async function(skillId, targetLevel, currentLevel, playerId, rank) {
  console.log('[SKILLS] Selecting level:', targetLevel, 'Current:', currentLevel);
  
  try {
    // FIX: Simplified logic - just set to the target level directly
    // If clicking the same level that's already selected, deselect it (set to 0)
    let newLevel = targetLevel;
    if (currentLevel === targetLevel && targetLevel > 0) {
      newLevel = 0; // Deselect completely
      console.log('[SKILLS] Deselecting level, setting to:', newLevel);
    }
    
    // If same as current, no change needed
    if (newLevel === currentLevel) {
      console.log('[SKILLS] No change needed');
      return;
    }
    
    // Call upgradeSkill API with new level
    const result = await window.apiClient.upgradeSkill(
      CURRENT_USER_ID,
      playerId,
      rank,
      skillId,
      newLevel
    );
    
    console.log('[SKILLS] Level change success:', result);
    
    // Show success message
    if (typeof showToast === 'function') {
      if (newLevel === 0) {
        showToast(`✅ Skill removed!`, 'success');
      } else if (newLevel > currentLevel) {
        showToast(`✅ Skill upgraded to Level ${newLevel}!`, 'success');
      } else if (newLevel < currentLevel) {
        showToast(`✅ Skill changed to Level ${newLevel}`, 'success');
      }
    }
    
    // Re-fetch player data
    if (state.selectedPlayer) {
      const resp = await window.apiClient.getPlayerDetails(playerId, rank);
      
      // Fetch user's skill allocations
      const allocationsResp = await window.apiClient.getUserSkillAllocations(
        CURRENT_USER_ID,
        playerId,
        rank
      );
      
      // Calculate skill boosts from allocations
      const skillBoosts = await calculateSkillBoosts(allocationsResp.allocations || []);
      
      // Merge training boosts with skill boosts
      const combinedBoosts = mergeBoosts(resp.player.training_boosts, skillBoosts);
      
      const updatedPlayer = {
        ...state.selectedPlayer,
        ...resp.player,
        skills: resp.skills,
        available_skill_points: resp.available_skill_points,
        training_boosts: combinedBoosts,
        skill_boosts: skillBoosts
      };
      
      state.selectedPlayer = updatedPlayer;
      
      // Re-render skills grid
      await renderPlayerSkills(updatedPlayer);
      
      // FIX: Update modal content in-place (keep modal open, no flicker)
      const modal = document.getElementById('skill-detail-modal');
      if (modal && modal.style.display !== 'none') {
        // Get updated allocation info
        const allocations = allocationsResp.allocations || [];
        const allocationMap = {};
        allocations.forEach(a => {
          allocationMap[a.skill_id] = a.skill_level;
        });
        
        // Calculate updated points remaining
        const totalPoints = updatedPlayer.available_skill_points || updatedPlayer.rank || 0;
        const usedPoints = allocations.reduce((sum, a) => sum + (a.skill_level || 0), 0);
        const pointsRemaining = totalPoints - usedPoints;
        
        // Get current skill's updated level
        const updatedCurrentLevel = allocationMap[skillId] || 0;
        
        // Fetch boosts data (should be cached)
        const boostsData = await window.apiClient.getSkillBoosts(skillId);
        const boosts = boostsData.boosts || [];
        
        // Re-render modal content directly (no loading state, no flicker)
        renderSkillDetailModal(
          modal.dataset.skillName, 
          boosts, 
          updatedCurrentLevel, 
          pointsRemaining, 
          skillId, 
          updatedPlayer
        );
        
        // FIX: Ensure modal stays visible
        modal.style.display = 'flex';
      }
    }
    
  } catch (error) {
    console.error('[SKILLS] Level change error:', error);
    if (typeof showToast === 'function') {
      showToast(`❌ ${error.message}`, 'error');
    } else {
      alert(`Error: ${error.message}`);
    }
  }
};

window.closeSkillDetailModal = function() {
  const modal = document.getElementById('skill-detail-modal');
  if (modal) modal.style.display = 'none';
};

// Close modal on backdrop click
document.addEventListener('click', (e) => {
  const modal = document.getElementById('skill-detail-modal');
  if (e.target === modal) {
    closeSkillDetailModal();
  }
});


// ==================== END OF SKILLS SECTION ====================





// ========== TRAINING SECTION ==========
// ========== TRAINING SECTION ==========
// ========== TRAINING SECTION ==========
// ========== TRAINING SECTION ==========
// ========== TRAINING SECTION ==========
function buildTrainingSection(player) {
    const hasTraining = player.training || player.trained_stats || player.training_level;

    if (!hasTraining && !player.rank) {
        return '';
    }

    const trainingLevels = [
        { level: 1, xp: 100, boost: '+1' },
        { level: 2, xp: 250, boost: '+2' },
        { level: 3, xp: 500, boost: '+3' },
        { level: 4, xp: 1000, boost: '+4' },
        { level: 5, xp: 2000, boost: '+5' },
    ];

    const currentLevel = player.training_level || 0;
    const currentXP = player.training_xp || 0;
    const maxLevel = 5;

    const nextLevel = trainingLevels[currentLevel] || trainingLevels[trainingLevels.length - 1];
    const progressPercent = currentLevel >= maxLevel ? 100 : Math.min((currentXP / nextLevel.xp) * 100, 100);

    return `
        <div style="
            background: var(--color-graphite-800, #ab1111);
            border: 1px solid rgba(0,194,168,0.2);
            border-radius: var(--radius-lg, 12px);
            padding: 24px;
            box-shadow: var(--shadow-md);
        ">
            <h3 style="
                font-size: 16px;
                font-weight: 800;
                color: var(--color-text-primary, #E6EEF2);
                margin: 0 0 20px 0;
                text-transform: uppercase;
                font-family: var(--font-family-base);
                letter-spacing: 0.5px;
                display: flex;
                align-items: center;
                gap: 10px;
            ">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
                Training Progress
            </h3>

            <div style="
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: var(--radius-base, 8px);
                padding: 18px;
                margin-bottom: 16px;
            ">
                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 14px;">
                    <div style="
                        background: var(--color-teal-500, #00C2A8);
                        color: var(--color-graphite-900, #0E1114);
                        width: 56px;
                        height: 56px;
                        border-radius: 50%;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 4px 14px rgba(0,194,168,0.4);
                        font-family: var(--font-family-base);
                    ">
                        <span style="font-size: 26px; font-weight: 900; line-height: 1;">${currentLevel}</span>
                        <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; opacity: 0.8;">LVL</span>
                    </div>
                    <div style="flex: 1;">
                        <div style="
                            background: rgba(255,255,255,0.08);
                            height: 10px;
                            border-radius: 5px;
                            overflow: hidden;
                            margin-bottom: 8px;
                        ">
                            <div style="
                                background: var(--color-teal-500, #00C2A8);
                                width: ${progressPercent}%;
                                height: 100%;
                                border-radius: 5px;
                                transition: width 0.5s ease;
                                box-shadow: 0 0 10px rgba(0,194,168,0.6);
                            "></div>
                        </div>
                        <div style="
                            font-size: 13px;
                            color: var(--color-text-muted, #98A0A6);
                            font-weight: 600;
                            font-family: var(--font-family-base);
                        ">
                            ${currentLevel >= maxLevel ?
                                '<span style="color: var(--color-status-success, #3BD671); font-weight: 800;">MAX LEVEL</span>' :
                                `${currentXP} / ${nextLevel.xp} XP`
                            }
                        </div>
                    </div>
                </div>
            </div>

            <div style="display: flex; gap: 8px; margin-bottom: 18px;">
                ${trainingLevels.map((lvl, idx) => `
                    <div style="
                        flex: 1;
                        height: 8px;
                        background: ${idx < currentLevel ? 'var(--color-status-success, #3BD671)' : idx === currentLevel ? 'var(--color-teal-500, #00C2A8)' : 'rgba(255,255,255,0.08)'};
                        border-radius: 4px;
                        transition: all 0.3s;
                        box-shadow: ${idx === currentLevel ? '0 0 10px rgba(0,194,168,0.6)' : 'none'};
                    "></div>
                `).join('')}
            </div>

            ${player.trained_stats ? `
                <div style="
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: var(--radius-base, 8px);
                    padding: 16px;
                ">
                    <h4 style="
                        font-size: 12px;
                        font-weight: 700;
                        color: var(--color-text-muted, #98A0A6);
                        margin: 0 0 12px 0;
                        text-transform: uppercase;
                        font-family: var(--font-family-base);
                        letter-spacing: 0.5px;
                    ">Stat Boosts</h4>
                    <div style="display: grid; gap: 10px;">
                        ${Object.entries(player.trained_stats).map(([stat, boost]) => `
                            <div style="
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                padding: 10px 14px;
                                background: rgba(0,194,168,0.05);
                                border-radius: 7px;
                                border-left: 3px solid var(--color-teal-500, #00C2A8);
                            ">
                                <span style="
                                    font-size: 13px;
                                    color: var(--color-text-primary, #E6EEF2);
                                    font-weight: 600;
                                    font-family: var(--font-family-base);
                                    text-transform: capitalize;
                                ">${stat.replace(/_/g, ' ')}</span>
                                <span style="
                                    background: var(--color-teal-500, #00C2A8);
                                    color: var(--color-graphite-900, #0E1114);
                                    padding: 5px 12px;
                                    border-radius: 6px;
                                    font-size: 14px;
                                    font-weight: 800;
                                    font-family: var(--font-family-base);
                                    box-shadow: 0 2px 8px rgba(0,194,168,0.3);
                                ">+${boost}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

// ========== RANK SELECTION SECTION ==========
function buildRankSelectionSection(player) {
    const currentRank = player.rank || 0;
    const skillPoints = RANK_CONFIG.skillPoints[currentRank] || 0;
    
    const rankCardsHtml = [1, 2, 3, 4, 5].map(rankNum => {
        const isSelected = currentRank === rankNum;
        const spriteUrl = RANK_CONFIG.ranks[rankNum];
        const rankColor = RANK_CONFIG.rankColors[rankNum];
        const uniqueId = `rank-selector-${rankNum}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        
        // Perfect scaling: 70px icon size, 32px original frame = 2.1875x scale
        const iconSize = 56;
        const spriteSheetSize = 192 * (iconSize / 32); // 420px
        
        return `
            <div class="rank-card ${isSelected ? 'selected' : ''}" 
                 data-rank="${rankNum}"
                 onclick="window.selectPlayerRank('${player.player_id}', ${rankNum})"
                 style="
                    position: relative;
                    background: rgba(255,255,255,0.03);
                    border: 2px solid ${isSelected ? 
                        (rankNum === 1 ? 'rgba(59,214,113,0.4)' :   /* Green soft */
                        rankNum === 2 ? 'rgba(99,102,241,0.4)' :   /* Blue soft */
                        rankNum === 3 ? 'rgba(139,92,246,0.4)' :   /* Purple soft */
                        rankNum === 4 ? 'rgba(255,184,107,0.4)' :  /* Gold soft */
                        'rgba(255,107,107,0.4)') :                 /* Red soft */
                        'rgba(255,255,255,0.08)'};
                    border-radius: 14px;
                    padding: 16px 12px;
                    cursor: pointer;
                    transition: border-color 0.2s ease, box-shadow 0.2s ease;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    box-shadow: ${isSelected ? `0 0 20px ${rankColor}50` : 'none'};
                    min-width: 40px;
                    min-height: 70px;
                ">
                <!-- BIGGER Rank Number -->
                <div style="
                    font-size: 16px;
                    font-weight: 800;
                    color: ${rankColor};
                    font-family: var(--font-family-base);
                    line-height: 1;
                ">${rankNum}</div>
                
                <!-- PERFECT 70px Icon -->
                <div class="rank-selector-icon animated-rank-icon"
                     id="${uniqueId}"
                     data-rank="${rankNum}"
                     data-icon-size="${iconSize}"
                     style="
                        width: ${iconSize}px;
                        height: ${iconSize}px;
                        background-image: url('${spriteUrl}');
                        background-size: ${spriteSheetSize}px ${spriteSheetSize}px;
                        background-position: 0px 0px;
                        background-repeat: no-repeat;
                        display: block;
                        flex-shrink: 0;
                        image-rendering: pixelated;
                        filter: ${isSelected ? 'drop-shadow(0 0 8px ' + rankColor + ')' : 'none'};
                     ">
                </div>
                
                ${isSelected ? `
                    <div style="
                        position: absolute;
                        top: 4px;
                        right: 4px;
                        background: ${rankColor};
                        width: 20px;
                        height: 20px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 12px;
                        font-weight: 900;
                        color: #0E1114;
                        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
                    ">✓</div>
                ` : ''}
            </div>
        `;
    }).join('');
    
    return `
        <div style="
            background: var(--color-graphite-800, #14181C);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: var(--radius-lg, 12px);
            padding: 6px;
            margin-top: 20px;
            max-width: 566px;
        ">
            <!-- Title -->
            <div style="
                font-size: 16px;
                font-weight: 800;
                color: var(--color-text-primary, #E6EEF2);
                margin: 0 0 18px 0;
                text-transform: uppercase;
                font-family: var(--font-family-base);
                letter-spacing: 0.5px;
                display: flex;
                align-items: center;
                gap: 10px;
            ">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                Select Rank
            </div>
            
            <!-- Perfect 5-Column Grid -->
            <div class="rank-cards-grid" style="
                display: grid;
                grid-template-columns: repeat(5, 1fr);
                gap: 14px;
                margin-bottom: 16px;
                justify-items: center;
            ">
                ${rankCardsHtml}
            </div>
            
            <!-- Subtle Skill Points -->
            <!-- Training Level Selector -->
            <div style="
                background: rgba(20, 24, 28);
                border: 1px solid rgba(0,194,168,0.12);
                border-radius: 10px;
                padding: 16px;
            ">
                <!-- Header with Points -->
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                ">
                    <div style="
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    ">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal-500, #00C2A8)" stroke-width="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                            <path d="M2 17l10 5 10-5"></path>
                            <path d="M2 12l10 5 10-5"></path>
                        </svg>
                        <span style="
                            font-size: 13px;
                            font-weight: 700;
                            color: var(--color-text-primary, #E6EEF2);
                            text-transform: uppercase;
                            letter-spacing: 0.3px;
                        ">Training Level</span>
                    </div>
                    <div style="
                        background: rgba(0,194,168,0.15);
                        padding: 6px 12px;
                        border-radius: 6px;
                        font-size: 11px;
                        font-weight: 700;
                        color: var(--color-teal-500, #00C2A8);
                    ">
                        Points: ${skillPoints}
                    </div>
                </div>
                
                <!-- Training Level Dropdown -->
                <div style="position: relative;">
                    <select 
                        id="training-level-${player.player_id}"
                        onchange="window.setPlayerTrainingLevel('${player.player_id}', this.value)"
                        style="
                            width: 100%;
                            background: var(--color-graphite-800, #14181C);
                            border: 2px solid rgba(0,194,168,0.2);
                            border-radius: 8px;
                            padding: 12px 16px;
                            font-size: 14px;
                            font-weight: 600;
                            color: var(--color-text-primary, #E6EEF2);
                            font-family: var(--font-family-base);
                            cursor: pointer;
                            transition: all 0.2s ease;
                            appearance: none;
                            background-image: url('data:image/svg+xml;charset=UTF-8,%3csvg width=%2712%27 height=%278%27 viewBox=%270 0 12 8%27 fill=%27none%27 xmlns=%27http://www.w3.org/2000/svg%27%3e%3cpath d=%27M1 1.5L6 6.5L11 1.5%27 stroke=%27%2300C2A8%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27/%3e%3c/svg%3e');
                            background-repeat: no-repeat;
                            background-position: right 16px center;
                            padding-right: 40px;
                        "
                        onfocus="this.style.borderColor='var(--color-teal-500, #00C2A8)'; this.style.boxShadow='0 0 0 3px rgba(0,194,168,0.1)';"
                        onblur="this.style.borderColor='rgba(0,194,168,0.2)'; this.style.boxShadow='none';"
                    >
                        <option value="0" ${(player.training_level || 0) === 0 ? 'selected' : ''}>No Training</option>
                        ${Array.from({length: 30}, (_, i) => i + 1).map(level => `
                            <option value="${level}" ${(player.training_level || 0) === level ? 'selected' : ''}>
                                Level ${level} ${level === 30 ? '(MAX)' : ''}
                            </option>
                        `).join('')}
                    </select>
                </div>
                
                <!-- Training Info -->
                ${(player.training_level || 0) > 0 ? `
                    <div style="
                        margin-top: 12px;
                        padding: 10px;
                        background: rgba(59,214,113,0.08);
                        border: 1px solid rgba(59,214,113,0.15);
                        border-radius: 6px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    ">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3BD671" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span style="
                            font-size: 12px;
                            color: #3BD671;
                            font-weight: 600;
                        ">Training Level ${player.training_level || 0} Active</span>
                    </div>
                ` : ''}
            </div>

        </div>
    `;
}




// ========== RANK SELECTION HANDLER ==========
// ==================== TRACK VISITED RANKS ====================
const visitedRanks = new Set();

window.selectPlayerRank = async function(playerId, rankNumber) {
  console.log('[RANK] Selecting rank', rankNumber, 'for player', playerId);
  
  if (state.selectedPlayer && String(state.selectedPlayer.player_id) === String(playerId)) {
    const previousRank = state.selectedPlayer.rank || 0;
    const rankKey = `${playerId}_${rankNumber}`;
    
    // Check if this is a new rank selection
    const isNewRankSelection = previousRank !== rankNumber;
    const isFirstVisit = !visitedRanks.has(rankKey);
    
    if (!isNewRankSelection) {
      console.log('[RANK] Same rank selected, no action needed');
      return;
    }
    
    cleanupRankAnimations();
    
    try {
      // ✅ Only reset if switching to a NEW rank for the first time
      if (isNewRankSelection && isFirstVisit) {
        console.log('[RANK] First visit to rank', rankNumber, '- Resetting skills');
        
        try {
          await window.apiClient.resetSkills(CURRENT_USER_ID, playerId, rankNumber);
          visitedRanks.add(rankKey); // Mark as visited
          console.log('[RANK] Skills reset for rank', rankNumber);
        } catch (resetError) {
          console.warn('[RANK] Reset failed (might be empty):', resetError);
        }
      } else {
        console.log('[RANK] Returning to rank', rankNumber, '- Loading saved allocations');
      }
      
      // Fetch player data for new rank
      const resp = await window.apiClient.getPlayerDetails(playerId, rankNumber);
      
      const updatedPlayer = {
        ...state.selectedPlayer,
        ...resp.player,
        rank: rankNumber,
        skills: resp.skills,
        available_skill_points: resp.available_skill_points
      };
      
      state.selectedPlayer = updatedPlayer;
      renderPlayerDetail(updatedPlayer);
      
      console.log('[RANK] Switched from rank', previousRank, 'to rank', rankNumber);
      
      // Show notification
      if (typeof showToast === 'function') {
        const message = isFirstVisit 
          ? `📊 Rank ${rankNumber} - Fresh start` 
          : `📊 Rank ${rankNumber} - Loaded saved skills`;
        showToast(message, 'info');
      }
      
    } catch (error) {
      console.error('[RANK] Error switching rank:', error);
      state.selectedPlayer.rank = rankNumber;
      renderPlayerDetail(state.selectedPlayer);
      
      if (typeof showToast === 'function') {
        showToast(`❌ Error: ${error.message}`, 'error');
      }
    }
  } else {
    console.error('[RANK] Player ID mismatch or no selected player');
  }
};





// ========== FETCH TRAINING BOOSTS FROM VPS DATABASE ==========
async function getTrainingBoosts(position, trainingLevel) {
    if (!window.apiClient || trainingLevel === 0) {
        return null; // No boosts at level 0
    }
    
    try {
        console.log('[TRAINING] Fetching boosts for', position, 'at level', trainingLevel);
        
        // Call backend API which queries VPS PostgreSQL
        const response = await window.apiClient.getTrainingBoosts(position, trainingLevel);
        
        if (!response || response.error) {
            console.error('[TRAINING] Error from API:', response?.error);
            return null;
        }
        
        console.log('[TRAINING] Total boosts calculated:', response.boosts);
        return response.boosts;
        
    } catch (err) {
        console.error('[TRAINING] Exception fetching boosts:', err);
        return null;
    }
}





// ========== TRAINING LEVEL HANDLER ==========
// TRAINING LEVEL HANDLER (Enhanced with stat calculation)
window.setPlayerTrainingLevel = async function(playerId, level) {
    const trainingLevel = parseInt(level);
    console.log('[TRAINING] Setting level', trainingLevel, 'for player', playerId);
    
    // Update state
    if (state.selectedPlayer && String(state.selectedPlayer.player_id) === String(playerId)) {
        
        // Fetch training boosts from database
        const boosts = await getTrainingBoosts(state.selectedPlayer.position, trainingLevel);
        
        // Update player's training level
        state.selectedPlayer.training_level = trainingLevel;
        
        // Store the boosts in the player object for rendering
        if (boosts) {
            state.selectedPlayer.training_boosts = boosts;
            console.log('[TRAINING] Applied boosts:', boosts);
        } else {
            state.selectedPlayer.training_boosts = null;
        }
        
        // Clean up old animations
        cleanupRankAnimations();
        
        // Re-render player detail with updated stats
        renderPlayerDetail(state.selectedPlayer);
        
        console.log('[TRAINING] Updated to level', trainingLevel);
        
        // Show toast notification
        if (typeof showToast === 'function') {
            if (trainingLevel === 0) {
                showToast('Training removed', 'info');
            } else if (trainingLevel === 30) {
                showToast('MAX Training Level achieved! 🎉', 'success');
            } else {
                showToast(`Training Level ${trainingLevel} selected`, 'success');
            }
        }
        
        // Optional: Save to backend
        if (window.apiClient && typeof window.apiClient.updatePlayerTraining === 'function') {
            window.apiClient.updatePlayerTraining(playerId, trainingLevel);
        }
        
    } else {
        console.error('[TRAINING] Player ID mismatch or no selected player');
    }
};




// Application State
// Application State
const state = {
    currentView: localStorage.getItem('currentView') || 'dashboard',
    watchlist: (function() {
        try {
            const val = localStorage.getItem('watchlist');
            if (!val || val === "[object Object]") return [];
            return JSON.parse(val);
        } catch(e) { return []; }
    })(),
    selectedPlayer: null,
    filters: {
        position: '',
        ratingMin: 40,
        ratingMax: 150,
        priceMin: null,
        priceMax: null,
        league: '',
        club: '',
        nation: '',
        skillMoves: '',
        event: ''
    },
    searchQuery: '',
    sortBy: 'ovr',  // Changed default to 'ovr'
    sortDirection: 'desc',
    previousSortBy: null,
    // ========== API Integration Properties ==========
    allPlayers: [],
    filteredPlayers: [],
    isLoadingAPI: false,
    apiRank: 0,
    // ========== PAGINATION ==========
    currentOffset: 0,
    limitPerPage: 20,
    totalPlayers: 0,
    hasMorePlayers: false,
    // ========== SEARCH STATE ==========
    searchResults: [],
    searchDisplayed: 0,
    currentSearchQuery: '',
    searchTotalResults: 0
};



// ================== COUNTRY LIST ==================
const COUNTRIES = [
  "Bangladesh","Indonesia","Venezuela","Cameroon","Czech Republic","Sweden","Montenegro","Uganda","Jordan",
  "Dominican Republic","Singapore","Sri Lanka","Korea DPR","Uzbekistan","Finland","Portugal","Malta","Colombia",
  "Albania","Wales","Cayman Islands","Grenada","Ukraine","Saudi Arabia","Cuba","Latvia","Northern Ireland","Algeria",
  "France","Slovakia","Israel","Syria","Malaysia","Kenya","Ghana","Senegal","Zambia","Central African Rep.","Iceland",
  "Madagascar","Hong Kong","Sierra Leone","Liberia","Philippines","Antigua & Barbuda","Benin","United States",
  "Cyprus","Guinea","Korea Republic","Nigeria","Rwanda","Bosnia Herzegovina","Tajikistan","Zimbabwe","Comoros",
  "New Caledonia","Belarus","Armenia","Qatar","Scotland","Netherlands","Gabon","Paraguay","Australia","Dominica",
  "Serbia","Angola","Libya","Vanuatu","Bahrain","Netherlands Antilles","Spain","Congo","United Arab Emirates",
  "Georgia","Malawi","Belgium","Burundi","Montserrat","Thailand","DR Congo","Togo","Burkina Faso","El Salvador",
  "Faroe Islands","Italy","Uruguay","Fiji","Germany","Canada","Barbados","Bermuda","Namibia","Argentina",
  "Liechtenstein","England","Azerbaijan","Slovenia","Greece","Egypt","Afghanistan","Republic of Ireland","Chad",
  "Puerto Rico","India","International","Iran","Chile","Gambia","Estonia","Suriname","South Africa","Peru",
  "Kazakhstan","British Virgin Isles","St Kitts Nevis","Kosovo","Japan","Denmark","Ivory Coast","Jamaica","Iraq",
  "China PR","Mauritania","Mozambique","Switzerland","Guinea Bissau","Ecuador","New Zealand","Hungary","Russia",
  "Belize","Honduras","Norway","Pakistan","Romania","Brazil","Chinese Taipei","Trinidad & Tobago","Austria",
  "Luxemburg","Guatemala","Bolivia","São Tomé & Príncipe","Niger","Panama","South Sudan","Yemen","Lithuania",
  "Bulgaria","Croatia","Cape Verde Islands","Tunisia","Sudan","Mali","North Macedonia","Morocco","Moldova",
  "Türkiye","Mexico","Nepal","Guyana","Palestine","Tanzania","Poland","Lebanon","Costa Rica","St Lucia",
  "Gibraltar","Haiti","Equatorial Guinea","Andorra","Somalia"
];

function enableKeyboardNavigation({
  input,
  list,
  onSelect
}) {
  let activeIndex = -1;

  input.addEventListener('keydown', (e) => {
    const items = list.querySelectorAll('.autocomplete-item');
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, items.length - 1);
      update();
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      update();
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0) {
        onSelect(items[activeIndex]);
      }
    }

    if (e.key === 'Escape') {
      list.innerHTML = '';
      activeIndex = -1;
    }
  });

  function update() {
    itemsClear();
    const items = list.querySelectorAll('.autocomplete-item');
    if (items[activeIndex]) {
      items[activeIndex].classList.add('active');
      items[activeIndex].scrollIntoView({ block: 'nearest' });
    }
  }

  function itemsClear() {
    list.querySelectorAll('.autocomplete-item')
      .forEach(i => i.classList.remove('active'));
  }
}


// View Switching

// View Switching
function switchView(viewName) {
  // Hide all views
  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active');
    view.style.display = '';
    view.style.opacity = '';
  });

  // ADDED: Close all modals when switching views
  const squadModal = document.getElementById('squad-builder-modal');
  if (squadModal) {
    squadModal.style.display = 'none';
  }

  const toolsModal = document.getElementById('tools-modal');
  if (toolsModal) {
    toolsModal.classList.remove('active');
  }

  const toolsSheet = document.getElementById('tools-sheet');
  if (toolsSheet) {
    toolsSheet.classList.remove('active');
  }

  // Reset body overflow
  document.body.style.overflow = 'auto';

  // Make setSortBy globally accessible
  window.setSortBy = function (stat) {
    // Toggle sort direction if clicking the same stat
    if (state.previousSortBy === stat) {
      state.sortDirection = state.sortDirection === 'desc' ? 'asc' : 'desc';
    } else {
      state.sortDirection = 'desc';
      state.previousSortBy = stat;
    }

    state.sortBy = stat;

    if (state.currentView === 'database') {
      loadDatabase();
    }
    if (state.currentView === 'watchlist') {
      loadWatchlist();
    }

  };

  // Show selected view
  const targetView = document.getElementById(`${viewName}-view`);
  if (targetView) targetView.classList.add('active');

  // Update nav links
  document.querySelectorAll('.nav-link, .mobile-nav-btn').forEach(link => {
    link.classList.remove('active');
  });
  document.querySelectorAll(`[data-view="${viewName}"]`).forEach(link => {
    link.classList.add('active');
  });

  state.currentView = viewName;
  localStorage.setItem('currentView', viewName);

  // ===== SLIDER VISIBILITY CONTROL =====
  const slider = document.querySelector('.slider');
  if (slider) {
    if (viewName === 'dashboard') {
      slider.style.display = 'block';
    } else {
      slider.style.display = 'none';
    }
  }
  // ===== END SLIDER CONTROL =====

  // Load view-specific content
  if (viewName === 'dashboard') {
    loadDashboard();
  } else if (viewName === 'database') {
    loadDatabase();
  } else if (viewName === 'market') {
    // loadMarket(); // Uncomment when ready
  } else if (viewName === 'watchlist') {
    loadWatchlist(); // Uncomment when ready
  }

  // Scroll to top
  window.scrollTo(0, 0);
}

function getCountryFlagUrl(country) {
  const map = {
    "Afghanistan": "af",
    "Albania": "al",
    "Algeria": "dz",
    "Andorra": "ad",
    "Angola": "ao",
    "Antigua & Barbuda": "ag",
    "Argentina": "ar",
    "Armenia": "am",
    "Australia": "au",
    "Austria": "at",
    "Azerbaijan": "az",

    "Bangladesh": "bd",
    "Barbados": "bb",
    "Belarus": "by",
    "Belgium": "be",
    "Belize": "bz",
    "Benin": "bj",
    "Bermuda": "bm",
    "Bolivia": "bo",
    "Bosnia Herzegovina": "ba",
    "Brazil": "br",
    "British Virgin Isles": "vg",
    "Bulgaria": "bg",
    "Burkina Faso": "bf",
    "Burundi": "bi",

    "Cameroon": "cm",
    "Canada": "ca",
    "Cape Verde Islands": "cv",
    "Cayman Islands": "ky",
    "Central African Rep.": "cf",
    "Chad": "td",
    "Chile": "cl",
    "China PR": "cn",
    "Chinese Taipei": "tw",
    "Colombia": "co",
    "Comoros": "km",
    "Congo": "cg",
    "Costa Rica": "cr",
    "Croatia": "hr",
    "Cuba": "cu",
    "Cyprus": "cy",
    "Czech Republic": "cz",

    "Denmark": "dk",
    "Dominica": "dm",
    "Dominican Republic": "do",
    "DR Congo": "cd",

    "Ecuador": "ec",
    "Egypt": "eg",
    "El Salvador": "sv",
    "England": "gb-eng",
    "Equatorial Guinea": "gq",
    "Estonia": "ee",

    "Faroe Islands": "fo",
    "Fiji": "fj",
    "Finland": "fi",
    "France": "fr",

    "Gabon": "ga",
    "Gambia": "gm",
    "Georgia": "ge",
    "Germany": "de",
    "Ghana": "gh",
    "Gibraltar": "gi",
    "Greece": "gr",
    "Grenada": "gd",
    "Guatemala": "gt",
    "Guinea": "gn",
    "Guinea Bissau": "gw",
    "Guyana": "gy",

    "Haiti": "ht",
    "Honduras": "hn",
    "Hong Kong": "hk",
    "Hungary": "hu",

    "Iceland": "is",
    "India": "in",
    "Indonesia": "id",
    "International": "",
    "Iran": "ir",
    "Iraq": "iq",
    "Israel": "il",
    "Italy": "it",
    "Ivory Coast": "ci",

    "Jamaica": "jm",
    "Japan": "jp",
    "Jordan": "jo",

    "Kazakhstan": "kz",
    "Kenya": "ke",
    "Korea DPR": "kp",
    "Korea Republic": "kr",
    "Kosovo": "xk",

    "Latvia": "lv",
    "Lebanon": "lb",
    "Liberia": "lr",
    "Libya": "ly",
    "Liechtenstein": "li",
    "Lithuania": "lt",
    "Luxemburg": "lu",

    "Madagascar": "mg",
    "Malawi": "mw",
    "Malaysia": "my",
    "Mali": "ml",
    "Malta": "mt",
    "Mauritania": "mr",
    "Mexico": "mx",
    "Moldova": "md",
    "Montenegro": "me",
    "Morocco": "ma",
    "Mozambique": "mz",

    "Namibia": "na",
    "Nepal": "np",
    "Netherlands": "nl",
    "Netherlands Antilles": "an",
    "New Caledonia": "nc",
    "New Zealand": "nz",
    "Niger": "ne",
    "Nigeria": "ng",
    "North Macedonia": "mk",
    "Northern Ireland": "gb-nir",
    "Norway": "no",

    "Pakistan": "pk",
    "Palestine": "ps",
    "Panama": "pa",
    "Paraguay": "py",
    "Peru": "pe",
    "Philippines": "ph",
    "Poland": "pl",
    "Portugal": "pt",
    "Puerto Rico": "pr",

    "Qatar": "qa",

    "Republic of Ireland": "ie",
    "Romania": "ro",
    "Russia": "ru",
    "Rwanda": "rw",

    "Saudi Arabia": "sa",
    "Scotland": "gb-sct",
    "Senegal": "sn",
    "Serbia": "rs",
    "Sierra Leone": "sl",
    "Singapore": "sg",
    "Slovakia": "sk",
    "Slovenia": "si",
    "Somalia": "so",
    "South Africa": "za",
    "South Sudan": "ss",
    "Spain": "es",
    "Sri Lanka": "lk",
    "St Kitts Nevis": "kn",
    "St Lucia": "lc",
    "Sudan": "sd",
    "Suriname": "sr",
    "Sweden": "se",
    "Switzerland": "ch",
    "Syria": "sy",

    "Tajikistan": "tj",
    "Tanzania": "tz",
    "Thailand": "th",
    "Togo": "tg",
    "Trinidad & Tobago": "tt",
    "Tunisia": "tn",
    "Türkiye": "tr",

    "Uganda": "ug",
    "Ukraine": "ua",
    "United Arab Emirates": "ae",
    "United States": "us",
    "Uruguay": "uy",
    "Uzbekistan": "uz",

    "Vanuatu": "vu",
    "Venezuela": "ve",
    "Vietnam": "vn",

    "Wales": "gb-wls",

    "Yemen": "ye",
    "Zambia": "zm",
    "Zimbabwe": "zw"
  };


  const code = map[country];
  if (!code) return "";

  return `https://flagcdn.com/w20/${code}.png`;
}




function initCountryAutocomplete(inputId, listId) {
  const input = document.getElementById(inputId);
  const list = document.getElementById(listId);
  const flagImg = inputId.includes('mobile')
  ? document.getElementById('mobile-filter-nation-flag')
  : document.getElementById('filter-nation-flag');


  if (!input || !list || !flagImg) {
    console.warn("[NATION] Missing input, list, or flag image");
    return;
  }

  function render(items) {
    list.innerHTML = '';
    items.forEach(country => {
      const div = document.createElement('div');
      div.className = 'autocomplete-item';

      const flagUrl = getCountryFlagUrl(country);

      div.innerHTML = `
        ${flagUrl ? `<img src="${flagUrl}" class="autocomplete-flag" />` : `<span class="autocomplete-flag placeholder"></span>`}
        <span class="autocomplete-text">${country}</span>
      `;


      div.addEventListener('mousedown', (e) => {
        e.preventDefault(); // 🔥 IMPORTANT

        input.value = country;
        list.innerHTML = '';

        // ✅ update filter state explicitly
        state.filters.nation = country;

        // ✅ set flag
        const flagUrl = getCountryFlagUrl(country);
        if (flagUrl) {
          flagImg.src = flagUrl;
          flagImg.style.display = 'block';
        } else {
          flagImg.style.display = 'none';
        }

        // ✅ reload database deterministically
        state.currentOffset = 0;
        if (state.currentView === 'database') {
          loadDatabase();
        }
        if (state.currentView === 'watchlist') {
          loadWatchlist();
        }

      });


      list.appendChild(div);
    });
  }

  function selectCountry(country) {
    input.value = country;
    list.innerHTML = '';

    // update filter state
    state.filters.nation = country;

    // set flag
    const flagUrl = getCountryFlagUrl(country);
    if (flagUrl) {
      flagImg.src = flagUrl;
      flagImg.style.display = 'block';
    } else {
      flagImg.style.display = 'none';
    }

    // reload database
    state.currentOffset = 0;
    if (state.currentView === 'database') {
      loadDatabase();
    }
    if (state.currentView === 'watchlist') {
      loadWatchlist();
    }

  }


  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();

    if (!q) {
      flagImg.style.display = 'none';
      flagImg.src = '';
    }

    const matches = q
      ? COUNTRIES.filter(c => c.toLowerCase().includes(q)).slice(0, 40)
      : COUNTRIES.slice(0, 30);

    render(matches);
  });

  enableKeyboardNavigation({
    input,
    list,
    onSelect: (item) => {
      const country = item.querySelector('.autocomplete-text').innerText;
      selectCountry(country);
    }
  });


  document.addEventListener('click', e => {
    if (!input.contains(e.target) && !list.contains(e.target)) {
      list.innerHTML = '';
    }
  });
}




// ========== LOAD DASHBOARD FROM API ==========
async function loadDashboard() {
    console.log('[DASHBOARD] Loading dashboard...');

    // Initialize banner
    if (typeof initBannerSlider === 'function') {
        initBannerSlider();
    }

    // Load stats
    if (window.apiClient) {
        try {
            const health = await window.apiClient.checkHealth();
            const totalEl = document.getElementById('total-players');
            if (totalEl && health.total_players) {
                animateNumber('total-players', health.total_players);
            }
        } catch (error) {
            console.error('[DASHBOARD] Error loading stats:', error);
        }
    }


    // Load Latest and Trending
    await Promise.all([
        loadLatestPlayers(),
        loadTrendingPlayers()
    ]);

    // Search initialization moved to DOMContentLoaded (dropdown version)
    console.log('[DASHBOARD] Search initialized');

}


// ========== CREATE DASHBOARD PLAYER CARD (Vertical Style) ==========
// ========== DASHBOARD CARD CREATOR ==========
function createDashboardPlayerCard(player) {
    const card = document.createElement('div');
    card.className = 'dashboard-player-card';

    card.addEventListener('click', () => {
        if (typeof viewPlayerDetail === 'function') {
            viewPlayerDetail(player.player_id, player);
        } else {
            console.log('Clicked player:', player.name, 'ID:', player.player_id);
        }
    });

    card.innerHTML = `
        <div class="card-container">
            <img src="${player.card_background || 'https://via.placeholder.com/300x400'}"
                 alt="Card Background"
                 class="card-background-img"
                 onerror="this.src='https://via.placeholder.com/300x400'">

            <img src="${player.player_image || 'https://via.placeholder.com/200x300'}"
                 alt="${player.name}"
                 class="player-image-img"
                 onerror="this.src='https://via.placeholder.com/200x300'">

            <div class="card-ovr" style="color: ${player.color_rating || '#FFFFFF'}">
                ${player.ovr && player.ovr > 0 ? player.ovr : 'N/A'}
            </div>

            <div class="card-position" style="color: ${player.color_position || '#FFFFFF'}">
                ${player.position || 'N/A'}
            </div>

            <div class="card-player-name" style="color: ${player.color_name || '#FFFFFF'}">
                ${player.name}
            </div>

            <img src="${player.nation_flag || ''}"
                 alt="Nation"
                 class="card-nation-flag"
                 onerror="this.style.display='none'">

            <img src="${player.club_flag || ''}"
                 alt="Club"
                 class="card-club-flag"
                 onerror="this.style.display='none'">
        </div>
    `;

    return card;
}


// ========== LATEST PLAYERS ==========
async function loadLatestPlayers() {
    console.log('[LATEST] Loading latest players...');

    const players = await loadPlayersFromAPI({
        limit: 100,  // Increased from 50
        rank: 0
    });

    if (players.length === 0) {
        console.warn('[LATEST] No players received from API');
        return;
    }

    console.log(`[LATEST] Received ${players.length} players from API`);

    // Sort by date_added (newest first)
    const sortedPlayers = players.sort((a, b) => {
        const dateA = new Date(a.date_added || 0);
        const dateB = new Date(b.date_added || 0);
        return dateB - dateA;
    });

    // Don't filter by OVR - show all latest players
    const validPlayers = sortedPlayers.filter(p => p.name && p.ovr && p.ovr > 0);

    const container = document.getElementById('latest-players-grid');
    if (!container) {
        console.error('[LATEST] Container #latest-players-grid not found in DOM');
        return;
    }

    container.innerHTML = '';

    // Show up to 12 latest players
    validPlayers.slice(0, 12).forEach(player => {
        const card = createDashboardPlayerCard(player);
        container.appendChild(card);
    });

    console.log(`[LATEST] Successfully displayed ${Math.min(validPlayers.length, 12)} latest players`);
}


// ========== TRENDING PLAYERS ==========
async function loadTrendingPlayers() {
    console.log('[TRENDING] Loading trending players...');

    const players = await loadPlayersFromAPI({
        limit: 50,
        min_ovr: 100,
        rank: 0
    });

    if (players.length === 0) {
        console.warn('[TRENDING] No players received');
        return;
    }

    // Sort by OVR (highest first)
    const sortedPlayers = players.sort((a, b) => (b.ovr || 0) - (a.ovr || 0));

    const container = document.getElementById('trending-players-grid');
    if (!container) {
        console.error('[TRENDING] Container not found');
        return;
    }

    container.innerHTML = '';

    sortedPlayers.slice(0, 12).forEach(player => {
        const card = createDashboardPlayerCard(player);
        container.appendChild(card);
    });

    console.log(`[TRENDING] Loaded ${sortedPlayers.length} trending players`);
}

// ========== SEARCH FUNCTIONALITY ==========

// ========== DASHBOARD SEARCH FUNCTIONALITY (WITH BATCHING) ==========

// ========== DASHBOARD SEARCH FUNCTIONALITY ==========

let searchTimeout = null;

async function searchDashboardPlayers(query) {
    const searchTerm = query.trim().toLowerCase();

    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }

    if (!searchTerm) {
        showNormalDashboard();
        return;
    }

    const searchSection = document.getElementById('dashboard-search-results');
    const resultsContainer = document.getElementById('search-results-container');
    const resultsCount = document.getElementById('search-results-count');

    if (searchSection && resultsContainer) {
        searchSection.style.display = 'block';
        resultsContainer.innerHTML = '<div class="search-loading">🔍 Searching...</div>';
        if (resultsCount) resultsCount.textContent = 'Searching...';

        const latestSection = document.querySelector('.dashboard-section:has(#latest-players-grid)');
        const trendingSection = document.querySelector('.dashboard-section:has(#trending-players-grid)');
        if (latestSection) latestSection.style.display = 'none';
        if (trendingSection) trendingSection.style.display = 'none';
    }

    searchTimeout = setTimeout(async () => {
        console.log(`[SEARCH] ========== SEARCHING FOR: "${searchTerm}" ==========`);

        try {
            // ✅ USE NEW FAST API - Load only 20 results
            const response = await window.apiClient.searchPlayers({
                q: searchTerm,
                limit: 20,
                offset: 0,
                rank: 0
            });

            const results = response.results || [];
            const total = response.total || 0;

            console.log(`[SEARCH] ✓ Got ${results.length} results (${total} total)`);

            // Store for pagination
            state.currentSearchQuery = searchTerm;
            state.searchTotalResults = total;

            showSearchResults(results, searchTerm, total);

        } catch (error) {
            console.error('[SEARCH] ✗ ERROR:', error);
            if (resultsContainer) {
                resultsContainer.innerHTML = `
                    <div class="no-results">
                        <p>❌ Search error: ${error.message}</p>
                    </div>
                `;
            }
        }
    }, 300);
}

function createSearchResultRow(player) {
    const row = document.createElement('div');
    row.className = 'search-result-row';

    // ===== DEBUG OVR ISSUE =====
    if (!player.ovr || player.ovr === 0) {
        console.warn(`[OVR DEBUG] Player has no OVR:`, {
            name: player.name,
            ovr: player.ovr,
            ovr_type: typeof player.ovr,
            player_id: player.player_id
        });
    }

    const isUntradableText = String(player.is_untradable || '').toLowerCase();
    const isNonAuctionable = isUntradableText === 'true' || isUntradableText === '1';

    const tradableIcon = isNonAuctionable ?
        `<span class="tradable-badge non-tradable">🔴 Non-auctionable</span>` :
        `<span class="tradable-badge tradable">✅ Auctionable</span>`;

    row.innerHTML = `
        <div class="search-result-card">
            <div class="search-card-image">
                <img src="${player.card_background || 'https://via.placeholder.com/100x140'}"
                     alt="${player.name}"
                     class="search-card-bg"
                     onerror="this.src='https://via.placeholder.com/100x140'">
                <img src="${player.player_image || ''}"
                     alt="${player.name}"
                     class="search-player-img"
                     onerror="this.style.display='none'">
            </div>

            <div class="search-player-info">
                <div class="search-player-name">${player.name || 'Unknown'}</div>
                ${tradableIcon}
            </div>

            <div class="search-player-stats">
                <div class="search-ovr">${player.ovr && player.ovr > 0 ? player.ovr : 'N/A'}</div>
                <div class="search-position">${player.position || 'N/A'}</div>
            </div>
        </div>
    `;

    row.addEventListener('click', () => {
        console.log('Clicked:', player);
    });

    return row;
}

function showSearchResults(players, query, total, append = false) {
    const searchSection = document.getElementById('dashboard-search-results');
    const resultsContainer = document.getElementById('search-results-container');
    const resultsCount = document.getElementById('search-results-count');

    if (!searchSection || !resultsContainer || !resultsCount) return;

    searchSection.style.display = 'block';

    // Clear container if not appending
    if (!append) {
        state.searchResults = players;
        state.searchDisplayed = players.length;
        resultsContainer.innerHTML = '';
        resultsCount.textContent = `${total} Result${total !== 1 ? 's' : ''}`;
    } else {
        state.searchResults = state.searchResults.concat(players);
        state.searchDisplayed += players.length;
    }

    if (total === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <p>No players found starting with "${query}"</p>
                <p style="color: var(--text-tertiary); font-size: 0.9rem;">Try a different search term</p>
            </div>
        `;
        return;
    }

    // Add player cards
    players.forEach(player => {
        const row = createSearchResultRow(player);
        resultsContainer.appendChild(row);
    });

    updateAllWatchlistButtons();


    // Remove old load more button if exists
    const oldLoadMore = document.getElementById('search-load-more-btn');
    if (oldLoadMore) oldLoadMore.remove();

    // Add "Load More" button if there are more results
    if (state.searchDisplayed < total) {
        const loadMoreBtn = document.createElement('button');
        loadMoreBtn.id = 'search-load-more-btn';
        loadMoreBtn.className = 'search-load-more-btn';
        loadMoreBtn.innerHTML = `
            <span>Load More</span>
            <span class="load-more-count">(${total - state.searchDisplayed} remaining)</span>
        `;
        loadMoreBtn.addEventListener('click', async () => {
            loadMoreBtn.disabled = true;
            loadMoreBtn.innerHTML = '<span>Loading...</span>';

            try {
                // Load next 20 results
                const response = await window.apiClient.searchPlayers({
                    q: state.currentSearchQuery,
                    limit: 20,
                    offset: state.searchDisplayed,
                    rank: 0
                });

                const moreResults = response.results || [];
                console.log(`[SEARCH] Loaded ${moreResults.length} more results`);

                showSearchResults(moreResults, state.currentSearchQuery, total, true);

            } catch (error) {
                console.error('[SEARCH] Load more error:', error);
                loadMoreBtn.innerHTML = '<span>Error - Try Again</span>';
                loadMoreBtn.disabled = false;
            }
        });
        resultsContainer.appendChild(loadMoreBtn);
    }

    console.log(`[SEARCH] Displayed ${state.searchDisplayed}/${total} results`);
}

// Show Normal Dashboard (Hide Search Results)
function showNormalDashboard() {
    // Show Latest and Trending sections
    const latestSection = document.querySelector('.dashboard-section:has(#latest-players-grid)');
    const trendingSection = document.querySelector('.dashboard-section:has(#trending-players-grid)');

    if (latestSection) latestSection.style.display = 'block';
    if (trendingSection) trendingSection.style.display = 'block';

    // Hide search results
    const searchSection = document.getElementById('dashboard-search-results');
    if (searchSection) searchSection.style.display = 'none';
}

function updateAllWatchlistButtons() {
  document.querySelectorAll('.player-row-watchlist').forEach(btn => {
    const uniqueId = btn.dataset.uniqueId;
    if (!uniqueId) return;

    const isActive = state.watchlist.includes(uniqueId);

    btn.classList.toggle('active', isActive);

    const svg = btn.querySelector('svg');
    if (svg) {
      svg.setAttribute('fill', isActive ? 'currentColor' : 'none');
    }
  });
}


// ========== WATCHLIST TOGGLE (REACTIVE) ==========
// In assets/js/app.js

window.toggleWatchlist = function (uniqueId) {
  if (!uniqueId) return;

  // 1. Manage the ID list (for the Heart Icon state)
  const index = state.watchlist.indexOf(uniqueId);
  let savedPlayers = JSON.parse(localStorage.getItem('watchlistPlayers')) || [];

  if (index === -1) {
    // === ADDING ===
    state.watchlist.push(uniqueId);

    // Find the actual player object from currently loaded lists
    const allAvailable = [
      ...(state.allPlayers || []), 
      ...(state.searchResults || []), 
      ...(state.filteredPlayers || []),
      ...(state.selectedPlayer ? [state.selectedPlayer] : [])  // Include currently viewed player
    ];

    // Helper to generate ID from a player object to match uniqueId
    const getPId = (p) => `${p.player_id}_${p.rank || 0}_${p.is_untradable ? 1 : 0}`;

    const playerObj = allAvailable.find(p => getPId(p) === uniqueId);

    if (playerObj) {
      // Check if already in savedPlayers to avoid duplicates
      if (!savedPlayers.some(p => getPId(p) === uniqueId)) {
        savedPlayers.push(playerObj);
      }
      if (typeof showToast === 'function') showToast('Added to watchlist');
    } else {
      console.warn('Could not find player data for', uniqueId);
    }

  } else {
    // === REMOVING ===
    state.watchlist.splice(index, 1);

    // Remove from saved players
    savedPlayers = savedPlayers.filter(p => {
      const pId = `${p.player_id}_${p.rank || 0}_${p.is_untradable ? 1 : 0}`;
      return pId !== uniqueId;
    });

    if (typeof showToast === 'function') showToast('Removed from watchlist');
  }

  // 2. Save both lists
  localStorage.setItem('watchlist', JSON.stringify(state.watchlist));        // IDs
  localStorage.setItem('watchlistPlayers', JSON.stringify(savedPlayers));   // Objects

  // 3. Update UI
  updateAllWatchlistButtons();

  if (state.currentView === 'watchlist') {
    loadWatchlist();
  }
};

// Helper: Format Price
function formatPrice(price) {
    if (!price || price === 0) return 'Free';

    // Billion
    if (price >= 1000000000) {
        return `${(price / 1000000000).toFixed(2)}B`;
    }
    // Million
    if (price >= 1000000) {
        return `${(price / 1000000).toFixed(2)}M`;
    }
    // Thousand
    if (price >= 1000) {
        return `${(price / 1000).toFixed(2)}K`;
    }

    return price.toLocaleString();
}


// ========== API HELPER FUNCTIONS ==========

function showLoadingIndicator(show = true) {
    const indicator = document.getElementById('loading-indicator');
    if (indicator) {
        indicator.style.display = show ? 'flex' : 'none';
    }
}

// Load Players from API (with better error handling)
async function loadPlayersFromAPI(options = {}) {
    if (!window.apiClient) {
        console.warn('[API] API client not available');
        return [];
    }

    try {
        state.isLoadingAPI = true;

        const params = {
            limit: options.limit || 50,
            offset: options.offset || 0,
            rank: options.rank !== undefined ? options.rank : 0
        };

        // Only add filters if they exist
        if (options.position) params.position = options.position;
        if (options.min_ovr) params.min_ovr = options.min_ovr;
        if (options.max_ovr) params.max_ovr = options.max_ovr;
        if (options.league) params.league = options.league;
        if (options.nation) params.nation = options.nation;

        console.log('[API] Requesting players with params:', params);

        const response = await window.apiClient.getPlayers(params);

        const players = response.players || [];
        console.log(`[API] Received ${players.length} players from database`);

        // Debug: Log first player to see structure
        if (players.length > 0) {
            console.log('[API] Sample player data:', players[0]);
        }

        return players;
    } catch (error) {
        console.error('[API] Error loading players:', error);
        return [];
    } finally {
        state.isLoadingAPI = false;
    }
}

function getInitials(name) {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

// Locate the createPlayerCard function in your app.js and replace it with this:

/**
 * Create a player row element for the Database/Watchlist views
 * Handles Supabase price integration with image fallbacks and 2-decimal formatting.
 * @param {Object} player - The player data object
 * @returns {HTMLElement} - The rendered player row
 */
function createPlayerCard(player) {
    const card = document.createElement('div');
    card.className = 'player-row';

    // 1. Metadata for filtering and sorting
    card.dataset.name = player.name;
    card.dataset.position = player.position || 'N/A';
    card.dataset.rating = player.ovr || 0;

    // 2. Create Unique ID for Watchlist (handles ranks and tradability)
    const uniqueId = `${player.player_id}_${player.rank || 0}_${player.is_untradable ? 1 : 0}`;
    const isWatchlisted = state.watchlist && state.watchlist.includes(uniqueId);

    // 3. Handle Secondary Positions mapping
    const secondaryPositions = {
        'RW': 'RM', 'LW': 'LM', 'ST': 'CF', 'CM': 'CAM',
        'CB': 'CDM', 'LB': 'LWB', 'RB': 'RWB'
    };
    const secondaryPosition = secondaryPositions[player.position] || '';

    // 4. ROBUST PRICE & IMAGE LOGIC
    let displayPriceHTML = '';

    if (player.price !== undefined && player.price !== null) {
        // If price exists, use formatPrice (which should now be set to .toFixed(2))
        const formattedPrice = typeof formatPrice === 'function' ? formatPrice(player.price) : player.price.toLocaleString();
        displayPriceHTML = `<span class="price-text">${formattedPrice}</span>`;
    } else {
        // If price is missing (N/A), show the non-auctionable image
        displayPriceHTML = `
            <img src="https://images-bucket.renderz.app/common_23_noauction"
                 alt="Non-auctionable"
                 style="height: 18px; width: auto; vertical-align: middle; opacity: 0.9;"
                 title="Non-auctionable">
        `;
    }

    // 5. Build HTML Structure
    card.innerHTML = `
        <div class="player-row-card">
            <div class="player-card-image-placeholder">
                ${player.player_image ?
                    `<img src="${player.player_image}" alt="${player.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <span class="player-initials" style="display: none;">${getInitials(player.name)}</span>` :
                    `<span class="player-initials">${getInitials(player.name)}</span>`
                }
            </div>
        </div>

        <div class="player-row-info">
            <div class="player-info-name">${player.name}</div>
            <div class="player-info-meta">${player.ovr || 'N/A'} • ${player.position || 'N/A'}</div>

            <div class="player-price" style="color: #fbbf24; font-weight: 500; font-size: 0.9rem; margin-top: 4px; min-height: 20px; display: flex; align-items: center;">
                ${displayPriceHTML}
            </div>

            ${secondaryPosition ? `<div class="player-info-secondary">${secondaryPosition}</div>` : ''}
        </div>

        <div class="player-row-stats">
            <div class="stat-pill"><div class="stat-pill-value">${player.pace || 0}</div><div class="stat-pill-label">PAC</div></div>
            <div class="stat-pill"><div class="stat-pill-value">${player.shooting || 0}</div><div class="stat-pill-label">SHO</div></div>
            <div class="stat-pill"><div class="stat-pill-value">${player.passing || 0}</div><div class="stat-pill-label">PAS</div></div>
            <div class="stat-pill"><div class="stat-pill-value">${player.dribbling || 0}</div><div class="stat-pill-label">DRI</div></div>
            <div class="stat-pill"><div class="stat-pill-value">${player.defending || 0}</div><div class="stat-pill-label">DEF</div></div>
            <div class="stat-pill"><div class="stat-pill-value">${player.physical || 0}</div><div class="stat-pill-label">PHY</div></div>
        </div>

        <button class="player-row-watchlist ${isWatchlisted ? 'active' : ''}"
                data-unique-id="${uniqueId}"
                aria-label="Toggle watchlist for ${player.name}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="${isWatchlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
        </button>
    `;

    // 6. Event Listeners

    // Main card click (View Details)
    card.addEventListener('click', function(e) {
        if (e.target.closest('.player-row-watchlist')) return;

        if (typeof viewPlayerDetail === 'function') {
            viewPlayerDetail(player.player_id);
        } else {
            console.log('Clicked player:', player.name, 'ID:', player.player_id);
        }
    });

    // Watchlist button click
    const watchBtn = card.querySelector('.player-row-watchlist');
    if (watchBtn) {
        watchBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            const id = this.dataset.uniqueId || uniqueId;
            if (typeof window.toggleWatchlist === 'function') {
                window.toggleWatchlist(id);
            }
        });
    }

    return card;
}


// ========== LOAD DATABASE FROM API ==========
// ========== LOAD DATABASE WITH FILTERS & PAGINATION ==========
// ========== LOAD WATCHLIST ==========
function applyWatchlistFilters(players) {
  return players.filter(player => {
    // Position
    if (state.filters.position && player.position !== state.filters.position) {
      return false;
    }

    // OVR
    if (player.ovr < state.filters.ratingMin || player.ovr > state.filters.ratingMax) {
      return false;
    }

    // League
    if (state.filters.league && player.league !== state.filters.league) {
      return false;
    }

    // Club
    if (state.filters.club && player.team !== state.filters.club) {
      return false;
    }

    // Nation
    if (state.filters.nation && player.nation !== state.filters.nation) {
      return false;
    }

    // Skill moves
    if (state.filters.skillMoves && String(player.skill_moves) !== String(state.filters.skillMoves)) {
      return false;
    }


    // Event
    if (state.filters.event && player.event !== state.filters.event) return false;

    return true;
  });
}


function loadWatchlist() {
  const container = document.getElementById('watchlist-players-grid');
  if (!container) {
    console.warn('[WATCHLIST] Container not found');
    return;
  }

  container.innerHTML = '';

  // 1. Empty state check (if no IDs are in the watchlist at all)
  if (!state.watchlist || state.watchlist.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">❤️</div>
        <h3>No players in watchlist</h3>
        <p>Add players from the database</p>
      </div>
    `;
    return;
  }

  // ============================================================
  // 🔥 FIX: Load full player objects from storage first
  // ============================================================
  let resolvedPlayers = JSON.parse(localStorage.getItem('watchlistPlayers')) || [];

  // Fallback: If storage is missing players (e.g., from old data), try to find them in current memory
  if (resolvedPlayers.length < state.watchlist.length) {
    const allMemoryPlayers = [
      ...(state.filteredPlayers || []),
      ...(state.allPlayers || []),
      ...(state.searchResults || [])
    ];

    state.watchlist.forEach(uniqueId => {
      // Check if we already have this player resolved
      const alreadyResolved = resolvedPlayers.some(p => {
        const pId = `${p.player_id}_${p.rank || 0}_${p.is_untradable ? 1 : 0}`;
        return pId === uniqueId;
      });

      if (!alreadyResolved) {
        const [playerId, rank, untradable] = uniqueId.split('_');
        const found = allMemoryPlayers.find(p =>
          String(p.player_id) === String(playerId) &&
          String(p.rank || 0) === String(rank) &&
          String(p.is_untradable ? 1 : 0) === String(untradable)
        );
        if (found) resolvedPlayers.push(found);
      }
    });
  }

  // Final Sync: Ensure we ONLY show players that are actually in the active ID list
  resolvedPlayers = resolvedPlayers.filter(p => {
    const uniqueId = `${p.player_id}_${p.rank || 0}_${p.is_untradable ? 1 : 0}`;
    return state.watchlist.includes(uniqueId);
  });

  // ============================================================
  // APPLY FILTERS & RENDER
  // ============================================================

  // Use your existing filter function
  const filteredWatchlist = applyWatchlistFilters(resolvedPlayers);

  // Case: Watchlist has players, but filters hide them all
  if (filteredWatchlist.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>No players match filters</h3>
        <p>Try adjusting filters</p>
      </div>
    `;
    return;
  }

  // Render the cards
  filteredWatchlist.forEach(player => {
    // Uses your existing card creator (which handles the hearts)
    const card = createPlayerCard(player);
    container.appendChild(card);
  });

  // Sync heart icons across the app
  updateAllWatchlistButtons();

  console.log('[WATCHLIST] Loaded', filteredWatchlist.length, 'players');
}


// ========== LOAD DATABASE FROM API ==========
async function loadDatabase() {
    if (state.isLoadingAPI) {
        console.log('[DATABASE] Already loading...');
        return;
    }

    const container = document.getElementById('players-grid');
    const loadMoreBtn = document.getElementById('load-more-btn');
    const resultsInfo = document.querySelector('.results-info');

    if (!container) return;

    // Show loading state
    if (state.currentOffset === 0) {
        container.innerHTML = '<div class="loading-spinner">Loading players...</div>';
    }

    state.isLoadingAPI = true;

    try {
        // Build filter object from state
        const filters = {
            limit: state.limitPerPage,
            offset: state.currentOffset,
            rank: state.apiRank
        };

        // Add position filter
        if (state.filters.position) {
            filters.position = state.filters.position;
        }

        // Add OVR range filter
        if (state.filters.ratingMin > 40) {
            filters.min_ovr = state.filters.ratingMin;
        }
        if (state.filters.ratingMax < 150) {
            filters.max_ovr = state.filters.ratingMax;
        }

        // league filter
        if (state.filters.league) {
            filters.league = state.filters.league;
        }

        // club filter
        if (state.filters.club) {
            filters.team = state.filters.club;
        }

        // nation filter
        if (state.filters.nation) {
            filters.nation = state.filters.nation;
        }

        // Add skill moves filter
        if (state.filters.skillMoves) {
            filters.skill_moves = state.filters.skillMoves;
        }

        // Add event filter
        if (state.filters.event) {
            filters.event = state.filters.event;
        }

        // ========== FIXED: Add Price Range filter ==========
        if (state.filters.priceMin !== null && state.filters.priceMin !== '' && !isNaN(state.filters.priceMin)) {
            filters.min_price = parseInt(state.filters.priceMin);
        }
        if (state.filters.priceMax !== null && state.filters.priceMax !== '' && !isNaN(state.filters.priceMax)) {
            filters.max_price = parseInt(state.filters.priceMax);
        }


        console.log('[DATABASE] Fetching with filters:', filters);

        // 1. Fetch from Metadata API
        const response = await apiClient.getPlayers(filters);

        if (!response || !response.players) {
            throw new Error('Invalid API response');
        }

        let players = response.players;

        // 🔥 2. Sync Metadata with Supabase Prices (matches p.id to asset_id)
        if (typeof supabaseProvider !== 'undefined') {
            console.log('[SUPABASE] Syncing prices for', players.length, 'players...');
            players = await supabaseProvider.syncPrices(players);
        }

        // 3. Cache globally for watchlist
        state.allPlayers = [
          ...new Map(
            [...state.allPlayers, ...players].map(p => [`${p.player_id}_${p.rank || 0}_${p.is_untradable ? 1 : 0}`, p])
          ).values()
        ];

        state.totalPlayers = response.total || players.length;
        state.hasMorePlayers = players.length === state.limitPerPage;

        // If first load, replace content
        if (state.currentOffset === 0) {
            container.innerHTML = '';
            state.filteredPlayers = players;
        } else {
            // Append to existing
            state.filteredPlayers = [...state.filteredPlayers, ...players];
        }

        // 4. Render player cards
        if (players.length === 0 && state.currentOffset === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <h3>No players found</h3>
                    <p>Try adjusting your filters</p>
                </div>
            `;
            if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        } else {
            players.forEach(player => {
                const card = createPlayerCard(player);
                container.appendChild(card);
            });

            updateAllWatchlistButtons();

            // Show/hide Load More button
            if (loadMoreBtn) {
                if (state.hasMorePlayers && players.length === state.limitPerPage) {
                    loadMoreBtn.style.display = 'block';
                    loadMoreBtn.disabled = false;
                    loadMoreBtn.textContent = 'Load More';
                } else {
                    loadMoreBtn.style.display = 'none';
                }
            }
        }

        // Update results info
        if (resultsInfo) {
            const displayedCount = state.filteredPlayers.length;
            resultsInfo.textContent = `Showing ${displayedCount} of ${state.totalPlayers} players`;
        }

        console.log(`[DATABASE] Loaded ${players.length} players (offset: ${state.currentOffset})`);

    } catch (error) {
        console.error('[DATABASE] Error loading players:', error);
        container.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h3>Error loading players</h3>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="loadDatabase()">Retry</button>
            </div>
        `;
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';
    } finally {
        state.isLoadingAPI = false;
    }
}

// ========== LOAD MORE PLAYERS ==========
window.loadMorePlayers = function() {
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.disabled = true;
        loadMoreBtn.textContent = 'Loading...';
    }

    state.currentOffset += state.limitPerPage;
    loadDatabase();
};

// ========== INITIALIZE FILTERS ==========
// Price filter constants (limits)
const PRICE_FILTER_LIMITS = {
    min: 0,
    max: 999999999999  // 999B max
};

function initFilters() {
    // Position filter
    const positionFilter = document.getElementById('filter-position');
    if (positionFilter) {
        positionFilter.addEventListener('change', (e) => {
            state.filters.position = e.target.value;
            state.currentOffset = 0;
            if (state.currentView === 'database') {
                loadDatabase();
            }
            if (state.currentView === 'watchlist') {
              loadWatchlist();
            }
        });
    }

    // Rating Min filter with proper limits
    const ratingMin = document.getElementById('rating-min');
    if (ratingMin) {
        ratingMin.setAttribute('min', '40');
        ratingMin.setAttribute('max', '150');

        ratingMin.addEventListener('input', (e) => {
            let value = parseInt(e.target.value) || 40;
            // Enforce limits
            value = Math.max(40, Math.min(150, value));
            // Ensure min <= max
            if (value > state.filters.ratingMax) {
                value = state.filters.ratingMax;
            }
            e.target.value = value;
            state.filters.ratingMin = value;
            updateRatingDisplay();
        });

        ratingMin.addEventListener('change', (e) => {
            let value = parseInt(e.target.value) || 40;
            value = Math.max(40, Math.min(150, value));
            if (value > state.filters.ratingMax) {
                value = state.filters.ratingMax;
            }
            e.target.value = value;
            state.filters.ratingMin = value;
            state.currentOffset = 0;
            if (state.currentView === 'database') {
              loadDatabase();
            }
            if (state.currentView === 'watchlist') {
              loadWatchlist();
            }
        });
    }

    // Rating Max filter with proper limits
    const ratingMax = document.getElementById('rating-max');
    if (ratingMax) {
        ratingMax.setAttribute('min', '40');
        ratingMax.setAttribute('max', '150');

        ratingMax.addEventListener('input', (e) => {
            let value = parseInt(e.target.value) || 150;
            // Enforce limits
            value = Math.max(40, Math.min(150, value));
            // Ensure max >= min
            if (value < state.filters.ratingMin) {
                value = state.filters.ratingMin;
            }
            e.target.value = value;
            state.filters.ratingMax = value;
            updateRatingDisplay();
        });

        ratingMax.addEventListener('change', (e) => {
            let value = parseInt(e.target.value) || 150;
            value = Math.max(40, Math.min(150, value));
            if (value < state.filters.ratingMin) {
                value = state.filters.ratingMin;
            }
            e.target.value = value;
            state.filters.ratingMax = value;
            state.currentOffset = 0;
            if (state.currentView === 'database') {
              loadDatabase();
            }
            if (state.currentView === 'watchlist') {
              loadWatchlist();
            }
        });
    }

    // ========== FIXED: Price Min filter with proper handling ==========
    const priceMin = document.getElementById('price-min');
    if (priceMin) {
        priceMin.setAttribute('min', '0');
        priceMin.setAttribute('max', String(PRICE_FILTER_LIMITS.max));
        priceMin.setAttribute('placeholder', 'Min (0)');

        priceMin.addEventListener('input', (e) => {
            let value = e.target.value.replace(/[^0-9]/g, ''); // Only allow numbers
            if (value === '') {
                state.filters.priceMin = null;
            } else {
                let numValue = parseInt(value);
                // Enforce limits
                numValue = Math.max(PRICE_FILTER_LIMITS.min, Math.min(PRICE_FILTER_LIMITS.max, numValue));
                state.filters.priceMin = numValue;
                e.target.value = numValue;
            }
            updatePriceDisplay();
        });

        priceMin.addEventListener('change', (e) => {
            // Validate: min should not be greater than max
            if (state.filters.priceMin !== null && state.filters.priceMax !== null) {
                if (state.filters.priceMin > state.filters.priceMax) {
                    state.filters.priceMin = state.filters.priceMax;
                    e.target.value = state.filters.priceMin;
                }
            }
            state.currentOffset = 0;
            if (state.currentView === 'database') {
                loadDatabase();
            }
            if (state.currentView === 'watchlist') {
                loadWatchlist();
            }
        });
    }

    // ========== FIXED: Price Max filter with proper handling ==========
    const priceMax = document.getElementById('price-max');
    if (priceMax) {
        priceMax.setAttribute('min', '0');
        priceMax.setAttribute('max', String(PRICE_FILTER_LIMITS.max));
        priceMax.setAttribute('placeholder', 'Max');

        priceMax.addEventListener('input', (e) => {
            let value = e.target.value.replace(/[^0-9]/g, ''); // Only allow numbers
            if (value === '') {
                state.filters.priceMax = null;
            } else {
                let numValue = parseInt(value);
                // Enforce limits
                numValue = Math.max(PRICE_FILTER_LIMITS.min, Math.min(PRICE_FILTER_LIMITS.max, numValue));
                state.filters.priceMax = numValue;
                e.target.value = numValue;
            }
            updatePriceDisplay();
        });

        priceMax.addEventListener('change', (e) => {
            // Validate: max should not be less than min
            if (state.filters.priceMin !== null && state.filters.priceMax !== null) {
                if (state.filters.priceMax < state.filters.priceMin) {
                    state.filters.priceMax = state.filters.priceMin;
                    e.target.value = state.filters.priceMax;
                }
            }
            state.currentOffset = 0;
            if (state.currentView === 'database') {
                loadDatabase();
            }
            if (state.currentView === 'watchlist') {
                loadWatchlist();
            }
        });
    }

    // League filter
    const leagueFilter = document.getElementById('filter-league');
    if (leagueFilter) {
        leagueFilter.addEventListener('change', (e) => {
            state.filters.league = e.target.value;
            state.currentOffset = 0;
            if (state.currentView === 'database') {
              loadDatabase();
            }
            if (state.currentView === 'watchlist') {
              loadWatchlist();
            }
        });
    }

    // Nation filter (autocomplete)
    const nationFilter = document.getElementById('filter-nation');
    if (nationFilter) {
        nationFilter.addEventListener('change', (e) => {
            state.filters.nation = e.target.value;
            state.currentOffset = 0;
            if (state.currentView === 'database') {
              loadDatabase();
            }
            if (state.currentView === 'watchlist') {
              loadWatchlist();
            }
        });
    }

    // Club filter
    const clubFilter = document.getElementById('filter-club');
    if (clubFilter) {
        clubFilter.addEventListener('change', (e) => {
            state.filters.club = e.target.value;
            state.currentOffset = 0;
            if (state.currentView === 'database') {
              loadDatabase();
            }
            if (state.currentView === 'watchlist') {
              loadWatchlist();
            }
        });
    }

    // Skill Moves filter
    const skillFilter = document.getElementById('filter-skill');
    if (skillFilter) {
        skillFilter.addEventListener('change', (e) => {
            state.filters.skillMoves = e.target.value;
            state.currentOffset = 0;
            if (state.currentView === 'database') {
              loadDatabase();
            }
            if (state.currentView === 'watchlist') {
              loadWatchlist();
            }
        });
    }

    // Event filter
    const eventFilter = document.getElementById('filter-event');
    if (eventFilter) {
        eventFilter.addEventListener('change', (e) => {
            state.filters.event = e.target.value;
            state.currentOffset = 0;
            if (state.currentView === 'database') loadDatabase();
            if (state.currentView === 'watchlist') loadWatchlist();
        });
    }

    // Clear All Filters button
    const clearFiltersBtn = document.getElementById('clear-filters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearAllFilters);
    }

    console.log('[FILTERS] Initialized');
}

// ========== FIXED: Update price display ==========
function updatePriceDisplay() {
    const priceValue = document.getElementById('price-value');
    if (priceValue) {
        const min = state.filters.priceMin;
        const max = state.filters.priceMax;

        if (min === null && max === null) {
            priceValue.textContent = 'Any';
        } else if (min !== null && max !== null) {
            priceValue.textContent = `${formatPrice(min)} - ${formatPrice(max)}`;
        } else if (min !== null) {
            priceValue.textContent = `${formatPrice(min)}+`;
        } else if (max !== null) {
            priceValue.textContent = `Up to ${formatPrice(max)}`;
        }
    }
}

// Update rating display
function updateRatingDisplay() {
    const ratingValue = document.getElementById('rating-value');
    if (ratingValue) {
        ratingValue.textContent = `${state.filters.ratingMin}-${state.filters.ratingMax}`;
    }
}

// Clear all filters
function clearAllFilters() {
    // 1. Reset State Object
    state.filters = {
        position: '',
        ratingMin: 40,
        ratingMax: 150,
        priceMin: null,
        priceMax: null,
        league: '',
        nation: '',
        club: '',
        skillMoves: '',
        event: ''
    };

    // 2. Reset UI Elements
    const positionFilter = document.getElementById('filter-position');
    if (positionFilter) positionFilter.value = '';

    const ratingMin = document.getElementById('rating-min');
    if (ratingMin) ratingMin.value = 40;

    const ratingMax = document.getElementById('rating-max');
    if (ratingMax) ratingMax.value = 150;

    // ✅ FIXED: Reset Price Filters
    const priceMin = document.getElementById('price-min');
    if (priceMin) priceMin.value = '';

    const priceMax = document.getElementById('price-max');
    if (priceMax) priceMax.value = '';

    const leagueFilter = document.getElementById('filter-league');
    if (leagueFilter) leagueFilter.value = '';

    const clubFilter = document.getElementById('filter-club');
    if (clubFilter) clubFilter.value = '';

    const nationFilter = document.getElementById('filter-nation');
    if (nationFilter) nationFilter.value = '';

    const skillFilter = document.getElementById('filter-skill');
    if (skillFilter) skillFilter.value = '';

    const eventFilter = document.getElementById('filter-event');
    if (eventFilter) eventFilter.value = '';

    // Reset nation flag
    const nationFlag = document.getElementById('filter-nation-flag');
    if (nationFlag) {
        nationFlag.style.display = 'none';
        nationFlag.src = '';
    }

    // 3. Update Visuals
    updateRatingDisplay();
    updatePriceDisplay();

    // 4. Reload Database
    state.currentOffset = 0;
    if (state.currentView === 'database') {
        loadDatabase();
    }
    if (state.currentView === 'watchlist') {
        loadWatchlist();
    }

    showToast('Filters cleared', 'success');
}



// Initialize Application
document.addEventListener('DOMContentLoaded', async function () {
  // ----------------------------
  // Core startup
  // ----------------------------
  initCountryAutocomplete('filter-nation', 'filter-nation-list');
  initCountryAutocomplete('mobile-filter-nation', 'mobile-filter-nation-list');

  console.log('[APP] Initializing Zenith App...');

  // ===== API INITIALIZATION =====
  if (typeof apiClient !== 'undefined') {
    window.apiClient = apiClient;
    console.log('[APP] ✓ API client connected');

    try {
      const health = await window.apiClient.checkHealth();
      console.log('[APP] ✓ API Health:', health);
    } catch (error) {
      console.error('[APP] ✗ API check failed:', error);
    }
  } else {
    console.warn('[APP] ⚠ API client not found');
  }
  // ===== END API INITIALIZATION =====

  // ----------------------------
  // Ensure core UI systems are initialized
  // ----------------------------
  // Initialize filters (attaches base filter event listeners)
  if (typeof initFilters === 'function') {
    initFilters();
  }

  // Initialize tools menu (modal / sheet)
  if (typeof initializeToolsMenu === 'function') {
    initializeToolsMenu();
  }

  // ----------------------------
  // Navigation & basic UI listeners
  // ----------------------------
  document.querySelectorAll('[data-view]').forEach(button => {
    // prevent duplicate handlers if this gets called twice
    button.removeEventListener('click', button._zenithViewHandler);
    const handler = function () {
      const view = this.getAttribute('data-view');
      if (view) switchView(view);
    };
    button._zenithViewHandler = handler;
    button.addEventListener('click', handler);
  });

  const backBtn = document.getElementById('back-btn');
  if (backBtn) {
    backBtn.removeEventListener('click', backBtn._zenithBackHandler);
    backBtn._zenithBackHandler = () => switchView('database');
    backBtn.addEventListener('click', backBtn._zenithBackHandler);
  }

  const loadMoreBtn = document.getElementById('load-more-btn');
  if (loadMoreBtn) {
    loadMoreBtn.removeEventListener('click', loadMoreBtn._zenithLoadMoreHandler);
    loadMoreBtn._zenithLoadMoreHandler = loadMorePlayers;
    loadMoreBtn.addEventListener('click', loadMoreBtn._zenithLoadMoreHandler);
  }

  // ----------------------------
  // Players page search with filters
  // (search triggered from #player-search input on players page)
  // ----------------------------
  let playerSearchTimeout = null;
  let currentPlayerSearchQuery = '';
  let playerSearchOffset = 0;
  let playerSearchTotal = 0;

  const playerSearch = document.getElementById('player-search');
  if (playerSearch) {
    playerSearch.addEventListener('input', (e) => {
      const searchTerm = e.target.value.trim();

      clearTimeout(playerSearchTimeout);

      // If empty, restore normal DB view
      if (searchTerm.length === 0) {
        currentPlayerSearchQuery = '';
        if (typeof loadDatabase === 'function') loadDatabase();
        return;
      }

      if (searchTerm.length < 2) {
        return;
      }

      showPlayerSearchLoading();

      playerSearchTimeout = setTimeout(() => {
        currentPlayerSearchQuery = searchTerm;
        playerSearchOffset = 0;
        searchPlayersInDatabase(searchTerm, false);
      }, 300);
    });
  }

  function showPlayerSearchLoading() {
    const container = document.getElementById('database-players-container') ||
      document.querySelector('#database-view .players-grid') ||
      document.querySelector('#database-view');

    if (container) {
      container.innerHTML = `
        <div class="search-loading" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
            <div class="dropdown-spinner" style="margin: 0 auto 16px;"></div>
            <p style="color: var(--text-tertiary); font-size: 14px;">Searching...</p>
        </div>
      `;
    }
  }

  async function searchPlayersInDatabase(query, append = false) {
    if (!window.apiClient) {
      console.error('[SEARCH] API client not available');
      return;
    }

    try {
      console.log('[SEARCH] Searching players:', query, 'with filters');

      const params = {
        q: query,
        limit: 20,
        offset: append ? playerSearchOffset : 0,
        rank: 0
      };

      // Apply active filters from state
      if (state.filters.position) params.position = state.filters.position;
      if (state.filters.ratingMin) params.min_ovr = state.filters.ratingMin;
      if (state.filters.ratingMax) params.max_ovr = state.filters.ratingMax;
      if (state.filters.league) params.league = state.filters.league;
      if (state.filters.nation) params.nation = state.filters.nation;
      if (state.filters.skillMoves) params.skill_moves = state.filters.skillMoves;
      if (state.filters.club) params.team = state.filters.club;
      if (state.filters.priceMin) params.min_price = state.filters.priceMin;
      if (state.filters.priceMax) params.max_price = state.filters.priceMax;

      const response = await window.apiClient.searchPlayers(params);
      const players = response.results || [];
      const total = response.total || 0;

      console.log('[SEARCH] Found', players.length, 'players, total:', total);

      if (!append) {
        playerSearchOffset = 0;
        playerSearchTotal = total;
      }
      playerSearchOffset += players.length;

      displayPlayerSearchResults(players, query, total, append);

    } catch (error) {
      console.error('[SEARCH] Error:', error);
      showPlayerSearchError(query);
    }
  }

  function displayPlayerSearchResults(players, query, total, append = false) {
    const container = document.getElementById('database-players-container') ||
      document.querySelector('#database-view .players-grid') ||
      document.querySelector('#database-view');

    if (!container) {
      console.error('[SEARCH] Container not found');
      return;
    }

    if (!append) {
      container.innerHTML = '';

      const resultHeader = document.createElement('div');
      resultHeader.className = 'search-result-header';
      resultHeader.style.cssText = 'grid-column: 1/-1; margin-bottom: 16px; color: var(--text-secondary); font-size: 14px;';
      resultHeader.innerHTML = `
          <p>Found <strong>${total}</strong> player${total !== 1 ? 's' : ''} matching "<strong>${query}</strong>"</p>
      `;
      container.appendChild(resultHeader);
    }

    if (!append && players.length === 0) {
      container.innerHTML = `
        <div class="no-results" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
            <svg style="width: 64px; height: 64px; margin: 0 auto 16px; opacity: 0.3;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
            </svg>
            <p style="color: var(--text-primary); font-size: 16px; margin-bottom: 8px;">No players found matching "${query}"</p>
            <p style="color: var(--text-tertiary); font-size: 14px;">Try adjusting your search or filters</p>
        </div>
      `;
      return;
    }

    players.forEach(player => {
      const card = createPlayerCard(player);
      container.appendChild(card);
    });

    updateAllWatchlistButtons();

    const oldLoadMore = document.getElementById('player-search-load-more');
    if (oldLoadMore) oldLoadMore.remove();

    if (playerSearchOffset < total) {
      const loadMoreBtn = document.createElement('button');
      loadMoreBtn.id = 'player-search-load-more';
      loadMoreBtn.className = 'search-load-more-btn';
      loadMoreBtn.style.cssText = 'grid-column: 1/-1; margin-top: 20px;';
      loadMoreBtn.innerHTML = `
          <span>Load More</span>
          <span class="load-more-count">${total - playerSearchOffset} remaining</span>
      `;

      loadMoreBtn.addEventListener('click', async () => {
        loadMoreBtn.disabled = true;
        loadMoreBtn.innerHTML = '<span>Loading...</span>';

        try {
          await searchPlayersInDatabase(currentPlayerSearchQuery, true);
        } catch (error) {
          loadMoreBtn.innerHTML = '<span>Error - Try Again</span>';
          loadMoreBtn.disabled = false;
        }
      });

      container.appendChild(loadMoreBtn);
    }
  }

  function showPlayerSearchError(query) {
    const container = document.getElementById('database-players-container') ||
      document.querySelector('#database-view .players-grid') ||
      document.querySelector('#database-view');

    if (container) {
      container.innerHTML = `
        <div class="search-error" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
            <p style="color: var(--color-status-error); font-size: 16px; margin-bottom: 8px;">Search error</p>
            <p style="color: var(--text-tertiary); font-size: 14px;">Please try again</p>
        </div>
      `;
    }
  }

  // ----------------------------
  // Home Search dropdown (top search box)
  // ----------------------------
  const homeSearch = document.getElementById('home-search');

  // Keyboard navigation for dropdown
  let selectedDropdownIndex = -1;

  if (homeSearch) {
    homeSearch.addEventListener('keydown', (e) => {
      const dropdown = document.getElementById('search-dropdown');
      const resultsContainer = document.getElementById('search-results-dropdown');

      if (!dropdown || !dropdown.classList.contains('active')) return;
      if (!resultsContainer) return;

      const playerRows = resultsContainer.querySelectorAll('.dropdown-player-row');
      if (playerRows.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          selectedDropdownIndex = Math.min(selectedDropdownIndex + 1, playerRows.length - 1);
          updateDropdownHighlight(playerRows);
          break;

        case 'ArrowUp':
          e.preventDefault();
          selectedDropdownIndex = Math.max(selectedDropdownIndex - 1, -1);
          updateDropdownHighlight(playerRows);
          break;

        case 'Enter':
          e.preventDefault();
          if (selectedDropdownIndex >= 0 && selectedDropdownIndex < playerRows.length) {
            playerRows[selectedDropdownIndex].click();
          }
          break;

        case 'Escape':
          dropdown.classList.remove('active');
          homeSearch.blur();
          selectedDropdownIndex = -1;
          break;
      }
    });

    homeSearch.addEventListener('input', () => {
      selectedDropdownIndex = -1;
    });
  }

  function updateDropdownHighlight(playerRows) {
    playerRows.forEach(row => row.classList.remove('dropdown-row-selected'));
    if (selectedDropdownIndex >= 0 && selectedDropdownIndex < playerRows.length) {
      const selectedRow = playerRows[selectedDropdownIndex];
      selectedRow.classList.add('dropdown-row-selected');
      selectedRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  const searchDropdown = document.getElementById('search-dropdown');
  const searchResultsDropdown = document.getElementById('search-results-dropdown');
  let dropdownSearchTimeout;

  if (homeSearch && searchDropdown && searchResultsDropdown) {
    homeSearch.addEventListener('input', async (e) => {
      const searchTerm = e.target.value.trim();

      clearTimeout(dropdownSearchTimeout);

      if (searchTerm.length === 0) {
        searchDropdown.classList.remove('active');
        return;
      }

      if (searchTerm.length < 2) return;

      searchResultsDropdown.innerHTML = `
        <div class="dropdown-loading">
            <div class="dropdown-spinner"></div>
            <p style="color: var(--color-text-muted); font-size: 13px;">Searching...</p>
        </div>
      `;
      searchDropdown.classList.add('active');

      dropdownSearchTimeout = setTimeout(async () => {
        try {
          console.log('[SEARCH] Searching for:', searchTerm);

          const results = await window.apiClient.searchPlayers({
            q: searchTerm,
            limit: 20,
            rank: 0
          });

          const totalFound = results.total || 0;
          console.log('[SEARCH] Found', totalFound, 'players');

          if (totalFound === 0) {
            searchResultsDropdown.innerHTML = `
              <div class="dropdown-no-results">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.35-4.35"></path>
                  </svg>
                  <p>No players found for "${searchTerm}"</p>
              </div>
            `;
            return;
          }

          searchResultsDropdown.innerHTML = '';

          if (!window.dropdownSearchState) {
            window.dropdownSearchState = { currentQuery: '', displayedCount: 0, totalCount: 0, allResults: [] };
          }

          window.dropdownSearchState.currentQuery = searchTerm;
          window.dropdownSearchState.totalCount = totalFound;
          window.dropdownSearchState.displayedCount = (results.results || []).length;
          window.dropdownSearchState.allResults = results.results || [];

          (results.results || []).forEach(player => {
            const row = createDropdownPlayerRow(player);
            searchResultsDropdown.appendChild(row);
          });

          updateAllWatchlistButtons();

          if (totalFound > 20) {
            addLoadMoreButton(searchResultsDropdown, searchTerm);
          }

        } catch (error) {
          console.error('[SEARCH] Error:', error);
          searchResultsDropdown.innerHTML = `
            <div class="dropdown-no-results">
                <p style="color: var(--color-status-error);">Search error. Please try again.</p>
            </div>
          `;
        }
      }, 300);
    });

    document.addEventListener('click', (e) => {
      if (!homeSearch.contains(e.target) && !searchDropdown.contains(e.target)) {
        searchDropdown.classList.remove('active');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (searchDropdown) searchDropdown.classList.remove('active');
        if (homeSearch) homeSearch.blur();
      }
    });
  }

  function addLoadMoreButton(container, query) {
    const remaining = window.dropdownSearchState.totalCount - window.dropdownSearchState.displayedCount;
    if (remaining <= 0) return;

    const loadMoreBtn = document.createElement('div');
    loadMoreBtn.className = 'dropdown-load-more';
    loadMoreBtn.id = 'dropdown-load-more-section';
    loadMoreBtn.innerHTML = `
      <button class="dropdown-load-more-btn">
          <span>Load More</span>
          <span class="load-more-count">(${remaining} remaining)</span>
      </button>
    `;

    loadMoreBtn.querySelector('button').addEventListener('click', async function (e) {
      e.stopPropagation();
      const btn = this;
      btn.disabled = true;
      btn.innerHTML = '<span>Loading...</span>';

      try {
        const nextBatch = await window.apiClient.searchPlayers({
          q: query,
          limit: 20,
          offset: window.dropdownSearchState.displayedCount,
          rank: 0
        });

        console.log('[SEARCH] Loaded', (nextBatch.results || []).length, 'more results');
        loadMoreBtn.remove();

        (nextBatch.results || []).forEach(player => {
          const row = createDropdownPlayerRow(player);
          container.appendChild(row);
        });

        window.dropdownSearchState.displayedCount += (nextBatch.results || []).length;
        window.dropdownSearchState.allResults = window.dropdownSearchState.allResults.concat(nextBatch.results || []);

        addLoadMoreButton(container, query);

      } catch (error) {
        console.error('[SEARCH] Load more error:', error);
        btn.innerHTML = '<span>❌ Error - Try Again</span>';
        btn.disabled = false;
      }
    });

    container.appendChild(loadMoreBtn);
  }

  function createDropdownPlayerRow(player) {
    const row = document.createElement('div');
    row.className = 'dropdown-player-row';

    const isAuctionable = player.is_untradable !== 'True' && player.is_untradable !== true;

    // ========== FIXED: Show price for auctionable cards in search ==========
    const priceDisplay = isAuctionable && player.price
        ? `<div class="dropdown-player-price" style="color: #fbbf24; font-size: 12px; font-weight: 600;">${formatPrice(player.price)}</div>`
        : '';

    row.innerHTML = `
      <div class="dropdown-player-card">
          ${player.player_image ?
        `<img src="${player.player_image}" alt="${player.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
               <span class="player-initials" style="display: none;">${getInitials(player.name)}</span>` :
        `<span class="player-initials">${getInitials(player.name)}</span>`
      }
      </div>

      <div class="dropdown-player-info">
          <div class="dropdown-player-name">${player.name}</div>
          <span class="dropdown-player-badge ${isAuctionable ? 'auctionable' : 'non-auctionable'}">
              ${isAuctionable ? '✅ Auctionable' : '🔴 Non-auctionable'}
          </span>
          ${priceDisplay}
      </div>

      <div class="dropdown-player-stats">
          <div class="dropdown-player-ovr">${player.ovr || 'N/A'}</div>
          <div class="dropdown-player-position">${player.position || 'N/A'}</div>
      </div>
    `;

    row.addEventListener('click', () => {
      console.log('[SEARCH] Selected player:', player.name);
      // Store in search results for detail view
      if (!state.searchResults.some(p => p.player_id === player.player_id)) {
          state.searchResults.push(player);
      }
      if (searchDropdown) searchDropdown.classList.remove('active');
      if (homeSearch) homeSearch.value = '';
      // Navigate to player detail
      viewPlayerDetail(player.player_id);
    });

    return row;
  }

  // Sort dropdown
  const sortBy = document.getElementById('sort-by');
  if (sortBy) {
    sortBy.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      if (typeof renderPlayers === 'function') renderPlayers();
    });
  }

  // Time filters (market)
  document.querySelectorAll('.time-btn').forEach(btn => {
    // remove previously attached handler (if any)
    btn.removeEventListener('click', btn._zenithTimeHandler);
    btn._zenithTimeHandler = function () {
      document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    };
    btn.addEventListener('click', btn._zenithTimeHandler);
  });

  // ----------------------------
  // Home search (global search input) initialization (small search box)
  // If you also have a `#search-input` small input elsewhere, keep both behaviours
  // ----------------------------
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const query = e.target.value.trim();
        if (query.length >= 2) {
          if (typeof searchPlayers === 'function') {
            // if you have a separate searchPlayers function, use it
            searchPlayers(query);
          } else if (window.apiClient) {
            // fallback: use dropdown / searchPlayersInDatabase for quick behaviour
            searchPlayersInDatabase(query, false);
          }
        } else {
          // hide or clear UI for small search input
          const dropdown = document.getElementById('search-dropdown');
          if (dropdown) dropdown.classList.remove('active');
        }
      }, 300);
    });
  }

  // ----------------------------
  // Restore the previous view on page load
  // ----------------------------
  const savedView = localStorage.getItem('currentView') || state.currentView || 'dashboard';
  switchView(savedView);

  // ----------------------------
  // Real-time simulation (safe guard: use state.filteredPlayers)
  // ----------------------------
  setInterval(() => {
    if (state.currentView === 'dashboard' && Array.isArray(state.filteredPlayers) && state.filteredPlayers.length > 0) {
      const idx = Math.floor(Math.random() * state.filteredPlayers.length);
      const randomPlayer = state.filteredPlayers[idx];
      const change = (Math.random() - 0.5) * 2;
      randomPlayer.priceChange = parseFloat(((randomPlayer.priceChange || 0) + change).toFixed(1));
    }
  }, 5000);

  console.log('[APP] Initialization complete');
});

updateAllWatchlistButtons();



// MOBILE FILTER FUNCTIONS
function toggleMobileFilters() {
  const modal = document.getElementById('mobile-filter-modal');
  if (modal) {
    modal.classList.toggle('active');

    if (modal.classList.contains('active')) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }
}

function applyMobileFilters() {
  const position = document.getElementById('mobile-filter-position').value;
  const ratingMin = document.getElementById('mobile-rating-min').value;
  const ratingMax = document.getElementById('mobile-rating-max').value;
  const priceMin = document.getElementById('mobile-price-min').value;
  const priceMax = document.getElementById('mobile-price-max').value;
  const league = document.getElementById('mobile-filter-league').value;
  const nation = document.getElementById('mobile-filter-nation').value;
  const skill = document.getElementById('mobile-filter-skill').value;
  const event = document.getElementById('mobile-filter-event').value;
  const sortBy = document.getElementById('mobile-sort-by').value;

  if (document.getElementById('filter-position'))
    document.getElementById('filter-position').value = position;
  if (document.getElementById('rating-min'))
    document.getElementById('rating-min').value = ratingMin;
  if (document.getElementById('rating-max'))
    document.getElementById('rating-max').value = ratingMax;
  if (document.getElementById('price-min'))
    document.getElementById('price-min').value = priceMin;
  if (document.getElementById('price-max'))
    document.getElementById('price-max').value = priceMax;
  if (document.getElementById('filter-league'))
    document.getElementById('filter-league').value = league;
  if (document.getElementById('filter-nation'))
    document.getElementById('filter-nation').value = nation;
  if (document.getElementById('filter-skill'))
    document.getElementById('filter-skill').value = skill;

  if (document.getElementById('filter-event')) document.getElementById('filter-event').value = event;

  if (document.getElementById('sort-by'))
    document.getElementById('sort-by').value = sortBy;

  updateFilterBadge();
  toggleMobileFilters();

  if (typeof loadDatabase === 'function') {
    loadDatabase();
  }

  showToast('Filters applied', 'success');
}

function clearMobileFilters() {
  if (document.getElementById('mobile-filter-position'))
    document.getElementById('mobile-filter-position').value = '';
  if (document.getElementById('mobile-rating-min'))
    document.getElementById('mobile-rating-min').value = 40;
  if (document.getElementById('mobile-rating-max'))
    document.getElementById('mobile-rating-max').value = 150;
  if (document.getElementById('mobile-price-min'))
    document.getElementById('mobile-price-min').value = '';
  if (document.getElementById('mobile-price-max'))
    document.getElementById('mobile-price-max').value = '';
  if (document.getElementById('mobile-filter-league'))
    document.getElementById('mobile-filter-league').value = '';
  if (document.getElementById('mobile-filter-nation'))
    document.getElementById('mobile-filter-nation').value = '';
  if (document.getElementById('mobile-filter-skill'))
    document.getElementById('mobile-filter-skill').value = '';

  if (document.getElementById('mobile-filter-event')) document.getElementById('mobile-filter-event').value = '';


  if (document.getElementById('mobile-sort-by'))
    document.getElementById('mobile-sort-by').value = 'name';

  if (document.getElementById('filter-position'))
    document.getElementById('filter-position').value = '';
  if (document.getElementById('rating-min'))
    document.getElementById('rating-min').value = 40;
  if (document.getElementById('rating-max'))
    document.getElementById('rating-max').value = 150;
  if (document.getElementById('price-min'))
    document.getElementById('price-min').value = '';
  if (document.getElementById('price-max'))
    document.getElementById('price-max').value = '';
  if (document.getElementById('filter-league'))
    document.getElementById('filter-league').value = '';
  if (document.getElementById('filter-nation'))
    document.getElementById('filter-nation').value = '';
  if (document.getElementById('filter-skill'))
    document.getElementById('filter-skill').value = '';
  if (document.getElementById('sort-by'))
    document.getElementById('sort-by').value = 'name';

  updateFilterBadge();

  if (typeof loadDatabase === 'function') {
    loadDatabase();
  }

  showToast('Filters cleared', 'success');
}

function updateFilterBadge() {
  const badge = document.getElementById('filter-badge');
  if (!badge) return;

  const position = document.getElementById('mobile-filter-position')?.value || '';
  const ratingMin = document.getElementById('mobile-rating-min')?.value || 40;
  const ratingMax = document.getElementById('mobile-rating-max')?.value || 150;
  const priceMin = document.getElementById('mobile-price-min')?.value || '';
  const priceMax = document.getElementById('mobile-price-max')?.value || '';
  const league = document.getElementById('mobile-filter-league')?.value || '';
  const nation = document.getElementById('mobile-filter-nation')?.value || '';
  const skill = document.getElementById('mobile-filter-skill')?.value || '';

  const hasActiveFilters = position ||
    ratingMin != 40 ||
    ratingMax != 150 ||
    priceMin ||
    priceMax ||
    league ||
    nation ||
    skill;

  badge.style.display = hasActiveFilters ? 'block' : 'none';
}

function handleSearch(value) {
  state.searchQuery = value.toLowerCase();
  if (typeof loadDatabase === 'function') {
    loadDatabase();
  }
}



// ==================== PLAYER COMPARISON TOOL ====================

// Comparison State
const compareState = {
  selectedPlayers: [],
  currentSlot: null,
  isBasicView: true,
  positionMode: null, // 'outfield' or 'gk'
};

// Stats Configuration
const STATS_CONFIG = {
  outfield: {
    basic: [
      { name: 'Pace', apiField: 'pace' },
      { name: 'Shooting', apiField: 'shooting' },
      { name: 'Passing', apiField: 'passing' },
      { name: 'Dribbling', apiField: 'dribbling' },
      { name: 'Defending', apiField: 'defending' },
      { name: 'Physical', apiField: 'physical' },
    ],
    advanced: {
      'Pace': [
        { name: 'Acceleration', apiField: 'acceleration' },
        { name: 'Sprint Speed', apiField: 'sprint_speed' },
      ],
      'Shooting': [
        { name: 'Finishing', apiField: 'finishing' },
        { name: 'Long Shot', apiField: 'long_shot' },
        { name: 'Shot Power', apiField: 'shot_power' },
        { name: 'Positioning', apiField: 'positioning' },
        { name: 'Volley', apiField: 'volley' },
        { name: 'Penalties', apiField: 'penalties' },
      ],
      'Passing': [
        { name: 'Short Passing', apiField: 'short_passing' },
        { name: 'Long Passing', apiField: 'long_passing' },
        { name: 'Vision', apiField: 'vision' },
        { name: 'Crossing', apiField: 'crossing' },
        { name: 'Curve', apiField: 'curve' },
        { name: 'Free Kick', apiField: 'free_kick' },
      ],
      'Dribbling': [
        { name: 'Dribbling', apiField: 'dribbling' },
        { name: 'Balance', apiField: 'balance' },
        { name: 'Agility', apiField: 'agility' },
        { name: 'Reactions', apiField: 'reactions' },
        { name: 'Ball Control', apiField: 'ball_control' },
      ],
      'Defending': [
        { name: 'Marking', apiField: 'marking' },
        { name: 'Standing Tackle', apiField: 'standing_tackle' },
        { name: 'Sliding Tackle', apiField: 'sliding_tackle' },
        { name: 'Awareness', apiField: 'awareness' },
        { name: 'Heading', apiField: 'heading' },
      ],
      'Physical': [
        { name: 'Strength', apiField: 'strength' },
        { name: 'Aggression', apiField: 'aggression' },
        { name: 'Jumping', apiField: 'jumping' },
        { name: 'Stamina', apiField: 'stamina_stat' },
      ],
    }
  },
  gk: {
    basic: [
      { name: 'Diving', apiField: 'gk_diving' },
      { name: 'Positioning', apiField: 'gk_positioning' },
      { name: 'Handling', apiField: 'gk_handling' },
      { name: 'Reflexes', apiField: 'gk_reflexes' },
      { name: 'Kicking', apiField: 'gk_kicking' },
      { name: 'Physical', apiField: 'physical' },
    ],
    advanced: {
      'Diving': [
        { name: 'GK Diving', apiField: 'gk_diving' },
      ],
      'Positioning': [
        { name: 'GK Positioning', apiField: 'gk_positioning' },
      ],
      'Handling': [
        { name: 'GK Handling', apiField: 'gk_handling' },
      ],
      'Reflexes': [
        { name: 'GK Reflexes', apiField: 'gk_reflexes' },
        { name: 'Jumping', apiField: 'jumping' },
      ],
      'Kicking': [
        { name: 'GK Kicking', apiField: 'gk_kicking' },
        { name: 'Long Passing', apiField: 'long_passing' },
      ],
      'Physical': [
        { name: 'Reactions', apiField: 'reactions' },
        { name: 'Agility', apiField: 'agility' },
        { name: 'Sprint Speed', apiField: 'sprint_speed' },
        { name: 'Strength', apiField: 'strength' },
      ],
    }
  }
};

// Open Compare Modal
function openCompareModal() {
  const modal = document.getElementById('compare-players-modal');
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    compareState.selectedPlayers = [];
    compareState.isBasicView = true;
    compareState.positionMode = null;

    renderCompareCards();
    updateCompareCountBadge();
    generateCompareStatsGrid();
  }
}

// Close Compare Modal
function closeCompareModal() {
  const modal = document.getElementById('compare-players-modal');
  if (!modal) return;
  const content = modal.querySelector('.compare-modal');
  if (content) content.classList.add('closing');
  setTimeout(() => {
    modal.style.display = 'none';
    if (content) content.classList.remove('closing');
    document.body.style.overflow = 'auto';
  }, 300);
}

// Render Player Cards
function renderCompareCards() {
  const grid = document.getElementById('compare-cards-grid');
  if (!grid) return;

  grid.innerHTML = '';

  compareState.selectedPlayers.forEach((player, index) => {
    const card = createFilledPlayerCard(player, index);
    grid.appendChild(card);
  });

  if (compareState.selectedPlayers.length < 5) {
    const emptyCard = createEmptyPlayerCard(compareState.selectedPlayers.length);
    grid.appendChild(emptyCard);
  }
}

function createEmptyPlayerCard(slotIndex) {
  const card = document.createElement('div');
  card.className = 'compare-player-card empty-state';
  card.onclick = () => openCompareSearch(slotIndex);
  card.innerHTML = `
    <div class="empty-icon">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        <line x1="11" y1="8" x2="11" y2="14"></line>
        <line x1="8" y1="11" x2="14" y2="11"></line>
      </svg>
    </div>
    <p class="empty-text">Add Player ${slotIndex + 1}</p>
  `;
  return card;
}

function createFilledPlayerCard(player, index) {
  const card = document.createElement('div');
  card.className = 'compare-player-card filled-state new-card';
  card.dataset.playerId = player.player_id;

  card.innerHTML = `
    <button class="player-remove-btn" onclick="removeComparePlayer(${index})">✕</button>
    <div class="player-image-wrapper">
      <img src="${player.player_image || 'https://via.placeholder.com/80x80'}" alt="${player.name}">
    </div>
    <div class="player-info">
      <h3 class="player-name">${player.name}</h3>
      <p class="player-position">${player.position}</p>
      <p class="player-team">${player.team || 'N/A'}</p>
      <div class="player-overall">
        <span class="overall-label">OVR</span>
        <span class="overall-value">${player.ovr || 'NA'}</span>
      </div>
    </div>
  `;
  return card;
}

function removeComparePlayer(index) {
  const cards = document.querySelectorAll('.compare-player-card.filled-state');
  if (cards[index]) {
    cards[index].classList.add('removing');
  }
  setTimeout(() => {
    compareState.selectedPlayers.splice(index, 1);
    if (compareState.selectedPlayers.length === 0) {
      compareState.positionMode = null;
    }
    renderCompareCards();
    updateCompareCountBadge();
    generateCompareStatsGrid();
  }, 300);
}

function updateCompareCountBadge() {
  const badge = document.getElementById('compare-count-badge');
  if (!badge) return;
  badge.textContent = `${compareState.selectedPlayers.length}/5`;
}

// Search modal
function openCompareSearch(slotIndex) {
  compareState.currentSlot = slotIndex;
  const modal = document.getElementById('compare-search-modal');
  if (!modal) return;
  modal.style.display = 'flex';

  const input = document.getElementById('compare-search-input');
  const results = document.getElementById('compare-search-results');
  if (input) {
    input.value = '';
    input.focus();
  }
  if (results) {
    results.innerHTML = `<p style="color:#A0AEC0;text-align:center;padding:20px;">Start typing to search players...</p>`;
  }
}

function closeCompareSearch() {
  const modal = document.getElementById('compare-search-modal');
  if (modal) modal.style.display = 'none';
}

// Search input handler
let compareSearchTimeout = null;
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('compare-search-input');
  if (!searchInput) return;
  searchInput.addEventListener('input', e => {
    clearTimeout(compareSearchTimeout);
    const q = e.target.value.trim();
    const resultsDiv = document.getElementById('compare-search-results');
    if (!q || q.length < 2) {
      if (resultsDiv) {
        resultsDiv.innerHTML = '<p style="color:#A0AEC0;text-align:center;padding:20px;">Type at least 2 characters...</p>';
      }
      return;
    }
    compareSearchTimeout = setTimeout(() => {
      searchComparePlayers(q);
    }, 300);
  });
});

async function searchComparePlayers(query) {
  const resultsDiv = document.getElementById('compare-search-results');
  if (!resultsDiv) return;
  resultsDiv.innerHTML = '<p style="color:#3B82F6;text-align:center;padding:20px;">Searching...</p>';

  try {
    if (!window.apiClient) throw new Error('API client not available');
    const resp = await window.apiClient.searchPlayers({ q: query, limit: 50, rank: 0 });
    const players = resp.results || resp.players || [];
    if (!players.length) {
      resultsDiv.innerHTML = `<p style="color:#A0AEC0;text-align:center;padding:20px;">No players found for "${query}"</p>`;
      return;
    }
    resultsDiv.innerHTML = '';
    players.forEach(p => resultsDiv.appendChild(createCompareSearchResultItem(p)));
  } catch (err) {
    console.error('[COMPARE] Search error', err);
    resultsDiv.innerHTML = '<p style="color:#ef4444;text-align:center;padding:20px;">Search error. Please try again.</p>';
  }
}

function createCompareSearchResultItem(player) {
  const item = document.createElement('div');
  item.className = 'compare-search-result-item';
  item.onclick = () => selectPlayerForComparison(player);
  item.innerHTML = `
    <div class="compare-search-result-image">
      <img src="${player.player_image || 'https://via.placeholder.com/60x60'}" alt="${player.name}">
    </div>
    <div class="compare-search-result-info">
      <h4>${player.name}</h4>
      <p>${player.position} • ${player.team || 'N/A'}</p>
    </div>
    <div class="compare-search-result-ovr">${player.ovr || 'NA'}</div>
  `;
  return item;
}

function selectPlayerForComparison(player) {
  if (compareState.selectedPlayers.some(p => p.player_id === player.player_id)) {
    showToast?.('This player is already in comparison', 'info');
    return;
  }
  const isGK = player.position === 'GK';
  if (compareState.positionMode === null) {
    compareState.positionMode = isGK ? 'gk' : 'outfield';
  } else {
    if (compareState.positionMode === 'gk' && !isGK) {
      showToast?.('Cannot add outfield players with goalkeepers', 'error');
      return;
    }
    if (compareState.positionMode === 'outfield' && isGK) {
      showToast?.('Cannot add goalkeepers with outfield players', 'error');
      return;
    }
  }
  compareState.selectedPlayers.push(player);
  closeCompareSearch();
  renderCompareCards();
  updateCompareCountBadge();
  generateCompareStatsGrid();
}

// Switch stats view
function switchCompareStatsView(view) {
  compareState.isBasicView = (view === 'basic');
  document.getElementById('basic-stats-btn')?.classList.toggle('active', view === 'basic');
  document.getElementById('advanced-stats-btn')?.classList.toggle('active', view === 'advanced');

  const title = document.getElementById('compare-stats-view-title');
  if (title) {
    title.textContent = view === 'basic' ? 'Major Stats Comparison' : 'Advanced Stats Breakdown';
  }
  generateCompareStatsGrid();
}

// Generate stats grid
function generateCompareStatsGrid() {
  const grid = document.getElementById('compare-stats-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const subtitle = document.getElementById('compare-stats-subtitle');
  if (compareState.selectedPlayers.length === 0) {
    if (subtitle) subtitle.textContent = 'Add at least 2 players to see comparison';
    return;
  }
  if (compareState.selectedPlayers.length === 1) {
    if (subtitle) subtitle.textContent = 'Add one more player to enable comparison';
  } else {
    if (subtitle) subtitle.textContent = `Comparing ${compareState.selectedPlayers.length} players`;
  }

  const mode = compareState.positionMode || 'outfield';
  const config = STATS_CONFIG[mode];

  if (compareState.isBasicView) {
    config.basic.forEach((stat, idx) => {
      const row = createStatRow(stat, false, idx);
      grid.appendChild(row);
    });
  } else {
    config.basic.forEach((mainStat, idx) => {
      const mainRow = createStatRow(mainStat, false, idx);
      grid.appendChild(mainRow);
      const subcats = config.advanced[mainStat.name];
      if (subcats) {
        subcats.forEach(sub => {
          const subRow = createStatRow(sub, true, idx);
          grid.appendChild(subRow);
        });
      }
    });
  }

  if (compareState.selectedPlayers.length >= 2) {
    const totalRow = createTotalStatsRow();
    grid.appendChild(totalRow);
  }
}

function createStatRow(stat, isSub, idx) {
  const row = document.createElement('div');
  row.className = 'stat-row' + (isSub ? ' subcategory-row' : '');
  row.style.animationDelay = `${idx * 30}ms`;

  const nameCell = document.createElement('div');
  nameCell.className = 'stat-name-cell';
  nameCell.textContent = isSub ? `↳ ${stat.name}` : stat.name;
  row.appendChild(nameCell);

  const values = compareState.selectedPlayers.map(p => Number(p[stat.apiField]) || 0);
  const colors = assignStatColors(values);

  compareState.selectedPlayers.forEach((player, i) => {
    const cell = document.createElement('div');
    cell.className = 'stat-value-cell';
    const span = document.createElement('span');
    span.className = `stat-value ${colors[i]}`;
    span.textContent = Number(player[stat.apiField]) || 0;
    cell.appendChild(span);
    row.appendChild(cell);
  });

  return row;
}

function createTotalStatsRow() {
  const row = document.createElement('div');
  row.className = 'stat-row total-row';

  const nameCell = document.createElement('div');
  nameCell.className = 'stat-name-cell';
  nameCell.textContent = '🏆 TOTAL STATS';
  row.appendChild(nameCell);

  const totals = compareState.selectedPlayers.map(player => {
    const mode = compareState.positionMode || 'outfield';
    const config = STATS_CONFIG[mode];
    const stats = compareState.isBasicView ? config.basic : getAllStats(config);
    return stats.reduce((sum, s) => sum + (Number(player[s.apiField]) || 0), 0);
  });

  const colors = assignStatColors(totals);
  totals.forEach((total, i) => {
    const cell = document.createElement('div');
    cell.className = 'stat-value-cell total-cell';
    const span = document.createElement('span');
    span.className = `total-stats-value ${colors[i]}`;
    span.textContent = total;
    cell.appendChild(span);
    row.appendChild(cell);
  });

  return row;
}

function getAllStats(config) {
  const all = [...config.basic];
  Object.values(config.advanced).forEach(group => {
    group.forEach(stat => {
      if (!all.some(s => s.apiField === stat.apiField)) {
        all.push(stat);
      }
    });
  });
  return all;
}

function assignStatColors(values) {
  const valid = values.filter(v => typeof v === 'number' && !isNaN(v));
  if (!valid.length) return values.map(() => 'neutral');
  const max = Math.max(...valid);
  const min = Math.min(...valid);
  const range = max - min;
  if (range === 0) return values.map(() => 'neutral');
  return values.map(v => {
    if (v === max) return 'green';
    if (v === min) return 'red';
    return 'yellow';
  });
}

console.log('[COMPARE] Player Comparison Tool initialized ✅');



// ============================================
// TOOLS MENU SYSTEM
// ============================================

function openToolsModal() {
  const modal = document.getElementById('tools-modal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeToolsModal() {
  const modal = document.getElementById('tools-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
}

function openToolsSheet() {
  const sheet = document.getElementById('tools-sheet');
  if (sheet) {
    sheet.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}



function closeToolsSheet() {
  const sheet = document.getElementById('tools-sheet');
  if (sheet) {
    sheet.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
}

function openTool(toolName) {
  closeToolsModal();
  closeToolsSheet();

  switch (toolName) {
    case 'squadbuilder':
      switchView('squadbuilder');
      openSquadBuilderModal();
      closeToolsModal();
      closeToolsSheet();
      break;
    case 'compare':
      openCompareModal();
      break;
    case 'cardgen':
      showToast('🎴 Card Generator coming soon', 'info');
      break;
    case 'programs':
      showToast('📋 Squad Programs coming soon', 'info');
      break;
    case 'pricetracker':
      showToast('📊 Price Tracker coming soon', 'info');
      break;
    case 'sync':
      showToast('🔄 Marketplace Sync coming soon', 'info');
      break;
    case 'watchlist':
      switchView('watchlist');
      closeToolsModal();
      closeToolsSheet();
      break;
    case 'calculator':
      openROIModal();
      closeToolsModal();
      closeToolsSheet();
      break;

    case 'shardcalculator':
      switchView('shard-calculator');
      closeToolsModal();
      closeToolsSheet();
      setTimeout(() => initShardCalculator(), 100);
      break;

    case 'eventguide':
      switchView('event-guide');
      closeToolsModal();
      closeToolsSheet();
      break;
  }
}

document.addEventListener('click', function (event) {
  const modal = document.getElementById('tools-modal');
  const modalContent = document.querySelector('.tools-modal-content');

  if (modal && modal.classList.contains('active')) {
    if (modalContent && !modalContent.contains(event.target)) {
      closeToolsModal();
    }
  }
});

document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape') {
    closeToolsModal();
    closeToolsSheet();
  }
});

function initializeToolsMenu() {
  const toolsBtn = document.querySelector('.tools-btn');

  if (!toolsBtn) return;

  toolsBtn.addEventListener('click', function (e) {
    e.stopPropagation();

    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      openToolsSheet();
    } else {
      openToolsModal();
    }
  });
}

let resizeTimeout;
window.addEventListener('resize', function () {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(function () {
    closeToolsModal();
    closeToolsSheet();
  }, 250);
});

if (document.getElementById('tools-sheet')) {
  const sheet = document.getElementById('tools-sheet');

  sheet.addEventListener('touchmove', function (e) {
    // Allow scrolling within the sheet
  }, { passive: true });
}






// ======== WATCHLIST FEATURE ========

// Extend state object with watchlist filters
state.watchlistFilters = {
  position: '',
  ratingMin: 40,
  ratingMax: 150,
  priceMin: null,
  priceMax: null,
  league: '',
  club: '',
  nation: '',
  skillMoves: ''
};

state.watchlistSearchQuery = '';
state.watchlistFilteredPlayers = [];
state.watchlistSortBy = 'ovr';
state.watchlistSortDirection = 'desc';

// Load watchlist when view is switched
async function loadWatchlist() {
  console.log('[WATCHLIST] Loading watchlist...');

  // Load saved filters
  const savedFilters = localStorage.getItem('watchlistFilters');
  if (savedFilters) {
    state.watchlistFilters = JSON.parse(savedFilters);
  }

  // Restore filter UI
  restoreWatchlistFilterUI();

  // Filter and render
  filterWatchlistPlayers();
  renderWatchlistPlayers();

  // Initialize event listeners
  initWatchlistEventListeners();

  console.log('[WATCHLIST] Watchlist loaded with', state.watchlist.length, 'players');
}

function restoreWatchlistFilterUI() {
  // Position
  const positionSelect = document.getElementById('watchlist-filter-position');
  if (positionSelect) {
    positionSelect.value = state.watchlistFilters.position || '';
  }

  // Rating
  const ratingMin = document.getElementById('watchlist-rating-min');
  const ratingMax = document.getElementById('watchlist-rating-max');
  if (ratingMin && ratingMax) {
    ratingMin.value = state.watchlistFilters.ratingMin || 40;
    ratingMax.value = state.watchlistFilters.ratingMax || 150;
    updateWatchlistRatingValue();
  }

  // Price
  const priceMin = document.getElementById('watchlist-price-min');
  const priceMax = document.getElementById('watchlist-price-max');
  if (priceMin && priceMax) {
    priceMin.value = state.watchlistFilters.priceMin || '';
    priceMax.value = state.watchlistFilters.priceMax || '';
    updateWatchlistPriceValue();
  }

  // League
  const leagueSelect = document.getElementById('watchlist-filter-league');
  if (leagueSelect) {
    leagueSelect.value = state.watchlistFilters.league || '';
  }

  // Club
  const clubSelect = document.getElementById('watchlist-filter-club');
  if (clubSelect) {
    clubSelect.value = state.watchlistFilters.club || '';
  }

  // Nation
  const nationInput = document.getElementById('watchlist-filter-nation-input');
  if (nationInput) {
    nationInput.value = state.watchlistFilters.nation || '';
    if (state.watchlistFilters.nation) {
      const flagUrl = getCountryFlagUrl(state.watchlistFilters.nation);
      const flagImg = document.getElementById('watchlist-filter-nation-flag');
      if (flagImg && flagUrl) {
        flagImg.src = flagUrl;
        flagImg.style.display = 'block';
      }
    }
  }

  // Skill Moves
  const skillMovesSelect = document.getElementById('watchlist-filter-skillmoves');
  if (skillMovesSelect) {
    skillMovesSelect.value = state.watchlistFilters.skillMoves || '';
  }
}

function initWatchlistEventListeners() {
  // Position filter
  const positionSelect = document.getElementById('watchlist-filter-position');
  if (positionSelect) {
    positionSelect.addEventListener('change', (e) => {
      state.watchlistFilters.position = e.target.value;
      saveWatchlistFilters();
      filterWatchlistPlayers();
      renderWatchlistPlayers();
      updateWatchlistFilterChips();
    });
  }

  // Rating min
  const ratingMin = document.getElementById('watchlist-rating-min');
  if (ratingMin) {
    ratingMin.addEventListener('input', (e) => {
      state.watchlistFilters.ratingMin = parseInt(e.target.value) || 40;
      updateWatchlistRatingValue();
      saveWatchlistFilters();
      filterWatchlistPlayers();
      renderWatchlistPlayers();
      updateWatchlistFilterChips();
    });
  }

  // Rating max
  const ratingMax = document.getElementById('watchlist-rating-max');
  if (ratingMax) {
    ratingMax.addEventListener('input', (e) => {
      state.watchlistFilters.ratingMax = parseInt(e.target.value) || 150;
      updateWatchlistRatingValue();
      saveWatchlistFilters();
      filterWatchlistPlayers();
      renderWatchlistPlayers();
      updateWatchlistFilterChips();
    });
  }

  // Price min
  const priceMin = document.getElementById('watchlist-price-min');
  if (priceMin) {
    priceMin.addEventListener('input', (e) => {
      state.watchlistFilters.priceMin = e.target.value || null;
      updateWatchlistPriceValue();
      saveWatchlistFilters();
      filterWatchlistPlayers();
      renderWatchlistPlayers();
      updateWatchlistFilterChips();
    });
  }

  // Price max
  const priceMax = document.getElementById('watchlist-price-max');
  if (priceMax) {
    priceMax.addEventListener('input', (e) => {
      state.watchlistFilters.priceMax = e.target.value || null;
      updateWatchlistPriceValue();
      saveWatchlistFilters();
      filterWatchlistPlayers();
      renderWatchlistPlayers();
      updateWatchlistFilterChips();
    });
  }

  // League filter
  const leagueSelect = document.getElementById('watchlist-filter-league');
  if (leagueSelect) {
    leagueSelect.addEventListener('change', (e) => {
      state.watchlistFilters.league = e.target.value;
      saveWatchlistFilters();
      filterWatchlistPlayers();
      renderWatchlistPlayers();
      updateWatchlistFilterChips();
    });
  }

  // Club filter
  const clubSelect = document.getElementById('watchlist-filter-club');
  if (clubSelect) {
    clubSelect.addEventListener('change', (e) => {
      state.watchlistFilters.club = e.target.value;
      saveWatchlistFilters();
      filterWatchlistPlayers();
      renderWatchlistPlayers();
      updateWatchlistFilterChips();
    });
  }

  // Skill Moves filter
  const skillMovesSelect = document.getElementById('watchlist-filter-skillmoves');
  if (skillMovesSelect) {
    skillMovesSelect.addEventListener('change', (e) => {
      state.watchlistFilters.skillMoves = e.target.value;
      saveWatchlistFilters();
      filterWatchlistPlayers();
      renderWatchlistPlayers();
      updateWatchlistFilterChips();
    });
  }

  // Search
  const searchInput = document.getElementById('watchlist-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.watchlistSearchQuery = e.target.value.toLowerCase();
      filterWatchlistPlayers();
      renderWatchlistPlayers();

      const clearBtn = document.getElementById('watchlist-search-clear');
      if (clearBtn) {
        clearBtn.style.display = state.watchlistSearchQuery ? 'block' : 'none';
      }
    });
  }

  // Search clear
  const searchClear = document.getElementById('watchlist-search-clear');
  if (searchClear) {
    searchClear.addEventListener('click', () => {
      const searchInput = document.getElementById('watchlist-search-input');
      if (searchInput) {
        searchInput.value = '';
        state.watchlistSearchQuery = '';
        filterWatchlistPlayers();
        renderWatchlistPlayers();
        searchClear.style.display = 'none';
      }
    });
  }

  // Sort
  const sortSelect = document.getElementById('watchlist-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      const value = e.target.value;
      if (value === 'ovr') {
        state.watchlistSortBy = 'overall_rating';
      } else if (value === 'price') {
        state.watchlistSortBy = 'price';
      } else if (value === 'name') {
        state.watchlistSortBy = 'name';
      } else if (value === 'position') {
        state.watchlistSortBy = 'position';
      }
      filterWatchlistPlayers();
      renderWatchlistPlayers();
    });
  }

  // Clear all filters
  const clearBtn = document.getElementById('watchlist-clear-filters');
  if (clearBtn) {
    clearBtn.addEventListener('click', clearAllWatchlistFilters);
  }

  // Browse Players button
  const browseBtn = document.getElementById('watchlist-browse-players-btn');
  if (browseBtn) {
    browseBtn.addEventListener('click', () => {
      switchView('database');
    });
  }

  // Mobile filter toggle
  const filterToggle = document.getElementById('watchlist-filter-toggle');
  if (filterToggle) {
    filterToggle.addEventListener('click', toggleWatchlistFiltersPanel);
  }

  // Nation autocomplete
  initWatchlistNationAutocomplete();
}

function initWatchlistNationAutocomplete() {
  const input = document.getElementById('watchlist-filter-nation-input');
  const list = document.getElementById('watchlist-filter-nation-list');
  const flagImg = document.getElementById('watchlist-filter-nation-flag');

  if (!input || !list) return;

  function render(items) {
    list.innerHTML = '';
    items.forEach(country => {
      const div = document.createElement('div');
      div.className = 'autocomplete-item';
      const flagUrl = getCountryFlagUrl(country);
      div.innerHTML = `
        ${flagUrl ? `<img src="${flagUrl}" alt="${country}" style="width: 16px; height: 16px; border-radius: 2px;">` : ''}
        <span class="autocomplete-text">${country}</span>
      `;
      div.addEventListener('mousedown', (e) => {
        e.preventDefault();
        selectWatchlistNation(country);
      });
      list.appendChild(div);
    });
  }

  function selectWatchlistNation(country) {
    input.value = country;
    list.innerHTML = '';
    list.style.display = 'none';

    state.watchlistFilters.nation = country;

    const flagUrl = getCountryFlagUrl(country);
    if (flagUrl) {
      flagImg.src = flagUrl;
      flagImg.style.display = 'block';
    } else {
      flagImg.style.display = 'none';
    }

    saveWatchlistFilters();
    filterWatchlistPlayers();
    renderWatchlistPlayers();
    updateWatchlistFilterChips();
  }

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) {
      list.style.display = 'none';
      flagImg.style.display = 'none';
      flagImg.src = '';
      return;
    }

    const matches = COUNTRIES.filter(c => c.toLowerCase().includes(q)).slice(0, 40);
    render(matches);
    list.style.display = 'block';
  });

  document.addEventListener('click', e => {
    if (!input.contains(e.target) && !list.contains(e.target)) {
      list.innerHTML = '';
      list.style.display = 'none';
    }
  });
}

function updateWatchlistRatingValue() {
  const min = document.getElementById('watchlist-rating-min').value || 40;
  const max = document.getElementById('watchlist-rating-max').value || 150;
  const valueSpan = document.getElementById('watchlist-rating-value');
  if (valueSpan) {
    valueSpan.textContent = `${min}-${max}`;
  }
}

function updateWatchlistPriceValue() {
  const min = document.getElementById('watchlist-price-min').value;
  const max = document.getElementById('watchlist-price-max').value;
  const valueSpan = document.getElementById('watchlist-price-value');

  if (valueSpan) {
    if (!min && !max) {
      valueSpan.textContent = 'Any';
    } else if (min && max) {
      valueSpan.textContent = `${min}-${max}`;
    } else if (min) {
      valueSpan.textContent = `${min}+`;
    } else {
      valueSpan.textContent = `Up to ${max}`;
    }
  }
}

function filterWatchlistPlayers(playersSource) {
  // Use passed source or fall back to saved storage
  let filtered = playersSource || JSON.parse(localStorage.getItem('watchlistPlayers')) || [];

  // Apply position filter
  if (state.watchlistFilters.position) {
    filtered = filtered.filter(p => p.position === state.watchlistFilters.position);
  }

  // Apply rating range
  filtered = filtered.filter(p => {
    const rating = p.ovr || p.overall_rating || 0; // Handle both key names
    return rating >= state.watchlistFilters.ratingMin && rating <= state.watchlistFilters.ratingMax;
  });

  // Apply league filter
  if (state.watchlistFilters.league) {
    filtered = filtered.filter(p => p.league === state.watchlistFilters.league);
  }

  // Apply club filter
  if (state.watchlistFilters.club) {
    filtered = filtered.filter(p => p.team === state.watchlistFilters.club);
  }

  // Apply nation filter
  if (state.watchlistFilters.nation) {
    filtered = filtered.filter(p => p.nation === state.watchlistFilters.nation);
  }

  // Apply skill moves
  if (state.watchlistFilters.skillMoves) {
    const skillLevel = parseInt(state.watchlistFilters.skillMoves);
    filtered = filtered.filter(p => (p.skill_moves || 0) >= skillLevel);
  }

  // Apply search
  if (state.watchlistSearchQuery) {
    const q = state.watchlistSearchQuery.toLowerCase();
    filtered = filtered.filter(p => {
      return (
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.position && p.position.toLowerCase().includes(q)) ||
        (p.team && p.team.toLowerCase().includes(q))
      );
    });
  }

  // Apply sort
  filtered.sort((a, b) => {
    let aVal, bVal;

    // Normalize keys (API sometimes uses 'ovr', sometimes 'overall_rating')
    const getOvr = (p) => p.ovr || p.overall_rating || 0;

    if (state.watchlistSortBy === 'ovr' || state.watchlistSortBy === 'overall_rating') {
      aVal = getOvr(a);
      bVal = getOvr(b);
    } else if (state.watchlistSortBy === 'price') {
      aVal = a.price || 0;
      bVal = b.price || 0;
    } else if (state.watchlistSortBy === 'name') {
      aVal = (a.name || '').toLowerCase();
      bVal = (b.name || '').toLowerCase();
    } else if (state.watchlistSortBy === 'position') {
      aVal = (a.position || '').toLowerCase();
      bVal = (b.position || '').toLowerCase();
    }

    if (state.watchlistSortDirection === 'desc') {
      return typeof aVal === 'string' ? aVal.localeCompare(bVal) : bVal - aVal;
    } else {
      return typeof aVal === 'string' ? bVal.localeCompare(aVal) : aVal - bVal;
    }
  });

  state.watchlistFilteredPlayers = filtered;
}


function renderWatchlistPlayers() {
  const grid = document.getElementById('watchlist-grid');
  const emptyState = document.getElementById('watchlist-empty-state');
  const countBadge = document.getElementById('watchlist-count-badge');

  if (!grid || !emptyState) return;

  // Update count badge
  if (countBadge) {
    countBadge.textContent = `${state.watchlist.length} Player${state.watchlist.length !== 1 ? 's' : ''}`;
  }

  // CASE 1: Watchlist is completely empty (User has never added anyone)
  if (state.watchlist.length === 0) {
    grid.innerHTML = '';
    grid.style.display = 'none';
    emptyState.style.display = 'flex'; // Show "Browse Players" button
    return; // Stop here
  }

  // CASE 2: Watchlist has players, but filters match nothing
  if (state.watchlistFilteredPlayers.length === 0) {
    grid.innerHTML = `
      <div class="no-results" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
        <div style="font-size: 24px; margin-bottom: 10px;">🔍</div>
        <h3 style="color: var(--color-text-primary); margin-bottom: 5px;">No players match your filters</h3>
        <p style="color: var(--color-text-secondary);">Try clearing filters or search.</p>
      </div>
    `;
    grid.style.display = 'grid'; // Show the "No Results" message
    emptyState.style.display = 'none'; // Hide "Browse Players"
    return;
  }

  // CASE 3: Show Players
  grid.innerHTML = '';
  grid.style.display = 'grid';
  emptyState.style.display = 'none';

  state.watchlistFilteredPlayers.forEach((player, index) => {
    const card = createWatchlistPlayerCard(player);
    // Add simple fade-in animation
    card.style.animation = `fadeIn 0.3s ease ${index * 0.05}s both`;
    grid.appendChild(card);
  });
}


function createWatchlistPlayerCard(player) {
  const card = document.createElement('div');
  card.className = 'player-card';
  card.dataset.playerId = player.player_id;

  const overallColor = getRatingColor(player.overall_rating);

  card.innerHTML = `
    <div class="player-card-header">
      <div class="player-card-rating" style="background: ${overallColor};">
        <span>${player.overall_rating || 'N/A'}</span>
      </div>
      <button class="player-card-watchlist-btn" data-player-id="${player.player_id}" title="Remove from watchlist">
        ❌
      </button>
    </div>
    <div class="player-card-body">
      <h3 class="player-card-name">${player.name || 'Unknown'}</h3>
      <p class="player-card-position">${player.position || 'N/A'} • ${player.team || 'N/A'}</p>
      <div class="player-card-info">
        <span class="player-info-item">
          <span class="info-label">Nation</span>
          ${getCountryFlagUrl(player.nation) ? `<img src="${getCountryFlagUrl(player.nation)}" alt="${player.nation}" style="width: 16px; height: 16px; border-radius: 2px;">` : ''}
          <span>${player.nation || 'N/A'}</span>
        </span>
      </div>
    </div>
  `;

  // Remove from watchlist button
  const removeBtn = card.querySelector('.player-card-watchlist-btn');
  if (removeBtn) {
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeFromWatchlist(player.player_id);
    });
  }

  return card;
}

function removeFromWatchlist(playerId) {
  state.watchlist = state.watchlist.filter(p => p.player_id !== playerId);
  localStorage.setItem('watchlist', JSON.stringify(state.watchlist));

  filterWatchlistPlayers();
  renderWatchlistPlayers();

  showToast('Player removed from watchlist', 'success');
}

function clearAllWatchlistFilters() {
  state.watchlistFilters = {
    position: '',
    ratingMin: 40,
    ratingMax: 150,
    priceMin: null,
    priceMax: null,
    league: '',
    club: '',
    nation: '',
    skillMoves: ''
  };

  state.watchlistSearchQuery = '';

  // Reset UI
  document.getElementById('watchlist-filter-position').value = '';
  document.getElementById('watchlist-rating-min').value = 40;
  document.getElementById('watchlist-rating-max').value = 150;
  document.getElementById('watchlist-price-min').value = '';
  document.getElementById('watchlist-price-max').value = '';
  document.getElementById('watchlist-filter-league').value = '';
  document.getElementById('watchlist-filter-club').value = '';
  document.getElementById('watchlist-filter-nation-input').value = '';
  document.getElementById('watchlist-filter-skillmoves').value = '';
  document.getElementById('watchlist-search-input').value = '';

  const flagImg = document.getElementById('watchlist-filter-nation-flag');
  if (flagImg) {
    flagImg.style.display = 'none';
    flagImg.src = '';
  }

  updateWatchlistRatingValue();
  updateWatchlistPriceValue();

  saveWatchlistFilters();
  filterWatchlistPlayers();
  renderWatchlistPlayers();
  updateWatchlistFilterChips();
}

function updateWatchlistFilterChips() {
  const container = document.getElementById('watchlist-active-filters');
  if (!container) return;

  // FIX: Clear the container and do NOT render any chips.
  // This keeps the filters active in the background but hides the visual tags.
  container.innerHTML = '';
  container.style.display = 'none';


  const chips = [];

  if (state.watchlistFilters.position) {
    chips.push({ name: 'Position', value: state.watchlistFilters.position, type: 'position' });
  }
  if (state.watchlistFilters.ratingMin !== 40 || state.watchlistFilters.ratingMax !== 150) {
    chips.push({ name: 'Rating', value: `${state.watchlistFilters.ratingMin}-${state.watchlistFilters.ratingMax}`, type: 'rating' });
  }
  if (state.watchlistFilters.league) {
    chips.push({ name: 'League', value: state.watchlistFilters.league, type: 'league' });
  }
  if (state.watchlistFilters.club) {
    chips.push({ name: 'Club', value: state.watchlistFilters.club, type: 'club' });
  }
  if (state.watchlistFilters.nation) {
    chips.push({ name: 'Nation', value: state.watchlistFilters.nation, type: 'nation' });
  }
  if (state.watchlistFilters.skillMoves) {
    const skillLabels = { '1': '★', '2': '★★', '3': '★★★', '4': '★★★★', '5': '★★★★★' };
    chips.push({ name: 'Skill Moves', value: skillLabels[state.watchlistFilters.skillMoves] || state.watchlistFilters.skillMoves, type: 'skillMoves' });
  }

  container.innerHTML = '';
  chips.forEach(chip => {
    const el = document.createElement('div');
    el.className = 'filter-chip';
    el.innerHTML = `
      <span>${chip.name}: <strong>${chip.value}</strong></span>
      <button type="button" data-filter-type="${chip.type}">✕</button>
    `;
    el.querySelector('button').addEventListener('click', () => {
      removeWatchlistFilter(chip.type);
    });
    container.appendChild(el);
  });
}

function removeWatchlistFilter(filterType) {
  if (filterType === 'position') {
    state.watchlistFilters.position = '';
    document.getElementById('watchlist-filter-position').value = '';
  } else if (filterType === 'rating') {
    state.watchlistFilters.ratingMin = 40;
    state.watchlistFilters.ratingMax = 150;
    document.getElementById('watchlist-rating-min').value = 40;
    document.getElementById('watchlist-rating-max').value = 150;
    updateWatchlistRatingValue();
  } else if (filterType === 'league') {
    state.watchlistFilters.league = '';
    document.getElementById('watchlist-filter-league').value = '';
  } else if (filterType === 'club') {
    state.watchlistFilters.club = '';
    document.getElementById('watchlist-filter-club').value = '';
  } else if (filterType === 'nation') {
    state.watchlistFilters.nation = '';
    document.getElementById('watchlist-filter-nation-input').value = '';
    const flagImg = document.getElementById('watchlist-filter-nation-flag');
    if (flagImg) {
      flagImg.style.display = 'none';
      flagImg.src = '';
    }
  } else if (filterType === 'skillMoves') {
    state.watchlistFilters.skillMoves = '';
    document.getElementById('watchlist-filter-skillmoves').value = '';
  }

  saveWatchlistFilters();
  filterWatchlistPlayers();
  renderWatchlistPlayers();
  updateWatchlistFilterChips();
}

function toggleWatchlistFiltersPanel() {
  const sidebar = document.getElementById('watchlist-filters-sidebar');
  if (sidebar) {
    sidebar.classList.toggle('mobile-open');
  }
}

function saveWatchlistFilters() {
  localStorage.setItem('watchlistFilters', JSON.stringify(state.watchlistFilters));
}

function getWatchlistCount() {
  return state.watchlist.length;
}

// Helper function to get color for rating
function getRatingColor(rating) {
  if (!rating) return '#666';
  if (rating >= 90) return '#FFD700';
  if (rating >= 80) return '#C0C0C0';
  if (rating >= 70) return '#CD7F32';
  return '#666';
}



/* ------------- from here filter and stats for squad builder -------------------------------*/
/* ------------- from here filter and stats for squad builder -------------------------------*/

// Listen for filter changes in squad builder
document.addEventListener('filterChanged', () => {
  // If squad builder is open, update filtered players
  if (squadState && typeof applyFiltersToPickerPlayers === 'function') {
    applyFiltersToPickerPlayers();
  }

});
