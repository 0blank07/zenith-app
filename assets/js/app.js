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

// ====================================
// STAT MAPPING FOR CUSTOM STATS DISPLAY
// ====================================
// ====================================
// STAT MAPPING - CORRECT COLUMN NAMES FROM API
// ====================================
const STAT_MAPPING = {
    // Pace
    'acceleration': { key: 'acceleration', label: 'ACC' },
    'sprint_speed': { key: 'sprint_speed', label: 'SPD' },
    'sprint-speed': { key: 'sprint_speed', label: 'SPD' },

    // Shooting
    'finishing': { key: 'finishing', label: 'FIN' },
    'long_shot': { key: 'long_shot', label: 'LSH' },
    'long-shot': { key: 'long_shot', label: 'LSH' },
    'shot_power': { key: 'shot_power', label: 'POW' },
    'shot-power': { key: 'shot_power', label: 'POW' },
    'positioning': { key: 'positioning', label: 'POS' },
    'volley': { key: 'volley', label: 'VOL' },
    'penalties': { key: 'penalties', label: 'PEN' },

    // Passing
    'short_passing': { key: 'short_passing', label: 'SPA' },
    'short-passing': { key: 'short_passing', label: 'SPA' },
    'long_passing': { key: 'long_passing', label: 'LPA' },
    'long-passing': { key: 'long_passing', label: 'LPA' },
    'crossing': { key: 'crossing', label: 'CRO' },
    'vision': { key: 'vision', label: 'VIS' },
    'curve': { key: 'curve', label: 'CUR' },
    'free_kick': { key: 'free_kick', label: 'FK' },
    'free-kick': { key: 'free_kick', label: 'FK' },

    // Dribbling
    'dribbling': { key: 'dribbling', label: 'DRI' },
    'ball_control': { key: 'ball_control', label: 'B.CON' },
    'ball-control': { key: 'ball_control', label: 'B.CON' },
    'agility': { key: 'agility', label: 'AGI' },
    'balance': { key: 'balance', label: 'BAL' },
    'reactions': { key: 'reactions', label: 'REA' },

    // Defending
    'marking': { key: 'marking', label: 'MAR' },
    'standing_tackle': { key: 'standing_tackle', label: 'STA' },
    'standing-tackle': { key: 'standing_tackle', label: 'STA' },
    'sliding_tackle': { key: 'sliding_tackle', label: 'SLD' },
    'sliding-tackle': { key: 'sliding_tackle', label: 'SLD' },
    'interceptions': { key: 'interceptions', label: 'INT' },
    'heading': { key: 'heading', label: 'HEA' },

    // Physical
    'strength': { key: 'strength', label: 'STR' },
    'jumping': { key: 'jumping', label: 'JUM' },
    'stamina': { key: 'stamina_stat', label: 'STA' },
    'aggression': { key: 'aggression', label: 'AGG' },
    'awareness': { key: 'awareness', label: 'AWR' },

    // Goalkeeper
    'gk_diving': { key: 'gk_diving', label: 'DIV' },
    'gk-diving': { key: 'gk_diving', label: 'DIV' },
    'gk_handling': { key: 'gk_handling', label: 'HAN' },
    'gk-handling': { key: 'gk_handling', label: 'HAN' },
    'gk_kicking': { key: 'gk_kicking', label: 'KIC' },
    'gk-kicking': { key: 'gk_kicking', label: 'KIC' },
    'gk_positioning': { key: 'gk_positioning', label: 'GPO' },
    'gk-positioning': { key: 'gk_positioning', label: 'GPO' },
    'gk_reflexes': { key: 'gk_reflexes', label: 'REF' },
    'gk-reflexes': { key: 'gk_reflexes', label: 'REF' }
};



// ========== ANIMATED RANK ICON SYSTEM ==========
const RANK_CONFIG = {
    frameCount: 36,     // ✅ 36 frames total
    fps: 18,            // 36 FPS
    frameWidth: 32,     // ✅ 192px ÷ 6 = 32px per frame
    frameHeight: 32,    // ✅ 192px ÷ 6 = 32px per frame
    columns: 6,         // ✅ 6 columns per row
    rows: 6,            // ✅ 6 rows total
    ranks: {
        1: 'assets/images/ranks/green_rank.png',
        2: 'assets/images/ranks/blue_rank.png',
        3: 'assets/images/ranks/purple_rank.png',
        4: 'assets/images/ranks/red_rank.png',
        5: 'assets/images/ranks/gold_rank.png',
    },
    skillPoints: {
        0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5
    },
    rankNames: {
        0: 'Base', 1: 'Green', 2: 'Blue', 3: 'Purple', 4: 'Red', 5: 'Gold'
    },
    rankColors: {
        0: '#98A0A6', 1: '#3BD671', 2: '#6366F1', 3: '#8B5CF6', 4: '#FF6B6B', 5: '#FFB86B'
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
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔵 [TOGGLE PLAYER] Called with uniqueId:', uniqueId);
    console.log('🔵 [TOGGLE PLAYER] Current view:', state.currentView);
    
    if (typeof window.toggleWatchlist === 'function') {
        console.log('✅ [TOGGLE PLAYER] window.toggleWatchlist EXISTS');
        
        // Check before state
        const wasInWatchlist = state.watchlist.includes(uniqueId);
        console.log('📋 [TOGGLE PLAYER] Was in watchlist BEFORE:', wasInWatchlist);
        console.log('📋 [TOGGLE PLAYER] Watchlist count BEFORE:', state.watchlist.length);
        
        // Call the toggle function
        window.toggleWatchlist(uniqueId);
        
        // Check after state
        const isInWatchlist = state.watchlist.includes(uniqueId);
        console.log('📋 [TOGGLE PLAYER] Is in watchlist AFTER:', isInWatchlist);
        console.log('📋 [TOGGLE PLAYER] Watchlist count AFTER:', state.watchlist.length);
        
        // Re-render player detail if viewing a player
        if (state && state.selectedPlayer) {
            console.log('🔄 [TOGGLE PLAYER] Re-rendering player detail...');
            renderPlayerDetail(state.selectedPlayer);
        }
        
        // ✅ NEW: If we're in watchlist view, reload it
        if (state.currentView === 'watchlist') {
            console.log('🔄 [TOGGLE PLAYER] Currently in watchlist view - reloading...');
            
            if (typeof window.loadWatchlistData === 'function') {
                setTimeout(() => {
                    window.loadWatchlistData();
                    console.log('✅ [TOGGLE PLAYER] Watchlist view reloaded');
                }, 100);
            } else if (typeof window.initProfessionalWatchlist === 'function') {
                setTimeout(() => {
                    window.initProfessionalWatchlist();
                    console.log('✅ [TOGGLE PLAYER] Watchlist view re-initialized');
                }, 100);
            } else {
                console.warn('⚠️ [TOGGLE PLAYER] No watchlist reload function found');
            }
        }
        
        console.log('✅ [TOGGLE PLAYER] Complete');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
    } else {
        console.error('❌ [TOGGLE PLAYER] window.toggleWatchlist NOT FOUND!');
        console.log('   Available toggle functions:', Object.keys(window).filter(k => k.includes('toggle')));
    }
};

const getStat = (obj, ...names) => {
    for (const n of names) {
        if (obj?.[n] !== undefined && obj?.[n] !== null) return obj[n];
    }
    return 0;
};

window.getStat = getStat;

window.renderPlayerStatsSection = function(player) {
    if (!player) return '';

    console.log('[STATS] Rendering stats for player:', player.player_id, 'Boosts:', {
        training: player.training_boosts,
        skills: player.skill_boosts
    });

    const isGoalkeeper = player.position === 'GK';

    const getBaseColor = (value) => {
        if (value >= 90) return '#3BD671';
        if (value >= 80) return '#00C2A8';
        if (value >= 70) return '#FFB86B';
        return '#98A0A6';
    };

    const getStatWithBoost = (player, boosts, ...names) => {
        let baseStat = getStat(player, ...names);
        if (!boosts) return baseStat;

        for (const name of names) {
            const normalizedName = name.toLowerCase().replace(/_/g, '');
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

    let statCategories;
    if (isGoalkeeper) {
        statCategories = [
            {
                name: 'Diving',
                key: 'diving',
                mainValue: getStatWithBoost(player, player.training_boosts, 'diving'),
                substats: [
                    { label: 'GK Diving', value: getStatWithBoost(player, player.training_boosts, 'gk_diving', 'diving') }
                ]
            },
            {
                name: 'Positioning',
                key: 'gk_positioning',
                mainValue: getStatWithBoost(player, player.training_boosts, 'gk_positioning', 'positioning'),
                substats: [
                    { label: 'GK Positioning', value: getStatWithBoost(player, player.training_boosts, 'gk_positioning', 'positioning') }
                ]
            },
            {
                name: 'Handling',
                key: 'handling',
                mainValue: getStatWithBoost(player, player.training_boosts, 'handling'),
                substats: [
                    { label: 'GK Handling', value: getStatWithBoost(player, player.training_boosts, 'gk_handling', 'handling') }
                ]
            },
            {
                name: 'Reflexes',
                key: 'reflexes',
                mainValue: getStatWithBoost(player, player.training_boosts, 'reflexes'),
                substats: [
                    { label: 'GK Reflexes', value: getStatWithBoost(player, player.training_boosts, 'gk_reflexes', 'reflexes') },
                    { label: 'Jumping', value: getStatWithBoost(player, player.training_boosts, 'jumping') }
                ]
            },
            {
                name: 'Kicking',
                key: 'kicking',
                mainValue: getStatWithBoost(player, player.training_boosts, 'kicking'),
                substats: [
                    { label: 'GK Kicking', value: getStatWithBoost(player, player.training_boosts, 'gk_kicking', 'kicking') },
                    { label: 'Long Passing', value: getStatWithBoost(player, player.training_boosts, 'long_passing') }
                ]
            },
            {
                name: 'Physical',
                key: 'physical',
                mainValue: calculateGKPhysicalWithBoosts(player, player.training_boosts),
                substats: [
                    { label: 'Reactions', value: getStatWithBoost(player, player.training_boosts, 'reactions') },
                    { label: 'Agility', value: getStatWithBoost(player, player.training_boosts, 'agility') },
                    { label: 'Sprint Speed', value: getStatWithBoost(player, player.training_boosts, 'sprint_speed') },
                    { label: 'Strength', value: getStatWithBoost(player, player.training_boosts, 'strength') }
                ]
            }
        ];
    } else {
        statCategories = [
            {
                name: 'Pace',
                key: 'pace',
                mainValue: calculatePaceWithBoosts(player, player.training_boosts),
                substats: [
                    { label: 'Acceleration', value: getStatWithBoost(player, player.training_boosts, 'acceleration') },
                    { label: 'Sprint Speed', value: getStatWithBoost(player, player.training_boosts, 'sprint_speed') }
                ]
            },
            {
                name: 'Shooting',
                key: 'shooting',
                mainValue: calculateShootingWithBoosts(player, player.training_boosts),
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
                mainValue: calculatePassingWithBoosts(player, player.training_boosts),
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
                mainValue: calculateDribblingWithBoosts(player, player.training_boosts),
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
                mainValue: calculateDefendingWithBoosts(player, player.training_boosts),
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
                mainValue: calculatePhysicalWithBoosts(player, player.training_boosts),
                substats: [
                    { label: 'Strength', value: getStatWithBoost(player, player.training_boosts, 'strength') },
                    { label: 'Aggression', value: getStatWithBoost(player, player.training_boosts, 'aggression') },
                    { label: 'Jumping', value: getStatWithBoost(player, player.training_boosts, 'jumping') },
                    { label: 'Stamina', value: getStatWithBoost(player, player.training_boosts, 'stamina_stat', 'stamina') }
                ]
            }
        ];
    }

    const sorted = [...statCategories]
        .map(c => ({ key: c.key, value: c.mainValue }))
        .sort((a, b) => b.value - a.value);

    const majorColors = {};
    sorted.forEach((item, idx) => {
        if (idx <= 2) majorColors[item.key] = '#3BD671';
        else if (idx <= 4) majorColors[item.key] = '#FFB86B';
        else majorColors[item.key] = '#FF6B6B';
    });

    const getMajorColor = (cat) => majorColors[cat.key] || getBaseColor(cat.mainValue);

    const MAX_BAR = 280;
    const clampBarWidth = (value) => {
        const v = Math.max(0, Math.min(Number(value) || 0, MAX_BAR));
        return (v / MAX_BAR) * 100;
    };

    return `
        <div class="player-stats-section" style="
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
    `;
};




async function renderPlayerDetail(player) {
    const container = document.getElementById('player-detail-view');
    if (!container) return;

    cleanupRankAnimations();

    // 🔁 Refresh market price based on current rank
    if (window.supabaseProvider && typeof window.supabaseProvider.syncPrices === 'function') {
      await window.supabaseProvider.syncPrices([player]);
    }

    const uniqueId = `${player.player_id}_${player.rank || 0}_${player.is_untradable ? 1 : 0}`;
    const isWatchlisted = state.watchlist && state.watchlist.includes(uniqueId);

    const nationField = player.nation_region || player.nation || '';
    const flagUrl = typeof getCountryFlagUrl === 'function' ? getCountryFlagUrl(nationField) : '';

    const rankIconHtml = '';  // Disable blinking rank icon


    const statsMarkup = window.renderPlayerStatsSection(player);

    container.innerHTML = `
        <div style="background: rgba(20, 24, 28, 0.5); backdrop-filter: blur(25px); border: 1px solid rgba(255, 255, 255, 0.15); min-height: 100vh; padding: 0; border-radius: 16px;">
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
                       

                            <div class="player-detail-mini-card" style="
                                width: 260px;
                                height: 260px;
                                margin: 0 auto 24px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                position: relative;
                                overflow: hidden;
                            ">
                                
                                <img src="${player.card_background || 'https://via.placeholder.com/300x400'}"
                                                alt="Card Background"
                                                class="card-background-img-inside"
                                                onerror="this.src='https://via.placeholder.com/300x400'">

                                            <img src="${player.player_image || 'https://via.placeholder.com/200x300'}"
                                                alt="${player.name}"
                                                class="player-image-img-inside"
                                                onerror="this.src='https://via.placeholder.com/200x300'">

                                            <div class="card-ovr-inside" style="color: ${player.color_rating || '#FFFFFF'}">
                                                ${player.ovr && player.ovr > 0 ? player.ovr : 'N/A'}
                                            </div>

                                            <div class="card-position-inside" style="color: ${player.color_position || '#FFFFFF'}">
                                                ${player.position || 'N/A'}
                                            </div>

                                            <div class="card-player-name-inside" style="color: ${player.color_name || '#FFFFFF'}">
                                                ${player.name}
                                            </div>

                                            <img src="${player.nation_flag || ''}"
                                                alt="Nation"
                                                class="card-nation-flag-inside"
                                                onerror="this.style.display='none'">

                                            <img src="${player.club_flag || ''}"
                                                alt="Club"
                                                class="card-club-flag-inside"
                                                onerror="this.style.display='none'">
                                
                                

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
                        ${await buildRankSelectionSection(player)}
                        
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

                        <!-- 📈 PRICE HISTORY SECTION -->
                        <div class="player-price-history-section" data-auctionable="${player.price ? 'true' : 'false'}">
                          <div class="price-history-header">
                            <div>
                              <h3>📈 Price History</h3>
                              <span class="price-history-subtitle">Track market movement over time</span>
                            </div>
                            <div class="price-history-ranges" role="tablist" aria-label="Price history ranges">
                              ${['1D','3D','7D','15D','30D','Custom'].map((label) => {
                                const isActive = label === '7D';
                                return `<button class="price-range-btn ${isActive ? 'active' : ''}" data-range="${label}" type="button">${label}</button>`;
                              }).join('')}
                            </div>
                          </div>
                          <div class="price-history-custom">
                            <div class="price-history-custom-label">
                              Custom range: <span id="price-history-custom-days">7</span> days
                            </div>
                            <input class="price-history-slider" id="price-history-slider" type="range" min="1" max="30" value="7">
                          </div>
                          <div class="price-history-body">
                            <div class="price-history-loading" id="price-history-loading">
                              <div class="price-history-skeleton"></div>
                              <div class="price-history-skeleton"></div>
                              <div class="price-history-skeleton"></div>
                            </div>
                            <div class="price-history-empty" id="price-history-empty">
                              No price data available for this range.
                            </div>
                            <div class="price-history-chart">
                              <canvas id="player-price-history-chart"></canvas>
                            </div>
                          </div>
                        </div>
                    </div>

                </div>
            </div>

            ${statsMarkup}
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
                    width: 42px !important;
                    height: 42px !important;
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

    const detailCard = container.querySelector('.player-detail-mini-card');
    if (typeof applyRankOverlay === 'function') {
        applyRankOverlay(detailCard, player.rank || 0, {
            scope: 'player-detail',
            modifierClass: 'rank-overlay--player-detail'
        });
    }

    setTimeout(() => {
        renderPlayerSkills(player);
        initAllRankAnimations();
        if (typeof window.initPlayerPriceHistory === 'function') {
          window.initPlayerPriceHistory(player);
        }
    }, 100);
}

window.updatePlayerStatsSection = function(player) {
    const container = document.getElementById('player-detail-view');
    if (!container) {
        console.warn('[STATS] Player detail container not found - skipping stats update.');
        return;
    }

    const statsSection = container.querySelector('.player-stats-section');
    if (!statsSection) {
        console.warn('[STATS] Stats section not found - skipping stats update.');
        return;
    }

    console.log('[STATS] Re-rendering player detail stats section for:', player.player_id);
    statsSection.outerHTML = window.renderPlayerStatsSection(player);
};

// ==================== PRICE HISTORY (PLAYER DETAIL) ====================
window.initPlayerPriceHistory = function(player) {
  const container = document.querySelector('.player-price-history-section');
  if (!container || !player) return;

  const isAuctionable = !!player.price;
  container.style.display = isAuctionable ? '' : 'none';
  console.log('[PRICE HISTORY] Auctionable:', isAuctionable);
  if (!isAuctionable) {
    if (window.state.priceHistoryChart) {
      window.state.priceHistoryChart.destroy();
      window.state.priceHistoryChart = null;
    }
    return;
  }

  const buttons = container.querySelectorAll('.price-range-btn');
  const slider = document.getElementById('price-history-slider');
  const sliderValue = document.getElementById('price-history-custom-days');

  if (slider && sliderValue) {
    slider.value = window.state?.priceHistory?.customDays ?? 7;
    sliderValue.textContent = slider.value;
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const range = btn.dataset.range || '7D';
      window.state.priceHistory.range = range;
      container.setAttribute('data-range', range);
      console.log('[PRICE HISTORY] Range changed:', range);

      if (range !== 'Custom') {
        window.refreshPlayerPriceHistory(player, { range });
      } else {
        window.refreshPlayerPriceHistory(player, { range, customDays: window.state.priceHistory.customDays });
      }
    });
  });

  if (slider) {
    slider.addEventListener('input', () => {
      const days = parseInt(slider.value, 10);
      window.state.priceHistory.customDays = days;
      if (sliderValue) sliderValue.textContent = days;
      console.log('[PRICE HISTORY] Custom range days changed:', days);

      if (window.state.priceHistory.range === 'Custom') {
        window.refreshPlayerPriceHistory(player, { range: 'Custom', customDays: days });
      }
    });
  }

  const activeRange = window.state?.priceHistory?.range || '7D';
  buttons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.range === activeRange);
  });
  container.setAttribute('data-range', activeRange);

  window.refreshPlayerPriceHistory(player, { range: activeRange, customDays: window.state?.priceHistory?.customDays });
};

window.refreshPlayerPriceHistory = async function(player, { range = '7D', customDays } = {}) {
  if (!player) return;

  if (!player.price) {
    console.log('[PRICE HISTORY] Skipping fetch for unauctionable player.');
    return;
  }

  const chartEl = document.getElementById('player-price-history-chart');
  const loadingEl = document.getElementById('price-history-loading');
  const emptyEl = document.getElementById('price-history-empty');
  if (!chartEl) return;

  const ctx = chartEl.getContext('2d');
  if (!ctx) return;

  const chartContainer = chartEl.parentElement;
  if (chartContainer) {
    chartEl.height = chartContainer.clientHeight || chartEl.height || 320;
    chartEl.width = chartContainer.clientWidth || chartEl.width;
  }

  const rangeDays = window.getPriceHistoryRangeDays(range, customDays);

  const startTime = new Date();
  startTime.setDate(startTime.getDate() - rangeDays);
  const endTime = new Date();

  const rankValue = player.rank || 0;
  const priceColumn = window.getPriceHistoryColumn(rankValue);

  console.log('[PRICE HISTORY] Fetching data:', {
    playerId: player.player_id,
    range,
    rangeDays,
    rankValue,
    priceColumn
  });

  if (loadingEl) loadingEl.style.display = 'flex';
  if (emptyEl) emptyEl.style.display = 'none';

  try {
    if (!window.supabaseProvider || typeof window.supabaseProvider.fetchPriceHistory !== 'function') {
      throw new Error('Supabase provider not available');
    }

    const history = await window.supabaseProvider.fetchPriceHistory({
      playerId: player.player_id,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      priceColumn
    });

    console.log('[PRICE HISTORY] Supabase data received:', history);

    const normalized = history
      .filter(entry => entry && entry[priceColumn] != null && entry.captured_at)
      .map(entry => ({
        date: new Date(entry.captured_at),
        price: Number(entry[priceColumn])
      }))
      .sort((a, b) => a.date - b.date);

    const downsampled = window.downsampleHistory(normalized, 200);

    if (!downsampled.length) {
      if (loadingEl) loadingEl.style.display = 'none';
      if (emptyEl) emptyEl.style.display = 'flex';
      if (window.state.priceHistoryChart) {
        window.state.priceHistoryChart.destroy();
        window.state.priceHistoryChart = null;
      }
      return;
    }

    if (window.state.priceHistoryChart) {
      window.state.priceHistoryChart.destroy();
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, (chartEl.parentElement?.clientHeight || chartEl.height || 200));
    gradient.addColorStop(0, 'rgba(0, 194, 168, 0.35)');
    gradient.addColorStop(1, 'rgba(0, 194, 168, 0.02)');

    window.state.priceHistoryChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: downsampled.map(point => point.date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })),
        datasets: [{
          data: downsampled.map(point => point.price),
          borderColor: '#00C2A8',
          backgroundColor: gradient,
          borderWidth: 2.5,
          fill: true,
          tension: 0.35,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: '#E6EEF2',
          pointHoverBorderColor: '#00C2A8',
          pointHoverBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        resizeDelay: 80,
        plugins: {
          legend: { display: false },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: '#11161B',
            borderColor: 'rgba(0, 194, 168, 0.6)',
            borderWidth: 1,
            titleColor: '#E6EEF2',
            bodyColor: '#9CA3AF',
            padding: 12,
            displayColors: false,
            callbacks: {
              title: function(context) {
                const idx = context?.[0]?.dataIndex ?? 0;
                const date = downsampled[idx]?.date;
                return date ? date.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                }) : '';
              },
              label: function(context) {
                const value = context.parsed.y;
                return `Price: ${typeof formatPrice === 'function' ? formatPrice(value) : value.toLocaleString()}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: {
              color: '#7E8A94',
              maxTicksLimit: 8
            }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: {
              color: '#7E8A94',
              callback: function(value) {
                return typeof formatPrice === 'function' ? formatPrice(value) : value;
              }
            }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        },
        animation: {
          duration: 600,
          easing: 'easeOutQuart'
        },
        onResize: function(chartInstance, size) {
          console.log('[PRICE HISTORY] Chart resized:', size);
        }
      }
    });

    if (loadingEl) loadingEl.style.display = 'none';
    if (emptyEl) emptyEl.style.display = 'none';
  } catch (error) {
    console.error('[PRICE HISTORY] Error fetching history:', error);
    if (loadingEl) loadingEl.style.display = 'none';
    if (emptyEl) {
      emptyEl.textContent = 'Unable to load price data.';
      emptyEl.style.display = 'flex';
    }
  }
};

window.getPriceHistoryRangeDays = function(range, customDays) {
  switch (range) {
    case '1D':
      return 1;
    case '3D':
      return 3;
    case '7D':
      return 7;
    case '15D':
      return 15;
    case '30D':
      return 30;
    case 'Custom':
      return Math.min(Math.max(parseInt(customDays || 7, 10), 1), 30);
    default:
      return 7;
  }
};

window.getPriceHistoryColumn = function(rank) {
  const safeRank = Math.min(Math.max(parseInt(rank || 0, 10), 0), 5);
  return `price${safeRank}`;
};

window.downsampleHistory = function(points, maxPoints) {
  if (!Array.isArray(points) || points.length <= maxPoints) return points || [];
  const step = Math.ceil(points.length / maxPoints);
  const sampled = points.filter((_, index) => index % step === 0);
  const lastPoint = points[points.length - 1];
  if (sampled[sampled.length - 1] !== lastPoint) {
    sampled.push(lastPoint);
  }
  return sampled;
};

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

function getSkillUnlockMessage(skill) {
  if (!skill) return 'Skill locked';
  if (skill.unlock_requirement_text) return skill.unlock_requirement_text;
  if (skill.unlock_requirement_type === 'skill_level' &&
      skill.unlock_requirement_skillname &&
      skill.unlock_requirement_level) {
    return `Requires ${skill.unlock_requirement_skillname} Level ${skill.unlock_requirement_level}`;
  }
  return 'Skill locked';
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
      console.log('[SKILLS] Updated player boosts after upgrade:', {
        training: updatedPlayer.training_boosts,
        skills: updatedPlayer.skill_boosts
      });
      
      // Re-render skills section only
      await renderPlayerSkills(updatedPlayer);

      // Re-render stats section to show updated skill boosts
      if (typeof window.updatePlayerStatsSection === 'function') {
        window.updatePlayerStatsSection(updatedPlayer);
      } else {
        renderPlayerDetail(updatedPlayer);
        cleanupRankAnimations();
      }
    }
    
  } catch (error) {
    console.error('[SKILLS] Upgrade error:', error);
    return;
  }
};

// ==================== RESET SKILLS BUTTON ====================
window.resetPlayerSkills = async function(playerId, rank) {
  console.log('[SKILLS] Resetting all skills for player', playerId, 'at rank', rank);
  
  try {
    const isSelectedPlayer = state.selectedPlayer &&
      String(state.selectedPlayer.player_id) === String(playerId);
    if (isSelectedPlayer) {
      console.log('[SKILLS] Pre-reset skills:', state.selectedPlayer.skill_boosts);
      console.log('[SKILLS] Pre-reset stats snapshot:', {
        pace: state.selectedPlayer.pace,
        shooting: state.selectedPlayer.shooting,
        passing: state.selectedPlayer.passing,
        dribbling: state.selectedPlayer.dribbling,
        defending: state.selectedPlayer.defending,
        physical: state.selectedPlayer.physical
      });
    }

    // Call API to reset skills
    const result = await window.apiClient.resetSkills(CURRENT_USER_ID, playerId, rank);
    
    console.log('[SKILLS] Reset successful:', result);
    
    // Re-fetch player data and re-render
    if (isSelectedPlayer) {
      const resp = await window.apiClient.getPlayerDetails(playerId, rank);
      const allocationsResp = await window.apiClient.getUserSkillAllocations(
        CURRENT_USER_ID,
        playerId,
        rank
      );
      const skillBoosts = await calculateSkillBoosts(allocationsResp.allocations || []);
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
      console.log('[SKILLS] Post-reset skills:', updatedPlayer.skill_boosts);
      console.log('[SKILLS] Post-reset stats snapshot:', {
        pace: updatedPlayer.pace,
        shooting: updatedPlayer.shooting,
        passing: updatedPlayer.passing,
        dribbling: updatedPlayer.dribbling,
        defending: updatedPlayer.defending,
        physical: updatedPlayer.physical
      });
      
      // Re-render both skills section and player detail
      await renderPlayerSkills(updatedPlayer);
      if (typeof window.updatePlayerStatsSection === 'function') {
        window.updatePlayerStatsSection(updatedPlayer);
      } else {
        renderPlayerDetail(updatedPlayer);
      }
    }
    
  } catch (error) {
    console.error('[SKILLS] Reset error:', error);
    return;
  }
};

window.resetSquadCustomizationSkills = async function() {
  const isCompare = compareCustomizationContext?.active;
  const playerId = isCompare
    ? compareCustomizationState.playerId
    : window.squadCustomizationState?.playerId;
  const rank = isCompare
    ? compareCustomizationState.selectedRank
    : window.squadCustomizationState?.selectedRank;

  console.log("[Skills] Reset triggered from Squad Customization modal");

  if (!playerId) {
    console.warn('[SKILLS] Reset skipped: no player selected');
    return;
  }

  const resolvedRank = Number.isFinite(Number(rank)) ? Number(rank) : 0;
  await resetPlayerSkills(playerId, resolvedRank);

  if (isCompare) {
    await renderComparePlayerSkills();
    handleCompareCustomizationChange('skill-reset');
    return;
  }

  if (window.squadCustomizationState &&
      String(window.squadCustomizationState.playerId) === String(playerId) &&
      typeof renderSquadPlayerSkills === 'function') {
    await renderSquadPlayerSkills();
  }
};



// ==================== SKILL DETAIL MODAL ====================
function getSkillModalPlayerContext() {
  if (compareCustomizationContext?.active && compareCustomizationState?.player) {
    return { player: compareCustomizationState.player, mode: 'compare' };
  }
  return { player: state.selectedPlayer, mode: 'default' };
}

window.openSkillDetailModal = async function(skillId, skillName) {
  console.log('[SKILLS] Opening modal for skill:', skillId);
  
  let modal = document.getElementById('skill-detail-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'skill-detail-modal';
    modal.className = 'skill-detail-modal';
    modal.style.display = 'none';
    modal.innerHTML = '<div class="skill-modal-content"></div>';
    document.body.appendChild(modal);
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
    const context = getSkillModalPlayerContext();
    if (!context.player) {
      throw new Error('No player selected');
    }

    const playerRank = Number.isFinite(context.player.rank)
      ? context.player.rank
      : (compareCustomizationContext?.active ? compareCustomizationState.selectedRank : 0);
    const player = { ...context.player, rank: playerRank };
    
    // Fetch skill boosts
    const boostsData = await window.apiClient.getSkillBoosts(skillId);
    const boosts = boostsData.boosts || [];
    
    // Fetch user's skill allocations to determine current level
    const allocationsResp = await window.apiClient.getUserSkillAllocations(
      CURRENT_USER_ID,
      player.player_id,
      playerRank
    );
    const userAllocations = allocationsResp.allocations || [];
    
    // Find current level for this skill
    const allocation = userAllocations.find(a => a.skill_id === skillId);
    const currentLevel = allocation ? allocation.skill_level : 0;

    // Determine unlock state
    const allocationMap = {};
    userAllocations.forEach(a => {
      allocationMap[a.skill_id] = a.skill_level;
    });
    const allSkills = player.skills || [];
    const skillEntry = allSkills.find(s => s.skill_id === skillId);
    const isUnlocked = skillEntry ? checkIfSkillUnlocked(skillEntry, allocationMap, allSkills) : true;
    const unlockMessage = isUnlocked ? '' : getSkillUnlockMessage(skillEntry);
    if (!isUnlocked) {
      modal.innerHTML = `
        <div class="skill-modal-content" onclick="event.stopPropagation()">
          <button class="modal-close-btn" onclick="closeSkillDetailModal()">✕</button>
          <h2>${skillName}</h2>
          <div style="margin-top: 8px; color: #FFB86B; font-weight: 600;">${unlockMessage}</div>
          <button class="modal-action-btn" onclick="closeSkillDetailModal()">Close</button>
        </div>
      `;
      return;
    }
    
    // Calculate points remaining
    const availablePoints = player.available_skill_points || playerRank || 0;
    const pointsSpent = userAllocations.reduce((sum, a) => sum + a.skill_level, 0);
    const pointsRemaining = availablePoints - pointsSpent;
    
    console.log('[SKILLS] Current level:', currentLevel, 'Points remaining:', pointsRemaining);
    
    // Render modal content
    renderSkillDetailModal(skillName, boosts, currentLevel, pointsRemaining, skillId, player, {
      isUnlocked,
      unlockMessage
    });
    
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

function renderSkillDetailModal(skillName, boosts, currentLevel, pointsRemaining, skillId, player, options = {}) {
  const modal = document.getElementById('skill-detail-modal');
  const isUnlocked = options.isUnlocked !== false;
  const unlockMessage = options.unlockMessage || '';
  
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
    const isLocked = !isUnlocked;
    
    // FIX: Allow clicking any affordable level (including lower levels for downgrade)
    // Add event.stopPropagation() to prevent modal from closing
    const onclickAttr = (isDisabled || isLocked) ? '' : `onclick="event.stopPropagation(); selectSkillLevel(${skillId}, ${levelNum}, ${currentLevel}, ${player.player_id}, ${player.rank})"`;
    const cursorStyle = (isDisabled || isLocked) ? 'cursor: not-allowed;' : 'cursor: pointer;';
    
    boostsHTML += `
      <div class="boost-level-section ${isSelected ? 'selected' : ''} ${currentLevel >= levelNum && !isSelected ? 'unlocked' : ''} ${(isDisabled || isLocked) ? 'disabled' : ''}" 
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
    // ✅ ADD: Show alternate positions for Level 2 only
    if (levelNum === 2 && player.alternate_position) {
        const altPositions = player.alternate_position
            .split(',')
            .map(pos => pos.trim())
            .filter(pos => pos.length > 0 && pos !== '0');
        
        if (altPositions.length > 0) {
            boostsHTML += `<div class="boost-stat" style="color: #00C2A8; font-weight: 700;">Alt Positions: ${altPositions.join(', ')}</div>`;
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
      ${!isUnlocked ? `<div style="margin-top: 8px; color: #FFB86B; font-weight: 600;">${unlockMessage}</div>` : ''}
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
    const normalizedCurrent = Number(currentLevel) || 0;
    const normalizedTarget = Number(targetLevel) || 0;
    const newLevel = normalizedTarget === normalizedCurrent ? 0 : normalizedTarget;
    console.log("[Skills] Skill toggled:", skillId, "New Level:", newLevel);
    
    // If same as current, no change needed
    if (newLevel === normalizedCurrent) {
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
    
    const isCompare = compareCustomizationContext.active &&
      String(compareCustomizationContext.playerId) === String(playerId);
    const basePlayer = isCompare
      ? (compareCustomizationState.player ||
        compareState.selectedPlayers.find(p => resolveComparePlayerId(p) === resolveComparePlayerId(playerId)) || {})
      : state.selectedPlayer;

    if (!basePlayer) {
      console.warn('[SKILLS] No player context found for skill update');
      return;
    }

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
      ...basePlayer,
      ...resp.player,
      rank,
      skills: resp.skills,
      available_skill_points: resp.available_skill_points,
      training_boosts: combinedBoosts,
      skill_boosts: skillBoosts
    };

    console.log('[SKILLS] Updated player boosts after level change:', {
      training: updatedPlayer.training_boosts,
      skills: updatedPlayer.skill_boosts
    });

    if (isCompare) {
      compareCustomizationState.player = updatedPlayer;
      compareCustomizationState.selectedSkills = (allocationsResp.allocations || []).map(a => ({
        skill_id: a.skill_id,
        skill_level: a.skill_level
      }));
      compareSkillBoost = skillBoosts || {};
      await renderComparePlayerSkills();
    } else if (state.selectedPlayer) {
      state.selectedPlayer = updatedPlayer;

      // Re-render skills grid
      await renderPlayerSkills(updatedPlayer);

      // Re-render stats section to show updated skill boosts
      if (typeof window.updatePlayerStatsSection === 'function') {
        window.updatePlayerStatsSection(updatedPlayer);
      } else {
        renderPlayerDetail(updatedPlayer);
      }
    }

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
      const updatedAllocMap = {};
      allocations.forEach(a => {
        updatedAllocMap[a.skill_id] = a.skill_level;
      });
      const updatedSkills = updatedPlayer.skills || [];
      const updatedSkillEntry = updatedSkills.find(s => s.skill_id === skillId);
      const updatedUnlocked = updatedSkillEntry ? checkIfSkillUnlocked(updatedSkillEntry, updatedAllocMap, updatedSkills) : true;
      const updatedUnlockMessage = updatedUnlocked ? '' : getSkillUnlockMessage(updatedSkillEntry);

      renderSkillDetailModal(
        modal.dataset.skillName,
        boosts,
        updatedCurrentLevel,
        pointsRemaining,
        skillId,
        updatedPlayer,
        {
          isUnlocked: updatedUnlocked,
          unlockMessage: updatedUnlockMessage
        }
      );

      // FIX: Ensure modal stays visible
      modal.style.display = 'flex';
    }

    // Update squad builder skills if customization modal is open
    if (!isCompare &&
        typeof renderSquadPlayerSkills === 'function' &&
        window.squadCustomizationState &&
        String(window.squadCustomizationState.playerId) === String(playerId)) {
      window.squadCustomizationState.selectedRank = rank;
      await renderSquadPlayerSkills();
    }

    if (isCompare) {
      handleCompareCustomizationChange('skill-change');
    }
    
  } catch (error) {
    console.error('[SKILLS] Level change error:', error);
    return;
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
// ==================== RANK SELECTION SECTION ====================
async function buildRankSelectionSection(player) {
    const currentRank = player.rank || 0;
    const skillPoints = RANK_CONFIG.skillPoints[currentRank] || 0;
    
    const rankCardsHtml = [1, 2, 3, 4, 5].map(rankNum => {
        const isSelected = currentRank === rankNum;
        const spriteUrl = RANK_CONFIG.ranks[rankNum];
        const rankColor = RANK_CONFIG.rankColors[rankNum];
        const uniqueId = `rank-selector-${rankNum}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        
        const iconSize = 56;
        const spriteSheetSize = 192 * (iconSize / 32); // 420px
        
        return `
            <div class="rank-card ${isSelected ? 'selected' : ''}" 
                 data-rank="${rankNum}" 
                 onclick="window.selectPlayerRank(${player.player_id}, ${rankNum})"
                 style="
                     position: relative;
                     background: rgba(255,255,255,0.03);
                     border: 2px solid ${isSelected ? 
                         (rankNum === 1 ? 'rgba(59,214,113,0.4)' :
                          rankNum === 2 ? 'rgba(99,102,241,0.4)' :
                          rankNum === 3 ? 'rgba(139,92,246,0.4)' :
                          rankNum === 4 ? 'rgba(255,184,107,0.4)' :
                          'rgba(255,107,107,0.4)') : 
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
                <div style="font-size: 16px; font-weight: 800; color: ${rankColor}; font-family: var(--font-family-base); line-height: 1;">
                    ${rankNum}
                </div>
                
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
                         filter: ${isSelected ? `drop-shadow(0 0 8px ${rankColor})` : 'none'};
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
    
    // Build refresh time container
    const refreshTimeHtml = await window.buildRefreshTimeContainer(player);
    
    return `
        <div class="player-rank-refresh-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <!-- LEFT: Rank Selection -->
            <div style="
                background: var(--color-graphite-800);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: var(--radius-lg);
                padding: 6px;
            ">
                <div style="
                    font-size: 16px;
                    font-weight: 800;
                    color: var(--color-text-primary);
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
                    <span>Select Rank</span>
                    <button class="reset-rank-btn" onclick="window.resetPlayerRank(${player.player_id})" type="button">
                      Reset Rank
                    </button>
                </div>
                
                <div class="rank-cards-grid" style="
                    display: grid;
                    grid-template-columns: repeat(5, 1fr);
                    gap: 14px;
                    margin-bottom: 16px;
                    justify-items: center;
                ">
                    ${rankCardsHtml}
                </div>
                
                <!-- Training Level Selector -->
                <div style="
                    background: rgba(20,24,28);
                    border: 1px solid rgba(0,194,168,0.12);
                    border-radius: 10px;
                    padding: 16px;
                ">
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 12px;
                    ">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal-500)" stroke-width="2">
                                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                                <path d="M2 17l10 5 10-5"></path>
                                <path d="M2 12l10 5 10-5"></path>
                            </svg>
                            <span style="
                                font-size: 13px;
                                font-weight: 700;
                                color: var(--color-text-primary);
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
                            color: var(--color-teal-500);
                        ">
                            ${skillPoints} Points
                        </div>
                    </div>
                    
                    <div style="position: relative;">
                        <select id="training-level-${player.player_id}" 
                                onchange="window.setPlayerTrainingLevel(${player.player_id}, this.value)"
                                style="
                                    width: 100%;
                                    background: var(--color-graphite-800);
                                    border: 2px solid rgba(0,194,168,0.2);
                                    border-radius: 8px;
                                    padding: 12px 16px;
                                    font-size: 14px;
                                    font-weight: 600;
                                    color: var(--color-text-primary);
                                    font-family: var(--font-family-base);
                                    cursor: pointer;
                                    transition: all 0.2s ease;
                                    appearance: none;
                                    background-image: url('data:image/svg+xml;charset=UTF-8,%3csvg width=%2712%27 height=%278%27 viewBox=%270 0 12 8%27 fill=%27none%27 xmlns=%27http://www.w3.org/2000/svg%27%3e%3cpath d=%27M1 1.5L6 6.5L11 1.5%27 stroke=%27%2300C2A8%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3c/svg%3e');
                                    background-repeat: no-repeat;
                                    background-position: right 16px center;
                                    padding-right: 40px;
                                "
                                onfocus="this.style.borderColor='var(--color-teal-500)'; this.style.boxShadow='0 0 0 3px rgba(0,194,168,0.1)';"
                                onblur="this.style.borderColor='rgba(0,194,168,0.2)'; this.style.boxShadow='none';">
                            <option value="0" ${(player.training_level || 0) === 0 ? 'selected' : ''}>No Training</option>
                            ${Array.from({length: 30}, (_, i) => i + 1).map(level => `
                                <option value="${level}" ${(player.training_level || 0) === level ? 'selected' : ''}>
                                    Level ${level}${level === 30 ? ' (MAX)' : ''}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    
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
                            <span style="font-size: 12px; color: #3BD671; font-weight: 600;">
                                Training Level ${player.training_level || 0} Active
                            </span>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <!-- RIGHT: Refresh Time -->
            ${refreshTimeHtml}
        </div>
    `;
}





// ========== RANK SELECTION HANDLER ==========
// ==================== TRACK VISITED RANKS ====================
const visitedRanks = new Set();

window.selectPlayerRank = async function(playerId, rankNumber) {
  console.log('[RANK] Selecting rank', rankNumber, 'for player', playerId);
  console.log('[RankOverlay] PlayerDetail:', rankNumber);
  
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
      
      const preservedColors = {
        color_rating: state.selectedPlayer?.color_rating,
        color_position: state.selectedPlayer?.color_position,
        color_name: state.selectedPlayer?.color_name
      };

      const updatedPlayer = {
        ...state.selectedPlayer,
        ...resp.player,
        rank: rankNumber,
        skills: resp.skills,
        available_skill_points: resp.available_skill_points,
        color_rating: resp.player?.color_rating || preservedColors.color_rating,
        color_position: resp.player?.color_position || preservedColors.color_position,
        color_name: resp.player?.color_name || preservedColors.color_name
      };
      
      state.selectedPlayer = updatedPlayer;
      renderPlayerDetail(updatedPlayer);
      
        console.log('[RANK] Switched from rank', previousRank, 'to rank', rankNumber);

        if (typeof window.refreshPlayerPriceHistory === 'function') {
          window.refreshPlayerPriceHistory(updatedPlayer, { range: window.state?.priceHistory?.range });
        }
      
    } catch (error) {
      console.error('[RANK] Error switching rank:', error);
      state.selectedPlayer.rank = rankNumber;
      renderPlayerDetail(state.selectedPlayer);

      if (typeof window.refreshPlayerPriceHistory === 'function') {
        window.refreshPlayerPriceHistory(state.selectedPlayer, { range: window.state?.priceHistory?.range });
      }
      
    }
  } else {
    console.error('[RANK] Player ID mismatch or no selected player');
  }
};

window.resetPlayerRank = async function(playerId) {
  console.log('[RANK] Resetting rank to base for player', playerId);
  console.log('[RankOverlay] PlayerDetail:', 0);

  if (!state.selectedPlayer || String(state.selectedPlayer.player_id) !== String(playerId)) {
    console.warn('[RANK] Reset rank aborted - player mismatch.');
    return;
  }

  try {
    const resp = await window.apiClient.getPlayerDetails(playerId, 0);
    const allocationsResp = await window.apiClient.getUserSkillAllocations(
      CURRENT_USER_ID,
      playerId,
      0
    );
    const skillBoosts = await calculateSkillBoosts(allocationsResp.allocations || []);
    const combinedBoosts = mergeBoosts(resp.player.training_boosts, skillBoosts);

    const updatedPlayer = {
      ...state.selectedPlayer,
      ...resp.player,
      rank: 0,
      skills: resp.skills,
      available_skill_points: resp.available_skill_points,
      training_boosts: combinedBoosts,
      skill_boosts: skillBoosts,
      color_rating: resp.player?.color_rating || state.selectedPlayer?.color_rating,
      color_position: resp.player?.color_position || state.selectedPlayer?.color_position,
      color_name: resp.player?.color_name || state.selectedPlayer?.color_name
    };

    state.selectedPlayer = updatedPlayer;
    renderPlayerDetail(updatedPlayer);

    console.log('[RANK] Rank reset complete.');
  } catch (error) {
    console.error('[RANK] Rank reset error:', error);
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
window.state = {
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
        event: '',
        auctionable: ''
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
    searchTotalResults: 0,
    priceHistory: {
        range: '7D',
        customDays: 7
    }
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
    // Use new professional watchlist
        if (typeof initProfessionalWatchlist === 'function') {
            setTimeout(() => {
                initProfessionalWatchlist();
            }, 100);
        } else {
            console.error('❌ initProfessionalWatchlist not found - make sure watchlist-professional.js is loaded');
        }
  } else if (viewName === 'event-guide') {
        if (typeof initEventGuide === 'function') {
            setTimeout(initEventGuide, 100);
        } else {
            console.error('initEventGuide not found - make sure eventGuide.js is loaded');
        }
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


  if (!input || !list) {
    console.warn("[NATION] Missing input or list for autocomplete");
    return;
  }

  if (!flagImg) {
    console.warn("[NATION] Flag image not found, continuing without flag support");
  }

  const getWatchlistNations = () => {
    const raw = input.getAttribute('data-watchlist-nations');
    if (raw === null) return null;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean);
      }
    } catch (e) {
      console.warn("[NATION] Failed to parse watchlist nations data:", e);
    }
    return [];
  };

  const getAutocompleteSource = () => {
    const isWatchlist = (typeof state !== 'undefined' && state.currentView === 'watchlist');
    if (isWatchlist) {
      const watchlistNations = getWatchlistNations();
      if (watchlistNations !== null) return watchlistNations;
    }
    return COUNTRIES;
  };

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
        const isWatchlist = (typeof state !== 'undefined' && state.currentView === 'watchlist');
        if (isWatchlist && typeof watchlistFilters !== 'undefined') {
          watchlistFilters.nation = country;

          const watchlistNation = document.getElementById('watchlist-filter-nation');
          if (watchlistNation) watchlistNation.value = country;

          if (typeof applyWatchlistFilters === 'function') {
            applyWatchlistFilters();
          }

          if (typeof updateActiveFilterChips === 'function') {
            updateActiveFilterChips();
          }

          if (typeof updateWatchlistFilterBadge === 'function') {
            updateWatchlistFilterBadge();
          }
        } else if (typeof state !== 'undefined') {
          // update filter state explicitly (database)
          state.filters.nation = country;
        }

        // ✅ set flag
        const flagUrl = getCountryFlagUrl(country);
        if (flagImg && flagUrl) {
          flagImg.src = flagUrl;
          flagImg.style.display = 'block';
        } else if (flagImg) {
          flagImg.style.display = 'none';
        }

        // ✅ reload database deterministically
        if (typeof state !== 'undefined') {
          state.currentOffset = 0;
          if (state.currentView === 'database') {
            loadDatabase();
          }
          if (state.currentView === 'watchlist' && typeof applyWatchlistFilters !== 'function') {
            loadWatchlist();
          }
        }

      });


      list.appendChild(div);
    });
  }

  function selectCountry(country) {
    input.value = country;
    list.innerHTML = '';

    const isWatchlist = (typeof state !== 'undefined' && state.currentView === 'watchlist');
    if (isWatchlist && typeof watchlistFilters !== 'undefined') {
      watchlistFilters.nation = country;

      const watchlistNation = document.getElementById('watchlist-filter-nation');
      if (watchlistNation) watchlistNation.value = country;

      if (typeof applyWatchlistFilters === 'function') {
        applyWatchlistFilters();
      }

      if (typeof updateActiveFilterChips === 'function') {
        updateActiveFilterChips();
      }

      if (typeof updateWatchlistFilterBadge === 'function') {
        updateWatchlistFilterBadge();
      }
    } else if (typeof state !== 'undefined') {
      // update filter state
      state.filters.nation = country;
    }

    // set flag
    const flagUrl = getCountryFlagUrl(country);
    if (flagImg && flagUrl) {
      flagImg.src = flagUrl;
      flagImg.style.display = 'block';
    } else if (flagImg) {
      flagImg.style.display = 'none';
    }

    // reload database
    if (typeof state !== 'undefined') {
      state.currentOffset = 0;
      if (state.currentView === 'database') {
        loadDatabase();
      }
      if (state.currentView === 'watchlist' && typeof applyWatchlistFilters !== 'function') {
        loadWatchlist();
      }
    }

  }


  const updateSuggestions = () => {
    const q = input.value.trim().toLowerCase();

    if (!q && flagImg) {
      flagImg.style.display = 'none';
      flagImg.src = '';
    }

    const source = getAutocompleteSource();
    const matches = q
      ? source.filter(c => c.toLowerCase().includes(q)).slice(0, 40)
      : source.slice(0, 30);

    render(matches);
  };

  input.addEventListener('input', updateSuggestions);
  input.addEventListener('focus', updateSuggestions);

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
    const latestPromise = loadLatestPlayers();
    const trendingPromise = loadTrendingPlayers();
    const recentEventsPromise = latestPromise.then(() => loadRecentEvents());

    await Promise.all([
        latestPromise,
        trendingPromise,
        recentEventsPromise
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
            // adjust field names if needed (player.playerid vs player.player_id)
            viewPlayerDetail(player.player_id || player.playerid, player);
        } else {
            console.log('Clicked player', player.name, 'ID:', player.player_id || player.playerid);
        }
    });

    // Normalize untradable value to a boolean
    const isUntradableText = String(player.is_untradable ?? player.isuntradable ?? '').toLowerCase();
    const isUntradable =
        isUntradableText === 'true' ||
        isUntradableText === '1' ||
        isUntradableText === 'yes';

    card.innerHTML = `
        <div class="card-container">
            <!-- Card background -->
            <img src="${player.card_background || player.cardbackground || 'https://via.placeholder.com/300x400'}"
                 alt="Card Background"
                 class="card-background-img"
                 onerror="this.src='https://via.placeholder.com/300x400'">

            <!-- Player image -->
            <img src="${player.player_image || player.playerimage || 'https://via.placeholder.com/200x300'}"
                 alt="${player.name}"
                 class="player-image-img"
                 onerror="this.src='https://via.placeholder.com/200x300'">

            <!-- OVR -->
            <div class="card-ovr" style="color: ${player.color_rating || player.colorrating || '#FFFFFF'}">
                ${player.ovr && player.ovr > 0 ? player.ovr : 'NA'}
            </div>

            <!-- Position -->
            <div class="card-position" style="color: ${player.color_position || player.colorposition || '#FFFFFF'}">
                ${player.position || 'NA'}
            </div>

            <!-- Name -->
            <div class="card-player-name" style="color: ${player.color_name || player.colorname || '#FFFFFF'}">
                ${player.name}
            </div>

            <!-- Nation / club -->
            <img src="${player.nation_flag || player.nationflag || ''}"
                 alt="Nation"
                 class="card-nation-flag"
                 onerror="this.style.display='none'">

            <img src="${player.club_flag || player.clubflag || ''}"
                 alt="Club"
                 class="card-club-flag"
                 onerror="this.style.display='none'">

            <!-- ✅ Untradable badge -->
            ${
                isUntradable
                    ? `<div class="card-untradable-badge">
                           <img src="assets/images/untradable_img.png" alt="Untradable">
                       </div>`
                    : ''
            }
        </div>
    `;

    return card;
}


let latestPlayersCache = [];
const recentEventPlayersCache = new Map();
const recentEventSortCache = new Map();

function getEventNameFromPlayer(player) {
    const raw = player?.event || player?.event_name || player?.eventName || '';
    const name = String(raw || '').trim();
    return name && name !== '0' ? name : '';
}

function getEventTitleFirstWord(eventName) {
    const normalized = String(eventName || '').trim();
    if (!normalized) return '';
    return normalized.split(/\s+/)[0].toLowerCase();
}

function getGridColumnCount(element) {
    if (!element) return 0;
    const columns = getComputedStyle(element).gridTemplateColumns || '';
    const minmaxMatches = columns.match(/minmax\([^)]*\)/g);
    if (minmaxMatches?.length) return minmaxMatches.length;
    return columns.split(' ').filter(token => token.trim().length > 0).length;
}

function getRecentEventNames(players, limit = 3) {
    const names = [];
    const seenEvents = new Set();
    const seenFirstWords = new Set();
    (players || []).forEach(player => {
        const eventName = getEventNameFromPlayer(player);
        if (!eventName) return;
        const trimmedName = eventName.trim();
        const eventKey = trimmedName.toLowerCase();
        if (!eventKey || seenEvents.has(eventKey)) return;
        const firstWord = getEventTitleFirstWord(trimmedName);
        if (!firstWord || seenFirstWords.has(firstWord)) return;
        seenEvents.add(eventKey);
        seenFirstWords.add(firstWord);
        names.push(trimmedName);
    });
    return names.slice(0, limit);
}

function getPrice0Value(price) {
    if (price === null || price === undefined) return 0;
    const normalized = typeof price === 'string' ? price.replace(/,/g, '') : price;
    const numeric = Number(normalized);
    return Number.isFinite(numeric) ? numeric : 0;
}

function getEventSortCacheKey(eventName, players) {
    const sample = (players || []).slice(0, 5)
        .map(p => `${p.player_id || p.id || 'na'}:${getPrice0Value(p.price0)}`)
        .join('|');
    return `${eventName}|${players?.length || 0}|${sample}`;
}

function getTopPlayersByPrice(players, eventName, limit = 7) {
    const cacheKey = `${getEventSortCacheKey(eventName, players)}|${limit}`;
    const cached = recentEventSortCache.get(cacheKey);
    if (cached) return cached;
    const topPlayers = (players || []).slice(0, limit);
    recentEventSortCache.set(cacheKey, topPlayers);
    return topPlayers;
}

async function fetchRecentEventPlayers(eventName) {
    if (!eventName) return [];
    const cacheKey = eventName.toLowerCase();
    if (recentEventPlayersCache.has(cacheKey)) {
        return recentEventPlayersCache.get(cacheKey);
    }
    const players = await loadPlayersFromAPI({
        limit: 200,
        rank: 0,
        event: eventName
    });
    recentEventPlayersCache.set(cacheKey, players);
    return players;
}

async function loadRecentEvents() {
    const container = document.getElementById('recent-events-container');
    if (!container) {
        console.error('[EVENTS] Container #recent-events-container not found in DOM');
        return;
    }

    const sourcePlayers = latestPlayersCache.length > 0
        ? latestPlayersCache
        : await loadPlayersFromAPI({ limit: 200, rank: 0 });
    const sortedSource = [...(sourcePlayers || [])].sort((a, b) => {
        const dateA = new Date(a.date_added || 0);
        const dateB = new Date(b.date_added || 0);
        return dateB - dateA;
    });
    let recentEvents = getRecentEventNames(sortedSource, 3);
    if (recentEvents.length < 3) {
        console.warn('[EVENTS] Insufficient unique event groups, expanding search', {
            eventCount: recentEvents.length
        });
        const expandedPlayers = await loadPlayersFromAPI({ limit: 400, rank: 0 });
        const expandedSorted = [...(expandedPlayers || [])].sort((a, b) => {
            const dateA = new Date(a.date_added || 0);
            const dateB = new Date(b.date_added || 0);
            return dateB - dateA;
        });
        recentEvents = getRecentEventNames(expandedSorted, 3);
    }
    const recentFirstWords = recentEvents.map(getEventTitleFirstWord).filter(Boolean);
    const uniqueFirstWords = new Set(recentFirstWords);

    console.log('[EVENTS] Loading recent events', {
        recentEvents,
        expectedGroups: 3,
        uniqueFirstWordCount: uniqueFirstWords.size
    });
    if (recentEvents.length !== 3 || uniqueFirstWords.size !== recentEvents.length) {
        console.warn('[EVENTS] Recent event group validation failed', {
            eventCount: recentEvents.length,
            uniqueFirstWordCount: uniqueFirstWords.size
        });
    }

    if (recentEvents.length === 0) {
        container.innerHTML = '<div class="recent-events-empty">No recent events available</div>';
        return;
    }

    container.innerHTML = '';

    for (const eventName of recentEvents) {
        const eventBlock = document.createElement('div');
        eventBlock.className = 'recent-event-block';

        const title = document.createElement('div');
        title.className = 'recent-event-title';
        title.textContent = eventName;

        const row = document.createElement('div');
        row.className = 'recent-event-row';

        eventBlock.appendChild(title);
        eventBlock.appendChild(row);
        container.appendChild(eventBlock);

        const eventPlayers = await fetchRecentEventPlayers(eventName);
        if (!eventPlayers.length) {
            row.innerHTML = '<div class="recent-events-empty">No players found for this event</div>';
            console.log('[EVENTS] Event render count', { eventName, playerCount: 0, maxPlayers: 7 });
            continue;
        }

        const topPlayers = getTopPlayersByPrice(eventPlayers, eventName, 7);
        console.log('[EVENTS] Event render count', {
            eventName,
            playerCount: topPlayers.length,
            maxPlayers: 7
        });
        topPlayers.forEach(player => {
            const card = createDashboardPlayerCard(player);
            row.appendChild(card);
        });

        if (window.matchMedia('(min-width: 1201px)').matches) {
            const columns = getGridColumnCount(row);
            console.log('[EVENTS] Recent event row columns', { eventName, columns });
            if (columns !== 7) {
                console.warn('[EVENTS] Recent event row columns mismatch', {
                    eventName,
                    expected: 7,
                    actual: columns
                });
            }
        }
    }

    console.log('[EVENTS] Recent events loaded', {
        count: recentEvents.length,
        uniqueFirstWordCount: uniqueFirstWords.size
    });
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

    latestPlayersCache = sortedPlayers;

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
        const recentSection = document.getElementById('recent-events-section');
        if (latestSection) latestSection.style.display = 'none';
        if (trendingSection) trendingSection.style.display = 'none';
        if (recentSection) recentSection.style.display = 'none';
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
        const card = createPlayerCard(player);
        container.appendChild(card);
    });

    // ✅ ADD THIS LINE - Sync heart icons with watchlist state
    updateAllWatchlistButtons();

    console.log(`[DATABASE] Rendered ${players.length} players`);




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
    const recentSection = document.getElementById('recent-events-section');

    if (latestSection) latestSection.style.display = 'block';
    if (trendingSection) trendingSection.style.display = 'block';
    if (recentSection) recentSection.style.display = 'block';

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

// Helper function to get unique ID from player object
function getPlayerUniqueId(player) {
  return `${player.player_id}_${player.rank || 0}_${player.is_untradable ? 1 : 0}`;
}

window.toggleWatchlist = function(uniqueId) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('[TOGGLE] START');
  console.log('[TOGGLE] Unique ID:', uniqueId);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (!uniqueId) {
    console.error('[TOGGLE] uniqueId is empty/null');
    return;
  }

  const index = state.watchlist.indexOf(uniqueId);
  let savedPlayers = JSON.parse(localStorage.getItem('watchlistPlayers') || '[]');
  
  if (index === -1) {
    // ADDING
    console.log('[TOGGLE] ADDING to watchlist...');
    state.watchlist.push(uniqueId);
    
    // Find player object
    let allAvailable = [
      ...state.allPlayers,
      ...state.searchResults,
      ...state.filteredPlayers,
      ...(state.selectedPlayer ? [state.selectedPlayer] : [])
    ];
    
    // Remove duplicates
    const uniquePlayers = [];
    const seenIds = new Set();
    allAvailable.forEach(p => {
      const pId = getPlayerUniqueId(p);
      if (!seenIds.has(pId)) {
        seenIds.add(pId);
        uniquePlayers.push(p);
      }
    });
    
    const playerObj = uniquePlayers.find(p => getPlayerUniqueId(p) === uniqueId);
    
    if (playerObj) {
      console.log('[TOGGLE] Player found:', playerObj.name);
      
      // ✅ FIX: Ensure nation_region is saved
      const playerToSave = {
        ...playerObj,
        // Make sure nation_region is included
        nation_region: playerObj.nation_region || playerObj.nationregion || playerObj.nation || playerObj.nationality || 'NA',
        nationregion: playerObj.nation_region || playerObj.nationregion || playerObj.nation || playerObj.nationality || 'NA',
        nation: playerObj.nation_region || playerObj.nationregion || playerObj.nation || playerObj.nationality || 'NA'
      };
      
      console.log('[TOGGLE] Saving with nation:', playerToSave.nation_region);
      
      const alreadyExists = savedPlayers.some(p => getPlayerUniqueId(p) === uniqueId);
      if (!alreadyExists) {
        savedPlayers.push(playerToSave);
        console.log('[TOGGLE] Player added to savedPlayers');
      }
      
    } else {
      console.error('[TOGGLE] Could not find player object for:', uniqueId);
    }
    
  } else {
    // REMOVING
    console.log('[TOGGLE] REMOVING from watchlist...');
    state.watchlist.splice(index, 1);
    savedPlayers = savedPlayers.filter(p => getPlayerUniqueId(p) !== uniqueId);
    
  }

  // Save to localStorage
  localStorage.setItem('watchlist', JSON.stringify(state.watchlist));
  localStorage.setItem('watchlistPlayers', JSON.stringify(savedPlayers));
  
  // Update UI
  updateAllWatchlistButtons();
  
  // Reload watchlist view if active
  if (state.currentView === 'watchlist') {
    if (typeof window.loadWatchlistData === 'function') {
      setTimeout(() => window.loadWatchlistData(), 100);
    }
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('[TOGGLE] COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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
        if (options.event) params.event = options.event;

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

/**
 * Render additional custom stats selected by user
 * @param {Object} player - Player data object
 * @returns {String} HTML string of additional stat pills
 */
function renderCustomStats(player) {
    // Get selected stats from global variable or localStorage
    let selectedStats = window.customSelectedStats || [];
    
    if (!selectedStats || selectedStats.length === 0) {
        // Fallback to localStorage
        const saved = localStorage.getItem('customSelectedStats');
        if (saved) {
            try {
                selectedStats = JSON.parse(saved);
            } catch (e) {
                console.error('Failed to parse custom stats from localStorage:', e);
            }
        }
    }
    
    if (!selectedStats || selectedStats.length === 0) {
        return ''; // No custom stats selected
    }
    
    console.log('🎯 Rendering custom stats for player:', player.name, 'Selected stats:', selectedStats);
    
    // Build HTML for each selected stat
    const customStatsHTML = selectedStats.map(statId => {
        const statConfig = STAT_MAPPING[statId];
        
        if (!statConfig) {
            console.warn(`⚠️ Unknown stat ID: ${statId}`);
            return '';
        }
        
        // Get the stat value from player object (fallback to 0)
        let statValue = player[statConfig.key];
        if (!statValue || statValue === 0) {
            statValue = '-';
        }

        
        console.log(`📊 ${statConfig.label}: ${statValue} (${statConfig.key})`);
        
        return `
            <div class="stat-pill stat-pill-custom">
                <div class="stat-pill-value">${statValue}</div>
                <div class="stat-pill-label">${statConfig.label}</div>
            </div>
        `;

    }).filter(html => html !== '').join('');
    
    console.log('🎨 Generated custom stats HTML:', customStatsHTML);
    
    return customStatsHTML;
}

// Locate the createPlayerCard function in your app.js and replace it with this:

/**
 * Create a player row element for the Database/Watchlist views
 * Handles Supabase price integration with image fallbacks and 2-decimal formatting.
 * @param {Object} player - The player data object
 * @returns {HTMLElement} - The rendered player row
 */
function createPlayerCard(player) {

    console.log('🎯 createPlayerCard called with player:', player.name);
    console.log('🎯 Player keys:', Object.keys(player));
    console.log('🎯 Player acceleration:', player.acceleration);
    console.log('🎯 Custom stats:', window.customSelectedStats);
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
    // ✅ NEW: Parse alternate_position from API (supports multiple positions)
    let altPositionsArray = [];
    if (player.alternate_position) {
        // Parse comma-separated string or handle single position
        altPositionsArray = player.alternate_position
            .split(',')
            .map(pos => pos.trim())
            .filter(pos => pos.length > 0);
    }

    // Log for debugging
    console.log('[ALT POS]', player.name, '| Primary:', player.position, '| Alternates:', altPositionsArray);



    // 4. ROBUST PRICE & IMAGE LOGIC
    let displayPriceHTML = '';

    if (player.price !== undefined && player.price !== null) {
        const formattedPrice = typeof formatPrice === 'function'
            ? formatPrice(player.price)
            : player.price.toLocaleString();

      displayPriceHTML = `
          <span class="price-inline">
              <img src="assets/images/background/fc coin img.webp" alt="coin" class="price-icon">
              <span class="price-text">${formattedPrice}</span>
          </span>
      `;

    } else {
        displayPriceHTML = `
            <img src="https://images.zenithfcm.com/unauctionable.png"
                alt="Non-auctionable"
                style="height: 18px; width: auto; vertical-align: middle; opacity: 0.9; margin-left: 6px;"
                title="Non-auctionable">
        `;
    }



    // 5. Build HTML Structure
    card.innerHTML = `
        <div class="player-card-scale">
            <div class="player-row-card">
                <div class="player-card-image-container">
                    
                    ${player.card_background ? `
                        <img src="${player.card_background}" 
                        alt="Card Background" 
                        class="player-card-bg-image"
                        onerror="this.style.display='none'">
                    ` : ''}

                    ${player.player_image ? `
                        <img src="${player.player_image}" 
                            alt="${player.name}"
                            class="player-card-main-image"
                            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
                        <span class="player-initials" style="display:none">${getInitials(player.name)}</span>
                    ` : ` 
                        <span class="player-initials">${getInitials(player.name)}</span>
                    `}

                    <div class="player-card-name" style="color:${player.color_name || '#FFFFFF'};">
                        ${player.name}
                    </div>

                    <div class="player-card-ovr" style="color:${player.color_rating || '#FFB86B'};">
                        ${(() => {
                            // Define slotPosition based on player's own position
                            const slotPosition = (player.position || 'ST').toLowerCase();
                            const adjustedOVR = getPositionAdjustedOVR(player, slotPosition);
                            return adjustedOVR > 0 ? adjustedOVR : '?';
                        })()}
                    </div>


                    <div class="player-card-position" style="color:${player.color_position || '#FFFFFF'};">
                        ${player.position || '?'}
                    </div>

                    ${player.nation_flag ? `
                        <img src="${player.nation_flag}" 
                            alt="Nation"
                            class="player-card-nation-flag">
                    ` : ''}

                    ${player.club_flag ? `
                        <img src="${player.club_flag}" 
                            alt="Club"
                            class="player-card-club-flag">
                    ` : ''}

                </div>
            </div>
        </div>

        <div class="player-row-info">
            <div class="player-info-name">${player.name}</div>
            <div class="player-info-meta">${player.ovr || 'N/A'} • ${player.position || 'N/A'}</div>

            <div class="player-price" style="color:#fbbf24; font-weight:500; font-size:0.9rem; margin-top:4px; min-height:20px; display:flex; align-items:center;">
                ${displayPriceHTML}
            </div>

            ${altPositionsArray.filter(pos => pos && pos !== '0' && pos !== 0).length > 0 ? `
                <div class="player-info-secondary">
                    ${altPositionsArray.filter(pos => pos && pos !== '0' && pos !== 0).map(pos => `<span class="secondary-position-badge">${pos}</span>`).join('')}
                </div>
            ` : ''}
        </div>

        <div class="player-row-stats player-card-stats-row">
            <div class="stat-pill"><div class="stat-pill-value">${player.pace && player.pace > 0 ? player.pace : '-'}</div><div class="stat-pill-label">PAC</div></div>
            <div class="stat-pill"><div class="stat-pill-value">${player.shooting && player.shooting > 0 ? player.shooting : '-'}</div><div class="stat-pill-label">SHO</div></div>
            <div class="stat-pill"><div class="stat-pill-value">${player.passing && player.passing > 0 ? player.passing : '-'}</div><div class="stat-pill-label">PAS</div></div>
            <div class="stat-pill"><div class="stat-pill-value">${player.dribbling && player.dribbling > 0 ? player.dribbling : '-'}</div><div class="stat-pill-label">DRI</div></div>
            <div class="stat-pill"><div class="stat-pill-value">${player.defending && player.defending > 0 ? player.defending : '-'}</div><div class="stat-pill-label">DEF</div></div>
            <div class="stat-pill"><div class="stat-pill-value">${player.physical && player.physical > 0 ? player.physical : '-'}</div><div class="stat-pill-label">PHY</div></div>
            ${renderCustomStats(player)}
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

    // Main card click (View Details or assign to squad)
    card.addEventListener('click', function(e) {
        if (e.target.closest('.player-row-watchlist')) return;

        if (window.squadState && window.squadState.pendingDatabaseAssign && window.squadState.activeSlot) {
            const slotId = window.squadState.activeSlot;
            const playerId = player.player_id || player.id;
            const overall = player.ovr || player.overall || 0;

            if (typeof ensurePlayerInGlobalList === 'function') {
                ensurePlayerInGlobalList(player, playerId, overall);
            } else if (typeof addPlayerToCache === 'function') {
                addPlayerToCache({
                    ...player,
                    id: playerId,
                    player_id: playerId,
                    overall,
                    ovr: overall,
                    team: player.club || player.team,
                    club: player.club || player.team,
                    price: player.price || 0
                });
            }

            if (slotId.startsWith('BENCH')) {
                const index = parseInt(slotId.replace('BENCH', ''), 10);
                if (!Number.isNaN(index)) {
                    if (typeof isPlayerAlreadyInSquad === 'function' && isPlayerAlreadyInSquad(playerId, null)) {
                        return;
                    }
                    if (typeof removeIfAssigned === 'function') removeIfAssigned(playerId);
                    window.squadState.bench[index] = playerId;
                    if (typeof renderSquadBuilder === 'function') renderSquadBuilder();
                }
            } else {
                if (typeof validateAssignment === 'function' && !validateAssignment(player, slotId)) {
                    return;
                }
                if (typeof isPlayerAlreadyInSquad === 'function' && isPlayerAlreadyInSquad(playerId, slotId)) {
                    return;
                }
                if (typeof removeIfAssigned === 'function') removeIfAssigned(playerId);
                window.squadState.starters[slotId] = playerId;
                if (typeof renderSquadBuilder === 'function') renderSquadBuilder();
            }

            if (window.squadState) {
                window.squadState.lastAssignedPlayerId = playerId;
            }

            window.squadState.pendingDatabaseAssign = false;
            window.squadState.activeSlot = null;

            if (typeof switchView === 'function') switchView('squadbuilder');
            if (typeof openSquadBuilderModal === 'function') openSquadBuilderModal();
            return;
        }

        if (typeof viewPlayerDetail === 'function') {
            viewPlayerDetail(player.player_id);
        } else {
            console.log('Clicked player:', player.name, 'ID:', player.player_id);
        }
    });

    // Watchlist button click
    // Watchlist button click
    const watchBtn = card.querySelector('.player-row-watchlist');
    if (watchBtn) {
      watchBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        e.preventDefault();

        // Get ID from data attribute OR closure variable
        const id = this.dataset.uniqueId || uniqueId;
        console.log('❤️ Watchlist clicked! ID:', id);

        if (typeof window.toggleWatchlist === 'function') {
          window.toggleWatchlist(id);

          // ✅ ADD THIS - Force update UI after toggle
          setTimeout(() => {
            updateAllWatchlistButtons();
          }, 100);
        } else {
          console.error('window.toggleWatchlist not found!');
        }
      });
    }


    return card;
}


// ========== LOAD DATABASE FROM API ==========
// ========== LOAD DATABASE WITH FILTERS & PAGINATION ==========
// ========== LOAD WATCHLIST ==========
/*function applyWatchlistFilters(players) {
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
*/

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

        // ========== ✅ NEW: Add Auctionable filter ==========
        const auctionableToggle = document.getElementById('auctionable-toggle');
        const mobileAuctionable = document.getElementById('mobile-filter-auctionable')?.value || '';
        console.log('[DEBUG] Auctionable toggle element:', auctionableToggle);
        console.log('[DEBUG] Toggle checked state:', auctionableToggle?.checked);
        const auctionableFilter = auctionableToggle?.checked
            ? 'auctionable'
            : ((state.filters && state.filters.auctionable) || mobileAuctionable || '');
        if (auctionableFilter === 'auctionable') {
            // Only show tradable players (is_untradable = 0)
            filters.is_untradable = 0;
            console.log('[DEBUG] Auctionable filter: Auctionable only (is_untradable = 0)');
        } else if (auctionableFilter === 'unauctionable') {
            // Only show non-tradable players (is_untradable = 1)
            filters.is_untradable = 1;
            console.log('[DEBUG] Auctionable filter: Non-auctionable only (is_untradable = 1)');
        } else {
            console.log('[DEBUG] Auctionable filter: All players (no is_untradable filter)');
        }
        // When toggle is OFF, don't send filter = show all players


        console.log('[DATABASE] Fetching with filters:', filters);
        console.log('[DEBUG] Full filter object:', JSON.stringify(filters, null, 2));
        console.log('[DEBUG] is_untradable in filters?', 'is_untradable' in filters, '- Value:', filters.is_untradable);


        // 1. Fetch from Metadata API
        const response = await apiClient.getPlayers(filters);

        if (!response || !response.players) {
            throw new Error('Invalid API response');
        }

        let players = response.players;

        // ========== DEBUG: Check what we received ==========
        console.log('[DEBUG] API returned total players:', players.length);
        console.log('[DEBUG] First 3 players sample:', players.slice(0, 3).map(p => ({
            name: p.name,
            is_untradable: p.is_untradable,
            price: p.price
        })));
        console.log('[DEBUG] Players with is_untradable=0:', players.filter(p => p.is_untradable === 0 || p.is_untradable === '0').length);
        console.log('[DEBUG] Players with is_untradable=1:', players.filter(p => p.is_untradable === 1 || p.is_untradable === '1').length);
      

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

        // ✅ SORT PLAYERS BEFORE RENDERING
            let sortedPlayers = [...players]; // Create copy
            
            if (state.sortBy === 'name') {
                // Sort A-Z alphabetically
                sortedPlayers.sort((a, b) => {
                    const nameA = (a.name || '').toLowerCase();
                    const nameB = (b.name || '').toLowerCase();
                    return nameA.localeCompare(nameB);
                });
                console.log('[SORT] Sorted by name (A-Z)');
            } 
            else if (state.sortBy === 'rating') {
                // Sort by OVR highest to lowest
                sortedPlayers.sort((a, b) => {
                    return (b.ovr || 0) - (a.ovr || 0);
                });
                console.log('[SORT] Sorted by rating (high to low)');
            } 
            else if (state.sortBy === 'price') {
                // Sort by price highest to lowest
                sortedPlayers.sort((a, b) => {
                    return (b.price || 0) - (a.price || 0);
                });
                console.log('[SORT] Sorted by price (high to low)');
            }
            
            // Render sorted players
            sortedPlayers.forEach(player => {
                const card = createPlayerCard(player);
                container.appendChild(card);
            });

            updateAllWatchlistButtons();
            // ========== HORIZONTAL SCROLL SYNC ==========
            initDatabaseScrollSync();


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
    // Around line 3800-3900 in your initFilters function
    // Replace the Rating Min filter section with:

    // Replace the Rating Min filter section in initFilters():
    // Rating Min filter - FIXED VERSION
    const ratingMin = document.getElementById('rating-min');
    if (ratingMin) {
        ratingMin.setAttribute('min', '40');
        ratingMin.setAttribute('max', '150');
        
        let ratingMinTimeout;
        
        // Input event - just update display, don't modify the input
        ratingMin.addEventListener('input', (e) => {
            console.log('🔵 MIN INPUT - Raw value:', e.target.value);
            
            let value = parseInt(e.target.value);
            
            // Allow incomplete input while typing
            if (isNaN(value) || e.target.value === '') {
                console.log('  Incomplete input, skipping');
                return;
            }
            
            // DON'T modify e.target.value here - let user finish typing
            // Just update state and display
            state.filters.ratingMin = value;
            updateRatingDisplay();
            
            console.log('  Updated state to:', value);
        });
        
        // Blur event - validate and clamp when user leaves the field
        ratingMin.addEventListener('blur', (e) => {
            console.log('🔵 MIN BLUR - Validating');
            
            let value = parseInt(e.target.value);
            
            if (isNaN(value) || e.target.value === '') {
                value = 40; // Default to min
            }
            
            // NOW enforce limits
            value = Math.max(40, Math.min(150, value));
            
            // Ensure min <= max
            if (value > state.filters.ratingMax) {
                value = state.filters.ratingMax;
            }
            
            // Update both input and state
            e.target.value = value;
            state.filters.ratingMin = value;
            updateRatingDisplay();
            
            console.log('  Final validated value:', value);
            
            // Reload data
            state.currentOffset = 0;
            if (state.currentView === 'database') loadDatabase();
            if (state.currentView === 'watchlist') loadWatchlist();
        });
    }

    // Rating Max filter - FIXED VERSION
    const ratingMax = document.getElementById('rating-max');
    if (ratingMax) {
        ratingMax.setAttribute('min', '40');
        ratingMax.setAttribute('max', '150');
        
        let ratingMaxTimeout;
        
        // Input event - just update display, don't modify the input
        ratingMax.addEventListener('input', (e) => {
            console.log('🟢 MAX INPUT - Raw value:', e.target.value);
            
            let value = parseInt(e.target.value);
            
            // Allow incomplete input while typing
            if (isNaN(value) || e.target.value === '') {
                console.log('  Incomplete input, skipping');
                return;
            }
            
            // DON'T modify e.target.value here
            state.filters.ratingMax = value;
            updateRatingDisplay();
            
            console.log('  Updated state to:', value);
        });
        
        // Blur event - validate and clamp when user leaves the field
        ratingMax.addEventListener('blur', (e) => {
            console.log('🟢 MAX BLUR - Validating');
            
            let value = parseInt(e.target.value);
            
            if (isNaN(value) || e.target.value === '') {
                value = 150; // Default to max
            }
            
            // NOW enforce limits
            value = Math.max(40, Math.min(150, value));
            
            // Ensure max >= min
            if (value < state.filters.ratingMin) {
                value = state.filters.ratingMin;
            }
            
            // Update both input and state
            e.target.value = value;
            state.filters.ratingMax = value;
            updateRatingDisplay();
            
            console.log('  Final validated value:', value);
            
            // Reload data
            state.currentOffset = 0;
            if (state.currentView === 'database') loadDatabase();
            if (state.currentView === 'watchlist') loadWatchlist();
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

        // Auctionable Toggle Handler
        const auctionableToggle = document.getElementById('auctionable-toggle');
        const auctionStatusText = document.getElementById('auction-status-text');

        console.log('[DEBUG INIT] Auctionable toggle found:', !!auctionableToggle);
        console.log('[DEBUG INIT] Status text element found:', !!auctionStatusText);

        if (auctionableToggle && auctionStatusText) {
            auctionableToggle.addEventListener('change', (e) => {
                console.log('[DEBUG EVENT] Toggle changed! New state:', e.target.checked);
                // Update text
                if (e.target.checked) {
                    auctionStatusText.textContent = 'Only With Prices';
                    console.log('[DEBUG EVENT] Text updated to: Only With Prices');
                } else {
                    auctionStatusText.textContent = 'All Players';
                    console.log('[DEBUG EVENT] Text updated to: All Players');
                }
                if (state && state.filters) {
                    state.filters.auctionable = e.target.checked ? 'auctionable' : '';
                }
                
                // Re-apply filters
                state.currentOffset = 0;
                console.log('[DEBUG EVENT] Reloading database...');
                if (state.currentView === 'database') loadDatabase();
                if (state.currentView === 'watchlist') loadWatchlist();
            });
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
        ratingMax: 120,
        priceMin: null,
        priceMax: null,
        league: '',
        nation: '',
        club: '',
        skillMoves: '',
        event: '',
        auctionable: ''
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

    const auctionableToggle = document.getElementById('auctionable-toggle');
    const auctionStatusText = document.getElementById('auction-status-text');
    if (auctionableToggle) {
        auctionableToggle.checked = false;
        if (auctionStatusText) auctionStatusText.textContent = 'All Players';
    }

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
}



// Initialize Application
document.addEventListener('DOMContentLoaded', async function () {
  // ----------------------------
  // Core startup
  // ----------------------------
  initCountryAutocomplete('filter-nation', 'filter-nation-list');
  initCountryAutocomplete('mobile-filter-nation', 'mobile-filter-nation-list');

  console.log('[APP] Initializing Zenith App...');

  const logoImg = document.querySelector('.logo-image');
  if (logoImg) {
    const logoPath = logoImg.getAttribute('src');
    const logLogoLoaded = () => console.info('[LOGO] Logo loaded successfully:', logoPath);
    if (logoImg.complete && logoImg.naturalWidth > 0) {
      logLogoLoaded();
    } else {
      logoImg.addEventListener('load', logLogoLoaded, { once: true });
    }
  }

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
      let players = response.results || [];
      const total = response.total || 0;

      console.log('[SEARCH] Found', players.length, 'players, total:', total);

      // 🔥 Sync prices with Supabase (same as regular database view)
      if (window.supabaseProvider && typeof window.supabaseProvider.syncPrices === 'function') {
        console.log('[SEARCH] Syncing prices for search results...');
        players = await window.supabaseProvider.syncPrices(players);
      }

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
    const cardBackground = player.card_background || player.cardBackground || player.cardbackground || 'https://via.placeholder.com/120x160';
    const playerImage = player.player_image || player.playerImage || player.playerimage || player.playerimg || '';
    const playerName = player.name || 'Unknown Player';
    const playerOvr = player.ovr || 'N/A';
    const playerPosition = player.position || 'N/A';

    // ========== FIXED: Show price for auctionable cards in search ==========
    const priceDisplay = isAuctionable && player.price
        ? `<div class="dropdown-player-price" style="color: #fbbf24; font-size: 12px; font-weight: 600;">${formatPrice(player.price)}</div>`
        : '';

    row.innerHTML = `
      <div class="dropdown-player-card">
          <div class="squad-custom-mini-card dropdown-mini-card">
            <img src="${cardBackground}" alt="Card Background" class="squad-custom-card-bg" onerror="this.src='https://via.placeholder.com/120x160'">
            ${playerImage ?
              `<img src="${playerImage}" alt="${playerName}" class="squad-custom-card-player-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
               <span class="player-initials" style="display: none;">${getInitials(playerName)}</span>` :
              `<span class="player-initials">${getInitials(playerName)}</span>`
            }
            <div class="squad-custom-card-ovr" style="color: ${player.color_rating || '#FFFFFF'}">${playerOvr}</div>
            <div class="squad-custom-card-position" style="color: ${player.color_position || '#FFFFFF'}">${playerPosition}</div>
            <div class="squad-custom-card-name" style="color: ${player.color_name || '#FFFFFF'}">${playerName}</div>
          </div>
      </div>

      <div class="dropdown-player-info">
          <div class="dropdown-player-name">${playerName}</div>
          <span class="dropdown-player-badge ${isAuctionable ? 'auctionable' : 'non-auctionable'}">
              ${isAuctionable ? '✅ Auctionable' : '🔴 Non-auctionable'}
          </span>
          ${priceDisplay}
      </div>

      <div class="dropdown-player-stats">
          <div class="dropdown-player-ovr">${playerOvr}</div>
          <div class="dropdown-player-position">${playerPosition}</div>
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
          console.log('[SORT] Changed to:', state.sortBy);
          
          // Reset offset and reload database with new sort
          state.currentOffset = 0;
          
          if (state.currentView === 'database') {
              loadDatabase();
          }
          if (state.currentView === 'watchlist') {
              loadWatchlist();
          }
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
      if (typeof state !== 'undefined' && state.currentView === 'database') {
        syncMobileClubFilterOptions();
      }
    } else {
      document.body.style.overflow = '';
    }
  }
}

function syncMobileClubFilterOptions() {
  const source = document.getElementById('filter-club');
  const target = document.getElementById('mobile-filter-team');
  if (!source || !target) return;
  if (target.dataset.synced === 'true') return;
  if (target.options.length > 1) {
    target.dataset.synced = 'true';
    return;
  }

  const fragment = document.createDocumentFragment();
  Array.from(source.options).forEach(option => {
    const cloned = option.cloneNode(true);
    fragment.appendChild(cloned);
  });

  target.innerHTML = '';
  target.appendChild(fragment);
  target.dataset.synced = 'true';
}

function applyMobileFilters() {
  const position = document.getElementById('mobile-filter-position')?.value || '';
  const ratingMin = parseInt(document.getElementById('mobile-rating-min')?.value, 10) || 40;
  const ratingMax = parseInt(document.getElementById('mobile-rating-max')?.value, 10) || 150;
  const priceMin = document.getElementById('mobile-price-min')?.value || '';
  const priceMax = document.getElementById('mobile-price-max')?.value || '';
  const league = document.getElementById('mobile-filter-league')?.value || '';
  const nation = document.getElementById('mobile-filter-nation')?.value || '';
  const skill = document.getElementById('mobile-filter-skill')?.value || '';
  const event = document.getElementById('mobile-filter-event')?.value || '';
  const sortBy = document.getElementById('mobile-sort-by')?.value || '';
  const teamElement = document.getElementById('mobile-filter-team');
  const team = teamElement ? teamElement.value : null;
  const auctionableStatus = document.getElementById('mobile-filter-auctionable')?.value || '';

  if (typeof state !== 'undefined' && state.currentView === 'watchlist') {
    if (typeof watchlistFilters !== 'undefined') {
      watchlistFilters.position = position;
      watchlistFilters.league = league;
      if (team !== null) {
        watchlistFilters.team = team;
      }
      watchlistFilters.nation = nation;
      watchlistFilters.event = event;
      watchlistFilters.skill_moves = skill;
      watchlistFilters.minOvr = ratingMin;
      watchlistFilters.maxOvr = ratingMax;
    }

    const watchlistMap = {
      'watchlist-filter-position': position,
      'watchlist-filter-league': league,
      'watchlist-filter-team': team,
      'watchlist-filter-nation': nation,
      'watchlist-filter-event': event,
      'watchlist-rating-min': ratingMin,
      'watchlist-rating-max': ratingMax
    };

    Object.keys(watchlistMap).forEach(id => {
      if (watchlistMap[id] === null) return;
      const el = document.getElementById(id);
      if (el !== null && el !== undefined) {
        el.value = watchlistMap[id];
      }
    });

    if (typeof applyWatchlistFilters === 'function') {
      applyWatchlistFilters();
    }

    if (sortBy) {
      const watchlistSort = document.getElementById('watchlist-sort-select');
      if (watchlistSort) {
        const sortMap = { name: 'Name', rating: 'Rating', price: 'Price' };
        watchlistSort.value = sortMap[sortBy] || sortBy;
        watchlistSort.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    if (typeof updateWatchlistFilterBadge === 'function') {
      updateWatchlistFilterBadge();
    }

    toggleMobileFilters();
    return;
  }

  if (typeof state !== 'undefined') {
    state.filters.position = position;
    state.filters.ratingMin = ratingMin;
    state.filters.ratingMax = ratingMax;
    state.filters.priceMin = priceMin === '' ? null : parseInt(priceMin, 10);
    state.filters.priceMax = priceMax === '' ? null : parseInt(priceMax, 10);
    state.filters.league = league;
    state.filters.club = team || '';
    state.filters.nation = nation;
    state.filters.skillMoves = skill;
    state.filters.event = event;
    state.filters.auctionable = auctionableStatus;
    if (sortBy) {
      state.sortBy = sortBy;
    }
    state.currentOffset = 0;
  }

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
  if (document.getElementById('filter-club'))
    document.getElementById('filter-club').value = team;
  if (document.getElementById('filter-nation'))
    document.getElementById('filter-nation').value = nation;
  if (document.getElementById('filter-skill'))
    document.getElementById('filter-skill').value = skill;

  if (document.getElementById('filter-event')) document.getElementById('filter-event').value = event;

  if (document.getElementById('sort-by'))
    document.getElementById('sort-by').value = sortBy;

  const auctionableToggle = document.getElementById('auctionable-toggle');
  const auctionStatusText = document.getElementById('auction-status-text');
  if (auctionableToggle) {
    if (auctionableStatus === 'auctionable') {
      auctionableToggle.checked = true;
      if (auctionStatusText) auctionStatusText.textContent = 'Only With Prices';
    } else {
      auctionableToggle.checked = false;
      if (auctionStatusText) {
        auctionStatusText.textContent = auctionableStatus === 'unauctionable'
          ? 'Non-auctionable Only'
          : 'All Players';
      }
    }
  }

  updateRatingDisplay();
  updatePriceDisplay();
  updateFilterBadge();
  toggleMobileFilters();

  if (typeof loadDatabase === 'function') {
    loadDatabase();
  }
}

function clearMobileFilters() {
  if (typeof state !== 'undefined' && state.currentView === 'watchlist') {
    if (typeof clearWatchlistFilters === 'function') {
      clearWatchlistFilters();
    }

    if (typeof updateWatchlistFilterBadge === 'function') {
      updateWatchlistFilterBadge();
    }

    return;
  }

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
  if (document.getElementById('mobile-filter-team'))
    document.getElementById('mobile-filter-team').value = '';
  if (document.getElementById('mobile-filter-nation'))
    document.getElementById('mobile-filter-nation').value = '';
  if (document.getElementById('mobile-filter-skill'))
    document.getElementById('mobile-filter-skill').value = '';

  if (document.getElementById('mobile-filter-event')) document.getElementById('mobile-filter-event').value = '';

  if (document.getElementById('mobile-filter-auctionable'))
    document.getElementById('mobile-filter-auctionable').value = '';

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
  if (document.getElementById('filter-club'))
    document.getElementById('filter-club').value = '';
  if (document.getElementById('filter-nation'))
    document.getElementById('filter-nation').value = '';
  if (document.getElementById('filter-skill'))
    document.getElementById('filter-skill').value = '';
  if (document.getElementById('sort-by'))
    document.getElementById('sort-by').value = 'name';

  const auctionableToggle = document.getElementById('auctionable-toggle');
  const auctionStatusText = document.getElementById('auction-status-text');
  if (auctionableToggle) {
    auctionableToggle.checked = false;
    if (auctionStatusText) auctionStatusText.textContent = 'All Players';
  }

  if (typeof state !== 'undefined') {
    state.filters.position = '';
    state.filters.ratingMin = 40;
    state.filters.ratingMax = 150;
    state.filters.priceMin = null;
    state.filters.priceMax = null;
    state.filters.league = '';
    state.filters.club = '';
    state.filters.nation = '';
    state.filters.skillMoves = '';
    state.filters.event = '';
    state.filters.auctionable = '';
    state.sortBy = 'name';
    state.currentOffset = 0;
  }

  updateRatingDisplay();
  updatePriceDisplay();
  updateFilterBadge();

  if (typeof loadDatabase === 'function') {
    loadDatabase();
  }
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
  const team = document.getElementById('mobile-filter-team')?.value || '';
  const nation = document.getElementById('mobile-filter-nation')?.value || '';
  const skill = document.getElementById('mobile-filter-skill')?.value || '';
  const event = document.getElementById('mobile-filter-event')?.value || '';
  const auctionableStatus = document.getElementById('mobile-filter-auctionable')?.value || '';

  const hasActiveFilters = position ||
    ratingMin != 40 ||
    ratingMax != 150 ||
    priceMin ||
    priceMax ||
    league ||
    team ||
    nation ||
    skill ||
    event ||
    auctionableStatus;

  badge.style.display = hasActiveFilters ? 'block' : 'none';
}

function updateWatchlistFilterBadge() {
  const badge = document.getElementById('watchlist-filter-badge');
  if (!badge) return;

  const wl = (typeof watchlistFilters !== 'undefined') ? watchlistFilters : null;

  const position = wl ? wl.position : (document.getElementById('mobile-filter-position')?.value || '');
  const league = wl ? wl.league : (document.getElementById('mobile-filter-league')?.value || '');
  const team = wl ? wl.team : (document.getElementById('mobile-filter-team')?.value || '');
  const nation = wl ? wl.nation : (document.getElementById('mobile-filter-nation')?.value || '');
  const event = wl ? wl.event : (document.getElementById('mobile-filter-event')?.value || '');
  const skill = wl ? wl.skill_moves : (document.getElementById('mobile-filter-skill')?.value || '');
  const minOvr = wl ? wl.minOvr : (parseInt(document.getElementById('mobile-rating-min')?.value, 10) || 40);
  const maxOvr = wl ? wl.maxOvr : (parseInt(document.getElementById('mobile-rating-max')?.value, 10) || 150);

  const hasActiveFilters = position ||
    league ||
    team ||
    nation ||
    event ||
    skill ||
    minOvr !== 40 ||
    maxOvr !== 150;

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
const ComparePlayersCustomizationState = {
  byPlayer: {},
  recalcTokens: {}
};

const compareState = {
  selectedPlayers: [],
  currentSlot: null,
  isBasicView: true,
  positionMode: null, // 'outfield' or 'gk'
  customizations: ComparePlayersCustomizationState.byPlayer,
  recalcTokens: ComparePlayersCustomizationState.recalcTokens
};

const compareDebugEnabled = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.search.includes('debug=true')
);

const compareLog = (message, payload) => {
  if (!compareDebugEnabled) return;
  if (payload !== undefined) {
    console.log(`[COMPARE] ${message}`, payload);
  } else {
    console.log(`[COMPARE] ${message}`);
  }
};

const compareCustomizationContext = {
  active: false,
  playerId: null,
  index: null,
  backup: null,
  requestId: 0,
  modalLabels: {},
  applied: false,
  hasPreview: false,
  skipRestore: false,
  initialPlayer: null,
  lastSnapshot: null
};

let compareSelectedRank = 0;
let compareTrainingLevel = 0;
let compareSkillBoost = {};

const compareCustomizationState = {
  playerId: null,
  selectedRank: 0,
  trainingLevel: 0,
  selectedSkills: [],
  baseOvr: null,
  basePosition: null,
  baseName: null,
  baseColors: null,
  player: null
};

function resetCompareCustomizationState() {
  ComparePlayersCustomizationState.byPlayer = {};
  ComparePlayersCustomizationState.recalcTokens = {};
  compareState.customizations = ComparePlayersCustomizationState.byPlayer;
  compareState.recalcTokens = ComparePlayersCustomizationState.recalcTokens;
  compareCustomizationState.playerId = null;
  compareCustomizationState.selectedRank = 0;
  compareCustomizationState.trainingLevel = 0;
  compareCustomizationState.selectedSkills = [];
  compareCustomizationState.baseOvr = null;
  compareCustomizationState.basePosition = null;
  compareCustomizationState.baseName = null;
  compareCustomizationState.baseColors = null;
  compareCustomizationState.player = null;
  compareSelectedRank = 0;
  compareTrainingLevel = 0;
  compareSkillBoost = {};
}

function ensureCompareCustomizationModalRoot() {
  const modal = document.getElementById('squad-player-customization-modal');
  if (!modal) return;
  if (modal.parentElement !== document.body) {
    document.body.appendChild(modal);
  }
}

const resolveComparePlayerId = (playerOrId) => {
  if (!playerOrId) return null;
  if (typeof playerOrId === 'object') {
    return playerOrId.player_id || playerOrId.id || playerOrId.playerid || null;
  }
  return playerOrId;
};

const resolveComparePlayerLabel = (player, index) => {
  const name = player?.name || player?.player_name || '';
  return name ? name : `Player ${index + 1}`;
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

const normalizeCompareKey = (value) => String(value || '').toLowerCase().replace(/_/g, '');

const getCompareCustomization = (playerId) => {
  const resolvedId = resolveComparePlayerId(playerId);
  if (!resolvedId) return null;
  return compareState.customizations[resolvedId] || null;
};

const setCompareCustomization = (playerId, updates = {}) => {
  const resolvedId = resolveComparePlayerId(playerId);
  if (!resolvedId) return;
  const current = compareState.customizations[resolvedId] || {};
  compareState.customizations[resolvedId] = { ...current, ...updates };
};

const clearCompareCustomization = (playerId) => {
  const resolvedId = resolveComparePlayerId(playerId);
  if (!resolvedId) return;
  delete compareState.customizations[resolvedId];
  delete compareState.recalcTokens[resolvedId];
};

const getCompareBaseStat = (player, ...names) => {
  if (typeof window.getStat === 'function') {
    return window.getStat(player, ...names);
  }
  for (const name of names) {
    if (player?.[name] !== undefined && player?.[name] !== null) return player[name];
  }
  return 0;
};

const getCompareBoostValue = (boosts, ...names) => {
  if (!boosts) return 0;
  const entries = Object.entries(boosts);
  for (const name of names) {
    const normalized = normalizeCompareKey(name);
    const match = entries.find(([key]) => normalizeCompareKey(key) === normalized);
    if (match) {
      const value = Number(match[1]);
      return Number.isFinite(value) ? value : 0;
    }
  }
  return 0;
};

const getCompareBoostedStat = (player, boosts, ...names) => {
  const base = Number(getCompareBaseStat(player, ...names)) || 0;
  const boost = getCompareBoostValue(boosts, ...names);
  const value = base + boost;
  return Number.isFinite(value) ? value : 0;
};

const roundCompareValue = (val) => Math.floor(val + 0.5);

const calculateComparePace = (player, boosts) => {
  const acceleration = getCompareBoostedStat(player, boosts, 'acceleration');
  const sprintSpeed = getCompareBoostedStat(player, boosts, 'sprint_speed');
  const val = (
    0.49299585008602 * acceleration +
    0.50528383239125 * sprintSpeed +
    -0.13701200270336
  );
  return roundCompareValue(val);
};

const calculateCompareShooting = (player, boosts) => {
  const finishing = getCompareBoostedStat(player, boosts, 'finishing');
  const longShot = getCompareBoostedStat(player, boosts, 'long_shot', 'long_shots');
  const shotPower = getCompareBoostedStat(player, boosts, 'shot_power');
  const positioning = getCompareBoostedStat(player, boosts, 'positioning');
  const volley = getCompareBoostedStat(player, boosts, 'volley', 'volleys');
  const penalties = getCompareBoostedStat(player, boosts, 'penalties');
  const val = (
    0.35066661652365 * finishing +
    0.20012280256486 * longShot +
    0.19946956407192 * shotPower +
    0.15019769557113 * positioning +
    0.04977322484935 * volley +
    0.04962618730771 * penalties +
    -0.46621901229077
  );
  return roundCompareValue(val);
};

const calculateComparePassing = (player, boosts) => {
  const shortPassing = getCompareBoostedStat(player, boosts, 'short_passing');
  const longPassing = getCompareBoostedStat(player, boosts, 'long_passing');
  const vision = getCompareBoostedStat(player, boosts, 'vision');
  const crossing = getCompareBoostedStat(player, boosts, 'crossing');
  const curve = getCompareBoostedStat(player, boosts, 'curve');
  const freeKick = getCompareBoostedStat(player, boosts, 'free_kick', 'fk_accuracy');
  const val = (
    0.30073301682698 * shortPassing +
    0.19979430277541 * longPassing +
    0.24897437527999 * vision +
    0.15031023108744 * crossing +
    0.05004649307871 * curve +
    0.05012756181062 * freeKick +
    -0.48084074176376
  );
  return roundCompareValue(val);
};

const calculateCompareDribbling = (player, boosts) => {
  const dribbling = getCompareBoostedStat(player, boosts, 'dribbling');
  const balance = getCompareBoostedStat(player, boosts, 'balance');
  const agility = getCompareBoostedStat(player, boosts, 'agility');
  const reactions = getCompareBoostedStat(player, boosts, 'reactions');
  const ballControl = getCompareBoostedStat(player, boosts, 'ball_control');
  const val = (
    0.25044329239850 * dribbling +
    0.10001066600723 * balance +
    0.25025392646353 * agility +
    0.15074674532686 * reactions +
    0.24872793523704 * ballControl +
    -0.48832284057254
  );
  return roundCompareValue(val);
};

const calculateCompareDefending = (player, boosts) => {
  const marking = getCompareBoostedStat(player, boosts, 'marking');
  const standingTackle = getCompareBoostedStat(player, boosts, 'standing_tackle');
  const slidingTackle = getCompareBoostedStat(player, boosts, 'sliding_tackle');
  const awareness = getCompareBoostedStat(player, boosts, 'awareness', 'interceptions');
  const heading = getCompareBoostedStat(player, boosts, 'heading');
  const val = (
    0.25029448767320 * marking +
    0.20107682619015 * standingTackle +
    0.19924427638513 * slidingTackle +
    0.19952899013166 * awareness +
    0.15010172584902 * heading +
    -0.49709228500345
  );
  return roundCompareValue(val);
};

const calculateComparePhysical = (player, boosts) => {
  const strength = getCompareBoostedStat(player, boosts, 'strength');
  const aggression = getCompareBoostedStat(player, boosts, 'aggression');
  const jumping = getCompareBoostedStat(player, boosts, 'jumping');
  const stamina = getCompareBoostedStat(player, boosts, 'stamina_stat', 'stamina');
  const val = (
    0.44955969076149 * strength +
    0.29976663944687 * aggression +
    0.25058507302003 * jumping +
    0.00061181921524 * stamina +
    -0.50936016832054
  );
  return roundCompareValue(val);
};

const calculateCompareGKPhysical = (player, boosts) => {
  const reactions = getCompareBoostedStat(player, boosts, 'reactions');
  const agility = getCompareBoostedStat(player, boosts, 'agility');
  const sprintSpeed = getCompareBoostedStat(player, boosts, 'sprint_speed');
  const strength = getCompareBoostedStat(player, boosts, 'strength');
  const val = (
    0.64960512284621 * reactions +
    0.15093757174982 * agility +
    0.09981357061375 * sprintSpeed +
    0.09995255942967 * strength +
    -0.48764601442207
  );
  return roundCompareValue(val);
};

const getCompareStatValue = (player, stat) => {
  if (!player || !stat) return 0;
  const boosts = player.compare_boosts || player.training_boosts || null;
  switch (stat.apiField) {
    case 'pace':
      return calculateComparePace(player, boosts);
    case 'shooting':
      return calculateCompareShooting(player, boosts);
    case 'passing':
      return calculateComparePassing(player, boosts);
    case 'dribbling':
      return calculateCompareDribbling(player, boosts);
    case 'defending':
      return calculateCompareDefending(player, boosts);
    case 'physical':
      return compareState.positionMode === 'gk' || player.position === 'GK'
        ? calculateCompareGKPhysical(player, boosts)
        : calculateComparePhysical(player, boosts);
    case 'gk_diving':
      return getCompareBoostedStat(player, boosts, 'gk_diving', 'diving');
    case 'gk_positioning':
      return getCompareBoostedStat(player, boosts, 'gk_positioning', 'positioning');
    case 'gk_handling':
      return getCompareBoostedStat(player, boosts, 'gk_handling', 'handling');
    case 'gk_reflexes':
      return getCompareBoostedStat(player, boosts, 'gk_reflexes', 'reflexes');
    case 'gk_kicking':
      return getCompareBoostedStat(player, boosts, 'gk_kicking', 'kicking');
    case 'long_shot':
      return Math.round(getCompareBoostedStat(player, boosts, 'long_shot', 'long_shots'));
    case 'free_kick':
      return Math.round(getCompareBoostedStat(player, boosts, 'free_kick', 'fk_accuracy'));
    case 'stamina_stat':
      return Math.round(getCompareBoostedStat(player, boosts, 'stamina_stat', 'stamina'));
    case 'awareness':
      return Math.round(getCompareBoostedStat(player, boosts, 'awareness', 'interceptions'));
    default:
      return Math.round(getCompareBoostedStat(player, boosts, stat.apiField));
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
    resetCompareCustomizationState();
    compareState.currentSlot = null;
    compareCustomizationContext.active = false;
    compareCustomizationContext.playerId = null;
    compareCustomizationContext.index = null;
    compareCustomizationContext.backup = null;
    compareCustomizationContext.modalLabels = {};
    compareCustomizationContext.applied = false;
    compareCustomizationContext.hasPreview = false;
    compareCustomizationContext.skipRestore = false;
    compareCustomizationContext.initialPlayer = null;
    compareCustomizationContext.lastSnapshot = null;

    document.getElementById('basic-stats-btn')?.classList.add('active');
    document.getElementById('advanced-stats-btn')?.classList.remove('active');

    renderCompareCards();
    updateCompareCountBadge();
    generateCompareStatsGrid();
    compareLog('Modal opened');
  }
}

// Close Compare Modal
function closeCompareModal() {
  const modal = document.getElementById('compare-players-modal');
  if (!modal) return;
  if (compareCustomizationContext.active && typeof window.closePlayerCustomizationModal === 'function') {
    window.closePlayerCustomizationModal();
  }
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

  compareState.selectedPlayers.forEach((player) => {
    const card = createFilledPlayerCard(player);
    grid.appendChild(card);
  });

  if (compareState.selectedPlayers.length < 5) {
    const emptyCard = createEmptyPlayerCard(compareState.selectedPlayers.length);
    grid.appendChild(emptyCard);
  }
}

function refreshCompareEmptyCard() {
  const grid = document.getElementById('compare-cards-grid');
  if (!grid) return;

  grid.querySelectorAll('.compare-player-card.empty-state').forEach(card => card.remove());

  if (compareState.selectedPlayers.length < 5) {
    const emptyCard = createEmptyPlayerCard(compareState.selectedPlayers.length);
    grid.appendChild(emptyCard);
  }
}

function appendComparePlayerCard(player) {
  const grid = document.getElementById('compare-cards-grid');
  if (!grid) return;

  const card = createFilledPlayerCard(player);
  grid.appendChild(card);
  refreshCompareEmptyCard();

  const playerId = resolveComparePlayerId(player);
  console.log("[ComparePlayers] Rendering card:", playerId);
  console.log("[ComparePlayers] Existing cards unchanged");
}

function updateCompareCardForPlayer(playerId) {
  const resolvedId = resolveComparePlayerId(playerId);
  if (!resolvedId) return;
  const index = compareState.selectedPlayers.findIndex(
    player => resolveComparePlayerId(player) === resolvedId
  );
  if (index < 0) return;
  const player = compareState.selectedPlayers[index];
  const card = document.querySelector(
    `.compare-player-card.filled-state[data-player-id="${resolvedId}"]`
  );
  if (!card) {
    renderCompareCards();
    return;
  }
  const ovrEl = card.querySelector('.compare-card-ovr');
  if (ovrEl) {
    const customization = getCompareCustomization(resolvedId);
    const baseColor = customization?.baseColors?.color_rating || player.color_rating || '#FFB86B';
    const customizationBaseOvr = Number.parseInt(customization?.baseOvr, 10);
    const fallbackBaseOvr = Number.parseInt(player.base_ovr, 10);
    const baseOvr = Number.isFinite(customizationBaseOvr)
      ? customizationBaseOvr
      : (Number.isFinite(fallbackBaseOvr) ? fallbackBaseOvr : Number.parseInt(player.ovr, 10) || 0);
    const parsedRank = Number.parseInt(customization?.selectedRank, 10);
    const fallbackRank = Number.parseInt(player.rank || 0, 10);
    const rawRank = Number.isFinite(parsedRank) ? parsedRank : (Number.isFinite(fallbackRank) ? fallbackRank : 0);
    const rankBonus = typeof getSquadRankOvrBonus === 'function'
      ? getSquadRankOvrBonus(rawRank)
      : rawRank;
    const finalOvr = Number(player.ovr || player.overall || 0);
    console.log('[ComparePlayers] Base OVR:', baseOvr);
    console.log('[ComparePlayers] Rank Bonus:', rankBonus);
    console.log('[ComparePlayers] Final OVR Rendered:', finalOvr);
    ovrEl.textContent = finalOvr > 0 ? finalOvr : 'NA';
    ovrEl.style.color = baseColor;
    console.log('[ComparePlayers] OVR color locked to base card color');
  }
}

function updateCompareCardRankOverlay(playerId, rankValue) {
  if (typeof applyRankOverlay !== 'function') return;
  const resolvedId = resolveComparePlayerId(playerId);
  if (!resolvedId) return;
  const card = document.querySelector(
    `.compare-player-card.filled-state[data-player-id="${resolvedId}"]`
  );
  if (!card) return;
  applyRankOverlay(card, rankValue, {
    scope: 'compare',
    modifierClass: 'rank-overlay--compare'
  });
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

function openCompareCustomizationById(playerId) {
  const resolvedId = resolveComparePlayerId(playerId);
  if (!resolvedId) return;
  const index = compareState.selectedPlayers.findIndex(
    player => resolveComparePlayerId(player) === resolvedId
  );
  if (index < 0) return;
  openCompareCustomization(compareState.selectedPlayers[index], index);
}

function createFilledPlayerCard(player) {
  const card = document.createElement('div');
  card.className = 'compare-player-card filled-state new-card';
  const playerId = resolveComparePlayerId(player);
  const customization = getCompareCustomization(playerId);
  const baseOvrColor = customization?.baseColors?.color_rating || player.color_rating || '#FFB86B';
  card.dataset.playerId = playerId || '';
  card.addEventListener('click', () => openCompareCustomizationById(playerId));

  const playerName = player?.name || 'Unknown Player';
  card.innerHTML = `
    <!-- Remove Button (X) -->
    <button class="player-remove-btn" type="button">×</button>
    
    <!-- FIFA Card Container -->
    ${player.card_background ? `
    <img src="${player.card_background}" 
        alt="Card Background" 
        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
        onerror="this.style.display='none'">
    ` : ''}
      
    <!-- Player Image -->
    ${player.player_image ? `
        <img src="${player.player_image}" 
            alt="${playerName}"
            style="position: absolute; top: 60%; left: 50%; transform: translate(-50%, -50%); width: 130%; height: 130%; object-fit: contain;"
            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
        <span class="player-initials" style="display:none">${getInitials(playerName)}</span>
    ` : `
        <span class="player-initials">${getInitials(playerName)}</span>
    `}
      
    <!-- OVR -->
    <div class="compare-card-ovr" style="color: ${baseOvrColor}">
      ${player.ovr && player.ovr > 0 ? player.ovr : 'NA'}
    </div>
      
    <!-- Position -->
    <div class="compare-card-pos" style="color: ${player.color_position || '#FFFFFF'}">
      ${player.position || 'NA'}
    </div>
      
    <!-- Player Name -->
    <div class="compare-card-name" style="color: ${player.color_name || '#FFFFFF'}">
      ${playerName}
    </div>
      
    <!-- Nation -->
    ${player.nation_flag ? `
      <img class="compare-nation-flag"
           src="${player.nation_flag}"
           alt="Nation"
           onerror="this.style.display='none'">
    ` : ''}

    <!-- Club -->
    ${player.club_flag ? `
      <img class="compare-club-flag"
           src="${player.club_flag}"
           alt="Club"
           onerror="this.style.display='none'">
    ` : ''}

    <!-- Team Name Below -->
    <p class="compare-team-text">${player.team || 'N/A'}</p>
  `;

  const removeBtn = card.querySelector('.player-remove-btn');
  if (removeBtn) {
    removeBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      removeComparePlayerById(playerId);
    });
  }
  if (typeof applyRankOverlay === 'function') {
    const customization = getCompareCustomization(playerId);
    const rankValue = customization?.selectedRank ?? player?.rank ?? 0;
    applyRankOverlay(card, rankValue, {
      scope: 'compare',
      modifierClass: 'rank-overlay--compare'
    });
  }
  return card;
}

function removeComparePlayer(index) {
  const removedPlayer = compareState.selectedPlayers[index];
  const removedId = resolveComparePlayerId(removedPlayer);
  if (removedId) {
    clearCompareCustomization(removedId);
  }
  const removedCard = removedId
    ? document.querySelector(`.compare-player-card.filled-state[data-player-id="${removedId}"]`)
    : document.querySelectorAll('.compare-player-card.filled-state')[index];
  if (removedCard) {
    removedCard.classList.add('removing');
  }
  setTimeout(() => {
    compareState.selectedPlayers.splice(index, 1);
    if (compareState.selectedPlayers.length === 0) {
      compareState.positionMode = null;
    }
    if (removedId && compareCustomizationContext.active && compareCustomizationContext.playerId === removedId) {
      window.closePlayerCustomizationModal?.();
    }
    if (removedCard && removedCard.parentElement) {
      removedCard.remove();
    }
    refreshCompareEmptyCard();
    updateCompareCountBadge();
    generateCompareStatsGrid();
  }, 300);
}

function backupSquadCustomizationState() {
  if (!window.squadCustomizationState) return null;
  return {
    playerId: window.squadCustomizationState.playerId,
    slotId: window.squadCustomizationState.slotId,
    selectedRank: window.squadCustomizationState.selectedRank,
    trainingLevel: window.squadCustomizationState.trainingLevel,
    selectedSkills: Array.isArray(window.squadCustomizationState.selectedSkills)
      ? [...window.squadCustomizationState.selectedSkills]
      : [],
    baseOvr: window.squadCustomizationState.baseOvr,
    basePosition: window.squadCustomizationState.basePosition,
    baseName: window.squadCustomizationState.baseName,
    baseColors: window.squadCustomizationState.baseColors
      ? { ...window.squadCustomizationState.baseColors }
      : null,
    savedByPlayer: window.squadCustomizationState.savedByPlayer
      ? { ...window.squadCustomizationState.savedByPlayer }
      : {}
  };
}

function restoreSquadCustomizationState(snapshot) {
  if (!window.squadCustomizationState || !snapshot) return;
  Object.assign(window.squadCustomizationState, snapshot);
  if (snapshot.savedByPlayer) {
    window.squadCustomizationState.savedByPlayer = { ...snapshot.savedByPlayer };
  }
}

function updateCompareCustomizationModalLabels(isCompare) {
  const removeBtn = document.getElementById('squad-remove-btn');
  const applyBtn = document.getElementById('squad-apply-btn');
  if (isCompare) {
    compareCustomizationContext.modalLabels = compareCustomizationContext.modalLabels || {};
    if (removeBtn && !compareCustomizationContext.modalLabels.remove) {
      compareCustomizationContext.modalLabels.remove = removeBtn.innerHTML;
    }
    if (applyBtn && !compareCustomizationContext.modalLabels.apply) {
      compareCustomizationContext.modalLabels.apply = applyBtn.innerHTML;
    }
    if (removeBtn) {
      removeBtn.innerHTML = '<span>🗑️</span><span>Remove from Compare</span>';
    }
    if (applyBtn) {
      applyBtn.innerHTML = '<span>✓</span><span>Apply to Compare</span>';
    }
  } else {
    if (removeBtn && compareCustomizationContext.modalLabels?.remove) {
      removeBtn.innerHTML = compareCustomizationContext.modalLabels.remove;
    }
    if (applyBtn && compareCustomizationContext.modalLabels?.apply) {
      applyBtn.innerHTML = compareCustomizationContext.modalLabels.apply;
    }
  }
}

function persistCompareCustomizationState(reason = 'update') {
  const playerId = compareCustomizationState.playerId;
  if (!playerId) return null;
  const resolvedId = resolveComparePlayerId(playerId);
  const stillSelected = compareState.selectedPlayers.some(
    player => resolveComparePlayerId(player) === resolvedId
  );
  if (!stillSelected) return null;
  const snapshot = getCompareCustomizationSnapshot();
  setCompareCustomization(playerId, snapshot);
  compareCustomizationContext.lastSnapshot = snapshot;
  compareLog('Customization persisted', { playerId, reason, snapshot });
  return snapshot;
}

function updateCompareRankBoxes(selectedRank) {
  document.querySelectorAll('.squad-rank-box').forEach(box => {
    const rank = parseInt(box.dataset.rank, 10);
    if (rank === selectedRank) {
      box.classList.add('selected');
      box.style.borderColor = selectedRank === 1 ? 'rgba(59,214,113,0.6)' :
                             selectedRank === 2 ? 'rgba(99,102,241,0.6)' :
                             selectedRank === 3 ? 'rgba(139,92,246,0.6)' :
                             selectedRank === 4 ? 'rgba(255,184,107,0.6)' :
                             'rgba(255,107,107,0.6)';
      box.style.boxShadow = `0 0 12px ${selectedRank === 1 ? '#3BD671' : selectedRank === 2 ? '#6366F1' : selectedRank === 3 ? '#8B5CF6' : selectedRank === 4 ? '#FFB86B' : '#FF6B6B'}50`;
    } else {
      box.classList.remove('selected');
      box.style.borderColor = 'rgba(255,255,255,0.1)';
      box.style.boxShadow = 'none';
    }
  });
}

function renderCompareSkillsMessage(message) {
  const container = document.getElementById('squad-custom-skills');
  if (!container) return;
  container.innerHTML = `<p style="color: #98A0A6; text-align: center;">${message}</p>`;
}

function renderCompareCustomizationMiniCard(player) {
  const container = document.getElementById('squad-custom-player-card');
  if (!container) return;

  if (!player) {
    container.innerHTML = '<p style="color: #888;">Player not found</p>';
    return;
  }

  const cardBg = player.card_background || player.cardBackground || player.cardbackground || 'https://via.placeholder.com/180x240';
  const playerImg = player.player_image || player.playerImage || player.playerimage || player.playerimg || 'https://via.placeholder.com/120x120';
  const playerName = player.name || 'Unknown Player';
  const position = player.position || 'N/A';
  const nationFlag = player.nation_flag || player.nationFlag || player.nationflag || '';
  const clubFlag = player.club_flag || player.clubFlag || player.clubflag || '';

  container.innerHTML = `
    <div class="squad-custom-mini-card">
      <img src="${cardBg}" alt="Card Background" class="squad-custom-card-bg" onerror="this.src='https://via.placeholder.com/180x240'">
      <img src="${playerImg}" alt="${playerName}" class="squad-custom-card-player-img" onerror="this.style.display='none'">
      <div class="squad-custom-card-ovr" style="color: ${player.color_rating || '#FFFFFF'}">${player.ovr && player.ovr > 0 ? player.ovr : 'N/A'}</div>
      <div class="squad-custom-card-position" style="color: ${player.color_position || '#FFFFFF'}">${position}</div>
      <div class="squad-custom-card-flags">
        ${nationFlag ? `<img src="${nationFlag}" alt="Nation" class="squad-custom-card-flag" onerror="this.style.display='none'">` : ''}
        ${clubFlag ? `<img src="${clubFlag}" alt="Club" class="squad-custom-card-club" onerror="this.style.display='none'">` : ''}
      </div>
      <div class="squad-custom-card-name" style="color: ${player.color_name || '#FFFFFF'}">${playerName}</div>
    </div>
  `;
  if (typeof applyRankOverlay === 'function') {
    const rankValue = compareCustomizationState.selectedRank || player?.rank || 0;
    applyRankOverlay(container.querySelector('.squad-custom-mini-card'), rankValue, {
      scope: 'compare',
      modifierClass: 'rank-overlay--compare'
    });
  }
}

function updateCompareCustomizationMiniCard() {
  const container = document.getElementById('squad-custom-player-card');
  if (!container) return;

  const ovrEl = container.querySelector('.squad-custom-card-ovr');
  const positionEl = container.querySelector('.squad-custom-card-position');
  const nameEl = container.querySelector('.squad-custom-card-name');

  if (!ovrEl || !positionEl || !nameEl) return;

  const baseOvr = compareCustomizationState.baseOvr ?? 0;
  const basePosition = compareCustomizationState.basePosition || 'N/A';
  const baseName = compareCustomizationState.baseName || 'Unknown Player';
  const colors = compareCustomizationState.baseColors || {};

  const rankBonus = typeof getSquadRankOvrBonus === 'function'
    ? getSquadRankOvrBonus(compareCustomizationState.selectedRank)
    : compareCustomizationState.selectedRank;
  const updatedOvr = baseOvr > 0 ? baseOvr + rankBonus : baseOvr;
  compareLog('Customization OVR recalculated', { baseOvr, rankBonus, updatedOvr });

  ovrEl.textContent = updatedOvr > 0 ? updatedOvr : 'N/A';
  positionEl.textContent = basePosition;
  nameEl.textContent = baseName;

  if (colors.color_rating) ovrEl.style.color = colors.color_rating;
  if (colors.color_position) positionEl.style.color = colors.color_position;
  if (colors.color_name) nameEl.style.color = colors.color_name;
  if (typeof applyRankOverlay === 'function') {
    applyRankOverlay(container.querySelector('.squad-custom-mini-card'), compareCustomizationState.selectedRank || 0, {
      scope: 'compare',
      modifierClass: 'rank-overlay--compare'
    });
  }
}

async function renderComparePlayerSkills() {
  const container = document.getElementById('squad-custom-skills');
  if (!container) return;

  const playerId = compareCustomizationState.playerId;
  const rank = compareCustomizationState.selectedRank || 0;

  if (!playerId || !rank) {
    renderCompareSkillsMessage('Select a rank to view skills');
    return;
  }

  if (!window.apiClient || typeof window.apiClient.getPlayerDetails !== 'function') {
    renderCompareSkillsMessage('Skills unavailable');
    return;
  }

  let detailsResponse;
  try {
    detailsResponse = await window.apiClient.getPlayerDetails(playerId, rank, { cache: false });
  } catch (error) {
    console.error('[COMPARE SKILLS] Error loading skills:', error);
    renderCompareSkillsMessage('Failed to load skills');
    return;
  }

  const basePlayer = compareCustomizationState.player ||
    compareState.selectedPlayers.find(p => resolveComparePlayerId(p) === resolveComparePlayerId(playerId)) || {};
  const mergedPlayer = {
    ...basePlayer,
    ...(detailsResponse.player || {}),
    player_id: basePlayer.player_id || basePlayer.id || detailsResponse.player?.player_id || playerId,
    rank: rank,
    skills: detailsResponse.skills || [],
    available_skill_points: detailsResponse.available_skill_points
  };

  compareCustomizationState.player = mergedPlayer;

  const availableSkills = mergedPlayer.skills || [];
  compareCustomizationState.selectedSkills = [];

  const availablePoints = mergedPlayer.available_skill_points || rank || 0;
  const pointsDisplay = document.getElementById('squad-skill-points-display');
  if (pointsDisplay) {
    pointsDisplay.textContent = `${availablePoints} Point${availablePoints !== 1 ? 's' : ''}`;
  }

  if (availableSkills.length === 0) {
    renderCompareSkillsMessage('No skills available');
    return;
  }

  let userAllocations = [];
  const userId = typeof CURRENT_USER_ID !== 'undefined' ? CURRENT_USER_ID : null;
  if (userId && typeof window.apiClient.getUserSkillAllocations === 'function') {
    try {
      const response = await window.apiClient.getUserSkillAllocations(
        userId,
        mergedPlayer.player_id,
        rank
      );
      userAllocations = response.allocations || [];
    } catch (error) {
      console.error('[COMPARE SKILLS] Error fetching allocations:', error);
    }
  }

  const allocationMap = {};
  userAllocations.forEach(a => {
    allocationMap[a.skill_id] = a.skill_level;
  });

  compareCustomizationState.selectedSkills = userAllocations.map(a => ({
    skill_id: a.skill_id,
    skill_level: a.skill_level
  }));

  const pointsSpent = userAllocations.reduce((sum, a) => sum + a.skill_level, 0);
  const pointsRemaining = availablePoints - pointsSpent;

  const maxLevels = typeof calculateMaxLevels === 'function'
    ? calculateMaxLevels(availableSkills)
    : {};

  container.style.display = 'grid';
  container.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';
  container.style.gap = '12px';
  container.innerHTML = '';
  availableSkills.forEach(skill => {
    const currentLevel = allocationMap[skill.skill_id] || 0;
    const isUnlocked = typeof checkIfSkillUnlocked === 'function'
      ? checkIfSkillUnlocked(skill, allocationMap, availableSkills)
      : true;
    if (typeof createSkillCard === 'function') {
      const card = createSkillCard(skill, currentLevel, isUnlocked, pointsRemaining, mergedPlayer, maxLevels);
      card.style.minHeight = '120px';
      card.style.pointerEvents = isUnlocked ? 'auto' : 'none';
      container.appendChild(card);
    } else {
      const fallbackCard = document.createElement('div');
      fallbackCard.className = `skill-card ${!isUnlocked ? 'locked' : ''}`;
      fallbackCard.textContent = skill.skill_name || 'Skill';
      container.appendChild(fallbackCard);
    }
  });
}

async function compareSelectRank(rankNumber, options = {}) {
  const normalizedRank = typeof getSquadRankOvrBonus === 'function'
    ? getSquadRankOvrBonus(rankNumber)
    : Math.min(Math.max(parseInt(rankNumber || 0, 10), 0), 5);
  compareCustomizationState.selectedRank = normalizedRank;
  compareSelectedRank = normalizedRank;
  console.log('[RankOverlay] ComparePlayers:', compareCustomizationState.playerId, normalizedRank);
  compareLog('Rank selected', {
    playerId: compareCustomizationState.playerId,
    rank: normalizedRank
  });
  if (!options.preserveSkills) {
    compareCustomizationState.selectedSkills = [];
  }

  updateCompareCustomizationMiniCard();
  updateCompareRankBoxes(normalizedRank);
  updateCompareCardRankOverlay(compareCustomizationState.playerId, normalizedRank);

  const skillPoints = normalizedRank;
  const pointsDisplay = document.getElementById('squad-skill-points-display');
  if (pointsDisplay) {
    pointsDisplay.textContent = `${skillPoints} Point${skillPoints !== 1 ? 's' : ''}`;
  }

  if (!options.skipSkillRender) {
    renderCompareSkillsMessage('Loading skills...');
    await renderComparePlayerSkills();
  } else if (!normalizedRank) {
    renderCompareSkillsMessage('Select a rank to view skills');
  }

  if (!options.skipPersist) {
    persistCompareCustomizationState('rank-change');
  }

  if (!options.skipRecalc) {
    handleCompareCustomizationChange('rank-change');
  }
}

function compareUpdateTraining(level) {
  const parsedLevel = parseInt(level, 10);
  compareCustomizationState.trainingLevel = Number.isFinite(parsedLevel) ? parsedLevel : 0;
  compareTrainingLevel = compareCustomizationState.trainingLevel;
  compareLog('Training updated', {
    playerId: compareCustomizationState.playerId,
    trainingLevel: compareCustomizationState.trainingLevel
  });
  persistCompareCustomizationState('training-change');
  handleCompareCustomizationChange('training-change');
}

function compareResetRank() {
  compareCustomizationState.selectedRank = 0;
  compareCustomizationState.selectedSkills = [];
  compareCustomizationState.trainingLevel = 0;
  compareSelectedRank = 0;
  compareTrainingLevel = 0;
  compareSkillBoost = {};
  console.log('[RankOverlay] ComparePlayers:', compareCustomizationState.playerId, 0);
  compareLog('Rank reset', { playerId: compareCustomizationState.playerId });

  updateCompareRankBoxes(0);

  const trainingSelect = document.getElementById('squad-training-level');
  if (trainingSelect) {
    trainingSelect.value = '0';
  }

  const pointsDisplay = document.getElementById('squad-skill-points-display');
  if (pointsDisplay) {
    pointsDisplay.textContent = '0 Points';
  }

  updateCompareCustomizationMiniCard();
  updateCompareCardRankOverlay(compareCustomizationState.playerId, 0);
  renderCompareSkillsMessage('Select a rank to view skills');

  persistCompareCustomizationState('rank-reset');
  handleCompareCustomizationChange('rank-reset');
}

async function openComparePlayerStatsView() {
  const modal = document.getElementById('squad-player-customization-modal');
  const statsView = document.getElementById('squad-stats-view');
  const statsContent = document.getElementById('squad-stats-content');
  if (!modal || !statsView || !statsContent) return;

  modal.classList.add('stats-mode');
  statsView.style.display = 'block';
  statsContent.innerHTML = '<div style="color: #98A0A6; text-align: center; padding: 20px;">Loading stats...</div>';

  const playerId = compareCustomizationState.playerId;
  const rank = compareCustomizationState.selectedRank || 0;
  const trainingLevel = compareCustomizationState.trainingLevel || 0;

  if (!playerId || !rank || !window.apiClient) {
    statsContent.innerHTML = '<div style="color: #FF6B6B; text-align: center;">Stats unavailable</div>';
    return;
  }

  try {
    const detailsResponse = await window.apiClient.getPlayerDetails(playerId, rank, { cache: false });
    const basePlayer = compareCustomizationState.player ||
      compareState.selectedPlayers.find(p => resolveComparePlayerId(p) === resolveComparePlayerId(playerId)) || {};
    const mergedPlayer = {
      ...basePlayer,
      ...(detailsResponse.player || {}),
      player_id: basePlayer.player_id || basePlayer.id || detailsResponse.player?.player_id || playerId,
      rank: rank,
      skills: detailsResponse.skills || [],
      available_skill_points: detailsResponse.available_skill_points
    };

    let userAllocations = [];
    const userId = typeof CURRENT_USER_ID !== 'undefined' ? CURRENT_USER_ID : null;
    if (userId && typeof window.apiClient.getUserSkillAllocations === 'function') {
      const response = await window.apiClient.getUserSkillAllocations(userId, mergedPlayer.player_id, rank);
      userAllocations = response.allocations || [];
    }

    const skillBoosts = typeof calculateSkillBoosts === 'function'
      ? await calculateSkillBoosts(userAllocations)
      : {};

    const trainingBoosts = typeof getTrainingBoosts === 'function'
      ? await getTrainingBoosts(mergedPlayer.position, trainingLevel)
      : null;

    mergedPlayer.training_level = trainingLevel;
    mergedPlayer.training_boosts = typeof mergeBoosts === 'function'
      ? mergeBoosts(trainingBoosts, skillBoosts)
      : (trainingBoosts || {});

    compareCustomizationState.player = mergedPlayer;

    if (typeof window.renderPlayerStatsSection === 'function') {
      statsContent.innerHTML = window.renderPlayerStatsSection(mergedPlayer);
    } else {
      statsContent.innerHTML = '<div style="color: #FF6B6B; text-align: center;">Stats renderer unavailable</div>';
    }
  } catch (error) {
    console.error('[COMPARE STATS] Error loading stats:', error);
    statsContent.innerHTML = '<div style="color: #FF6B6B; text-align: center;">Failed to load stats</div>';
  }
}

function closeComparePlayerStatsView() {
  const modal = document.getElementById('squad-player-customization-modal');
  const statsView = document.getElementById('squad-stats-view');
  if (statsView) statsView.style.display = 'none';
  if (modal) modal.classList.remove('stats-mode');
}

async function openCompareCustomization(player, index) {
  const playerId = resolveComparePlayerId(player);
  if (!playerId) {
    return;
  }

  const modal = document.getElementById('squad-player-customization-modal');
  if (!modal) {
    return;
  }

  ensureCompareCustomizationModalRoot();

  if (compareCustomizationContext.active) {
    finalizeCompareCustomization();
  }

  if (typeof addPlayerToCache === 'function') {
    addPlayerToCache(player);
  }

  const storedCustomization = getCompareCustomization(playerId);
  const fallbackRank = typeof getSquadRankOvrBonus === 'function'
    ? getSquadRankOvrBonus(player?.rank)
    : Math.min(Math.max(parseInt(player?.rank || 0, 10), 0), 5);
  const restoredRank = storedCustomization
    ? (typeof getSquadRankOvrBonus === 'function'
      ? getSquadRankOvrBonus(storedCustomization.selectedRank)
      : Math.min(Math.max(parseInt(storedCustomization.selectedRank || 0, 10), 0), 5))
    : fallbackRank;
  const restoredTraining = storedCustomization
    ? parseInt(storedCustomization.trainingLevel || 0, 10)
    : parseInt(player?.training_level || 0, 10);
  const restoredSkills = storedCustomization && Array.isArray(storedCustomization.selectedSkills)
    ? [...storedCustomization.selectedSkills]
    : [];

  compareCustomizationState.playerId = playerId;
  compareCustomizationState.selectedRank = Number.isFinite(restoredRank) ? restoredRank : 0;
  compareCustomizationState.trainingLevel = Number.isFinite(restoredTraining) ? restoredTraining : 0;
  compareCustomizationState.selectedSkills = restoredSkills;
  compareCustomizationState.player = player || null;

  const storedBaseOvr = Number.isFinite(parseInt(storedCustomization?.baseOvr, 10))
    ? parseInt(storedCustomization.baseOvr, 10)
    : null;
  const baseRankBonus = typeof getSquadRankOvrBonus === 'function'
    ? getSquadRankOvrBonus(compareCustomizationState.selectedRank)
    : compareCustomizationState.selectedRank;
  const rawBaseOvr = Number.isFinite(parseInt(player?.base_ovr, 10))
    ? parseInt(player.base_ovr, 10)
    : (Number.isFinite(storedBaseOvr)
      ? storedBaseOvr
      : parseInt(player?.ovr || player?.overall || 0, 10) - baseRankBonus);
  const normalizedBaseOvr = Number.isFinite(rawBaseOvr) ? Math.max(rawBaseOvr, 0) : 0;
  compareCustomizationState.baseOvr = normalizedBaseOvr;
  compareCustomizationState.basePosition = player?.position || 'N/A';
  compareCustomizationState.baseName = player?.name || 'Unknown Player';
  compareCustomizationState.baseColors = storedCustomization?.baseColors
    ? { ...storedCustomization.baseColors }
    : {
        color_rating: player?.color_rating || '#FFFFFF',
        color_position: player?.color_position || '#FFFFFF',
        color_name: player?.color_name || '#FFFFFF'
      };

  compareSelectedRank = compareCustomizationState.selectedRank;
  compareTrainingLevel = compareCustomizationState.trainingLevel;

  compareCustomizationContext.active = true;
  compareCustomizationContext.playerId = playerId;
  compareCustomizationContext.index = index;
  compareCustomizationContext.applied = false;
  compareCustomizationContext.hasPreview = false;
  compareCustomizationContext.skipRestore = false;
  compareCustomizationContext.initialPlayer = compareState.selectedPlayers[index] || null;
  compareCustomizationContext.lastSnapshot = null;
  compareCustomizationContext.backup = null;
  updateCompareCustomizationModalLabels(true);
  compareLog('Customization modal opened', {
    playerId,
    index,
    snapshot: storedCustomization
  });

  renderCompareCustomizationMiniCard(player);
  updateCompareCustomizationMiniCard();

  const trainingSelect = document.getElementById('squad-training-level');
  if (trainingSelect) {
    trainingSelect.value = `${compareCustomizationState.trainingLevel || 0}`;
  }

  closeComparePlayerStatsView();

  modal.classList.remove('is-visible');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => {
    modal.classList.add('is-visible');
  });

  updateCompareRankBoxes(compareCustomizationState.selectedRank);
  if (compareCustomizationState.selectedRank > 0) {
    renderCompareSkillsMessage('Loading skills...');
    renderComparePlayerSkills();
  } else {
    const pointsDisplay = document.getElementById('squad-skill-points-display');
    if (pointsDisplay) {
      pointsDisplay.textContent = '0 Points';
    }
    renderCompareSkillsMessage('Select a rank to view skills');
  }

  persistCompareCustomizationState('open');
}

function getCompareCustomizationSnapshot() {
  const rawRank = compareCustomizationState.selectedRank || 0;
  const normalizedRank = typeof getSquadRankOvrBonus === 'function'
    ? getSquadRankOvrBonus(rawRank)
    : Math.min(Math.max(parseInt(rawRank || 0, 10), 0), 5);
  return {
    selectedRank: normalizedRank,
    trainingLevel: parseInt(compareCustomizationState.trainingLevel || 0, 10),
    selectedSkills: Array.isArray(compareCustomizationState.selectedSkills)
      ? [...compareCustomizationState.selectedSkills]
      : [],
    baseOvr: Number.isFinite(compareCustomizationState.baseOvr)
      ? compareCustomizationState.baseOvr
      : 0,
    baseColors: compareCustomizationState.baseColors
      ? { ...compareCustomizationState.baseColors }
      : null
  };
}

function handleCompareCustomizationChange(reason = 'change') {
  if (!compareCustomizationContext.active) return;
  const playerId = compareCustomizationContext.playerId;
  if (!playerId) return;
  if (!compareCustomizationContext.initialPlayer && compareCustomizationContext.index !== null) {
    compareCustomizationContext.initialPlayer = compareState.selectedPlayers[compareCustomizationContext.index] || null;
  }
  const snapshot = persistCompareCustomizationState(reason) || getCompareCustomizationSnapshot();
  compareCustomizationContext.hasPreview = true;
  compareCustomizationContext.lastSnapshot = snapshot;
  compareLog('Customization change detected', { playerId, reason, snapshot });
  recalculateComparePlayerStats(playerId, snapshot, { reason, preview: false });
}

function removeComparePlayerById(playerId) {
  const resolvedId = resolveComparePlayerId(playerId);
  if (!resolvedId) return;
  const index = compareState.selectedPlayers.findIndex(
    player => resolveComparePlayerId(player) === resolvedId
  );
  if (index >= 0) {
    removeComparePlayer(index);
  }
}

async function recalculateComparePlayerStats(playerId, customization, options = {}) {
  const resolvedId = resolveComparePlayerId(playerId);
  if (!resolvedId) return;
  const { reason = 'update', preview = false } = options;
  const token = `${Date.now()}-${Math.random()}`;
  compareState.recalcTokens[resolvedId] = token;

  const index = compareState.selectedPlayers.findIndex(
    player => resolveComparePlayerId(player) === resolvedId
  );
  if (index < 0) return;

  const currentPlayer = compareState.selectedPlayers[index];
  const previousOvr = Number(currentPlayer?.ovr || currentPlayer?.overall || 0);
  const rank = Number(customization?.selectedRank || 0);
  const trainingLevel = Number(customization?.trainingLevel || 0);

  compareLog('Stat recalculation triggered', {
    playerId: resolvedId,
    rank,
    trainingLevel,
    reason,
    preview
  });

  let detailsPlayer = {};
  let skills = [];
  let availableSkillPoints = null;
  if (window.apiClient && typeof window.apiClient.getPlayerDetails === 'function') {
    try {
      const resp = await window.apiClient.getPlayerDetails(resolvedId, rank, { cache: false });
      detailsPlayer = resp.player || {};
      skills = resp.skills || [];
      availableSkillPoints = resp.available_skill_points ?? null;
    } catch (error) {
      compareLog('Player details refresh failed', error);
    }
  }

  if (compareState.recalcTokens[resolvedId] !== token) return;

  const mergedPlayer = {
    ...currentPlayer,
    ...detailsPlayer,
    player_id: resolvedId,
    rank,
    skills: skills.length ? skills : currentPlayer.skills || [],
    available_skill_points: availableSkillPoints ?? currentPlayer.available_skill_points
  };
  mergedPlayer.training_level = trainingLevel;

  let skillBoosts = {};
  const userId = typeof CURRENT_USER_ID !== 'undefined' ? CURRENT_USER_ID : null;
  if (userId && window.apiClient?.getUserSkillAllocations && typeof calculateSkillBoosts === 'function') {
    try {
      const allocationsResp = await window.apiClient.getUserSkillAllocations(userId, resolvedId, rank);
      skillBoosts = await calculateSkillBoosts(allocationsResp.allocations || []);
    } catch (error) {
      compareLog('Skill boosts refresh failed', error);
    }
  }

  if (compareState.recalcTokens[resolvedId] !== token) return;

  let trainingBoosts = null;
  if (typeof getTrainingBoosts === 'function') {
    try {
      trainingBoosts = await getTrainingBoosts(mergedPlayer.position, trainingLevel);
    } catch (error) {
      compareLog('Training boosts refresh failed', error);
    }
  }

  if (compareState.recalcTokens[resolvedId] !== token) return;

  const combinedBoosts = typeof mergeBoosts === 'function'
    ? mergeBoosts(trainingBoosts, skillBoosts)
    : { ...(trainingBoosts || {}), ...(skillBoosts || {}) };

  mergedPlayer.compare_boosts = combinedBoosts;
  mergedPlayer.training_boosts = combinedBoosts;
  mergedPlayer.skill_boosts = skillBoosts;

  const customizationBaseOvr = Number.parseInt(customization?.baseOvr, 10);
  const playerBaseOvr = Number.parseInt(mergedPlayer.base_ovr || currentPlayer.base_ovr, 10);
  const fallbackOvr = Number.parseInt(
    mergedPlayer.ovr ||
    mergedPlayer.overall ||
    currentPlayer.ovr ||
    currentPlayer.overall ||
    0,
    10
  );
  const baseOvr = Number.isFinite(customizationBaseOvr)
    ? customizationBaseOvr
    : (Number.isFinite(playerBaseOvr) ? playerBaseOvr : (Number.isFinite(fallbackOvr) ? fallbackOvr : 0));
  const rankBonus = typeof getSquadRankOvrBonus === 'function' ? getSquadRankOvrBonus(rank) : rank;
  const boostedOvr = baseOvr > 0 ? baseOvr + rankBonus : baseOvr;
  if (Number.isFinite(baseOvr)) {
    mergedPlayer.base_ovr = baseOvr;
  }
  mergedPlayer.ovr = boostedOvr;
  mergedPlayer.overall = boostedOvr;

  if (compareDebugEnabled) {
    const ovrDelta = boostedOvr - previousOvr;
    compareLog('OVR delta check', {
      playerId: resolvedId,
      previousOvr,
      boostedOvr,
      delta: ovrDelta
    });
    if (rank === 0 && trainingLevel === 0 && (!skillBoosts || !Object.keys(skillBoosts).length) && baseOvr > 0 && boostedOvr !== baseOvr) {
      compareLog('Reset check failed', { playerId: resolvedId, expected: baseOvr, actual: boostedOvr });
    }
  }

  if (compareState.recalcTokens[resolvedId] !== token) return;

  compareSkillBoost = skillBoosts || {};
  if (compareCustomizationContext.active && String(compareCustomizationContext.playerId) === String(resolvedId)) {
    compareCustomizationState.player = mergedPlayer;
  }

  compareState.selectedPlayers[index] = mergedPlayer;
  compareLog('Stat recalculation complete', {
    playerId: resolvedId,
    rank,
    trainingLevel,
    ovr: boostedOvr,
    boosts: combinedBoosts
  });
  updateCompareCardForPlayer(resolvedId);
  updateCompareStatsGridForPlayer(resolvedId);
}

async function applyCompareCustomization() {
  const playerId = compareCustomizationContext.playerId;
  if (!playerId) {
    window.closePlayerCustomizationModal?.();
    return;
  }
  const snapshot = persistCompareCustomizationState('apply') || getCompareCustomizationSnapshot();
  compareCustomizationContext.applied = true;
  compareCustomizationContext.lastSnapshot = snapshot;
  compareLog('Customization applied', { playerId, snapshot });

  window.closePlayerCustomizationModal?.();
  await recalculateComparePlayerStats(playerId, snapshot, { reason: 'apply' });
}

function closeCompareCustomizationModal() {
  const modal = document.getElementById('squad-player-customization-modal');
  if (modal) {
    modal.classList.remove('is-visible');
    modal.style.display = 'none';
  }
  if (typeof closeSkillDetailModal === 'function') {
    closeSkillDetailModal();
  }
  closeComparePlayerStatsView();
  finalizeCompareCustomization();
  const compareModal = document.getElementById('compare-players-modal');
  document.body.style.overflow = compareModal && compareModal.style.display !== 'none' ? 'hidden' : 'auto';
}

function finalizeCompareCustomization() {
  updateCompareCustomizationModalLabels(false);
  const resolvedId = resolveComparePlayerId(compareCustomizationContext.playerId);
  if (resolvedId) {
    delete compareState.recalcTokens[resolvedId];
  }
  if (compareCustomizationContext.active) {
    persistCompareCustomizationState('finalize');
  }
  compareCustomizationContext.active = false;
  compareCustomizationContext.playerId = null;
  compareCustomizationContext.index = null;
  compareCustomizationContext.backup = null;
  compareCustomizationContext.applied = false;
  compareCustomizationContext.hasPreview = false;
  compareCustomizationContext.skipRestore = false;
  compareCustomizationContext.initialPlayer = null;
  compareCustomizationContext.lastSnapshot = null;
  compareCustomizationState.playerId = null;
  compareCustomizationState.selectedRank = 0;
  compareCustomizationState.trainingLevel = 0;
  compareCustomizationState.selectedSkills = [];
  compareCustomizationState.baseOvr = null;
  compareCustomizationState.basePosition = null;
  compareCustomizationState.baseName = null;
  compareCustomizationState.baseColors = null;
  compareCustomizationState.player = null;
  compareSelectedRank = 0;
  compareTrainingLevel = 0;
  compareSkillBoost = {};
  const compareModal = document.getElementById('compare-players-modal');
  if (compareModal && compareModal.style.display !== 'none') {
    document.body.style.overflow = 'hidden';
  }
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
    results.innerHTML = `<p style="color:var(--color-text-secondary);text-align:center;padding:20px;">Start typing to search players...</p>`;
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
        resultsDiv.innerHTML = '<p style="color:var(--color-text-secondary);text-align:center;padding:20px;">Type at least 2 characters...</p>';
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
  resultsDiv.innerHTML = '<p style="color:var(--color-teal-500);text-align:center;padding:20px;">Searching...</p>';

  try {
    if (!window.apiClient) {
      resultsDiv.innerHTML = '<p style="color:var(--color-text-secondary);text-align:center;padding:20px;">Search unavailable.</p>';
      return;
    }
    const resp = await window.apiClient.searchPlayers({ q: query, limit: 50, rank: 0 });
    const players = resp.results || resp.players || [];
    if (!players.length) {
      resultsDiv.innerHTML = `<p style="color:var(--color-text-secondary);text-align:center;padding:20px;">No players found for "${query}"</p>`;
      return;
    }
    resultsDiv.innerHTML = '';
    players.forEach(p => resultsDiv.appendChild(createCompareSearchResultItem(p)));
  } catch (err) {
    compareLog('Search error', err);
    resultsDiv.innerHTML = '<p style="color:var(--color-status-error);text-align:center;padding:20px;">Search error. Please try again.</p>';
  }
}

function createCompareSearchResultItem(player) {
  const item = document.createElement('div');
  item.className = 'compare-search-result-item';
  item.onclick = () => selectPlayerForComparison(player);
  const cardBackground = player.card_background || player.cardBackground || player.cardbackground || 'https://via.placeholder.com/120x160';
  const playerImage = player.player_image || player.playerImage || player.playerimage || player.playerimg || '';
  const playerName = player.name || 'Unknown Player';
  const playerOvr = player.ovr && player.ovr > 0 ? player.ovr : 'NA';
  const playerPosition = player.position || 'NA';
  const nationFlag = player.nation_flag || player.nationflag || player.nationFlag || '';
  const clubFlag = player.club_flag || player.clubflag || player.clubFlag || '';
  item.innerHTML = `
    <div class="compare-search-result-image">
      <div class="picker-card-mini">
        <img src="${cardBackground}" alt="Card Background" class="picker-card-bg" onerror="this.src='https://via.placeholder.com/120x160'">
        ${playerImage ? `
          <img src="${playerImage}" alt="${playerName}" class="picker-card-player-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
          <span class="player-initials" style="display: none;">${getInitials(playerName)}</span>
        ` : `
          <span class="player-initials">${getInitials(playerName)}</span>
        `}
        <div class="picker-card-ovr" style="color: ${player.color_rating || '#FFB86B'}">${playerOvr}</div>
        <div class="picker-card-position" style="color: ${player.color_position || '#FFFFFF'}">${playerPosition}</div>
        <div class="picker-card-name" style="color: ${player.color_name || '#FFFFFF'}">${playerName}</div>
        ${nationFlag ? `<img src="${nationFlag}" alt="Nation" class="picker-card-flag-nation" onerror="this.style.display='none'">` : ''}
        ${clubFlag ? `<img src="${clubFlag}" alt="Club" class="picker-card-flag-club" onerror="this.style.display='none'">` : ''}
      </div>
    </div>
    <div class="compare-search-result-info">
      <h4>${playerName}</h4>
      <p>${playerPosition} • ${player.team || 'N/A'}</p>
    </div>
    <div class="compare-search-result-ovr">${playerOvr}</div>
  `;
  return item;
}

function selectPlayerForComparison(player) {
  const playerId = resolveComparePlayerId(player);
  if (!playerId) {
    return;
  }
  if (compareState.selectedPlayers.some(p => resolveComparePlayerId(p) === playerId)) {
    return;
  }
  const isGK = player.position === 'GK';
  if (compareState.positionMode === null) {
    compareState.positionMode = isGK ? 'gk' : 'outfield';
  } else {
    if (compareState.positionMode === 'gk' && !isGK) {
      return;
    }
    if (compareState.positionMode === 'outfield' && isGK) {
      return;
    }
  }
  compareState.selectedPlayers.push({ ...player, player_id: playerId });
  closeCompareSearch();
  appendComparePlayerCard(player);
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
  row.dataset.statField = stat.apiField;

  const nameCell = document.createElement('div');
  nameCell.className = 'stat-name-cell';
  nameCell.textContent = isSub ? `↳ ${stat.name}` : stat.name;
  row.appendChild(nameCell);

  const values = compareState.selectedPlayers.map(player => getCompareStatValue(player, stat));
  const colors = assignStatColors(values);

  compareState.selectedPlayers.forEach((player, i) => {
    const cell = document.createElement('div');
    cell.className = 'stat-value-cell';
    cell.dataset.playerLabel = resolveComparePlayerLabel(player, i);
    cell.dataset.playerId = resolveComparePlayerId(player) || '';
    const span = document.createElement('span');
    span.className = `stat-value ${colors[i]}`;
    const value = Number.isFinite(values[i]) ? values[i] : 0;
    span.textContent = value;
    cell.appendChild(span);
    row.appendChild(cell);
  });

  return row;
}

function createTotalStatsRow() {
  const row = document.createElement('div');
  row.className = 'stat-row total-row';
  row.dataset.totalRow = 'true';

  const nameCell = document.createElement('div');
  nameCell.className = 'stat-name-cell';
  nameCell.textContent = '🏆 TOTAL STATS';
  row.appendChild(nameCell);

  const totals = compareState.selectedPlayers.map(player => {
    const mode = compareState.positionMode || 'outfield';
    const config = STATS_CONFIG[mode];
    const stats = compareState.isBasicView ? config.basic : getAllStats(config);
    return stats.reduce((sum, s) => sum + getCompareStatValue(player, s), 0);
  });

  const colors = assignStatColors(totals);
  totals.forEach((total, i) => {
    const cell = document.createElement('div');
    cell.className = 'stat-value-cell total-cell';
    cell.dataset.playerLabel = resolveComparePlayerLabel(compareState.selectedPlayers[i], i);
    cell.dataset.playerId = resolveComparePlayerId(compareState.selectedPlayers[i]) || '';
    const span = document.createElement('span');
    span.className = `total-stats-value ${colors[i]}`;
    span.textContent = Number.isFinite(total) ? total : 0;
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

function updateCompareStatsGridForPlayer(playerId) {
  const grid = document.getElementById('compare-stats-grid');
  if (!grid) return;
  const resolvedId = resolveComparePlayerId(playerId);
  if (!resolvedId) return;
  const index = compareState.selectedPlayers.findIndex(
    player => resolveComparePlayerId(player) === resolvedId
  );
  if (index < 0) return;

  const rows = grid.querySelectorAll('.stat-row');
  if (!rows.length) {
    generateCompareStatsGrid();
    return;
  }

  const expectedCells = compareState.selectedPlayers.length;
  const needsRebuild = Array.from(rows).some(
    row => row.querySelectorAll('.stat-value-cell').length !== expectedCells
  );
  if (needsRebuild) {
    generateCompareStatsGrid();
    return;
  }

  const mode = compareState.positionMode || 'outfield';
  const config = STATS_CONFIG[mode];
  const totalStats = compareState.isBasicView ? config.basic : getAllStats(config);
  const colorClasses = ['green', 'red', 'yellow', 'neutral'];

  rows.forEach(row => {
    let values = [];
    if (row.dataset.totalRow === 'true') {
      values = compareState.selectedPlayers.map(player => {
        return totalStats.reduce((sum, stat) => sum + getCompareStatValue(player, stat), 0);
      });
    } else {
      const statField = row.dataset.statField;
      if (!statField) return;
      values = compareState.selectedPlayers.map(player =>
        getCompareStatValue(player, { apiField: statField })
      );
    }
    const colors = assignStatColors(values);
    const cells = row.querySelectorAll('.stat-value-cell');
    cells.forEach((cell, i) => {
      const span = cell.querySelector('span');
      if (!span) return;
      const value = Number.isFinite(values[i]) ? values[i] : 0;
      if (i === index) {
        span.textContent = value;
      }
      colorClasses.forEach(cls => span.classList.remove(cls));
      span.classList.add(colors[i] || 'neutral');
    });
  });

  compareLog('Stats grid updated', { playerId: resolvedId, index });
}

function restoreComparePreviewState() {
  const playerId = compareCustomizationContext.playerId;
  const initialPlayer = compareCustomizationContext.initialPlayer;
  if (!playerId || !initialPlayer) return;
  const resolvedId = resolveComparePlayerId(playerId);
  const index = compareState.selectedPlayers.findIndex(
    player => resolveComparePlayerId(player) === resolvedId
  );
  if (index < 0) return;
  compareState.selectedPlayers[index] = initialPlayer;
  compareLog('Customization preview reverted', { playerId: resolvedId });
  updateCompareCardForPlayer(resolvedId);
  updateCompareStatsGridForPlayer(resolvedId);
}

let compareCustomizationHooksInitialized = false;

function initializeCompareCustomizationHooks() {
  if (compareCustomizationHooksInitialized) return;
  compareCustomizationHooksInitialized = true;

  const originalGetSquadPlayerCustomization = window.getSquadPlayerCustomization;
  if (typeof originalGetSquadPlayerCustomization === 'function') {
    window.getSquadPlayerCustomization = function(playerId) {
      if (compareCustomizationContext.active) {
        return getCompareCustomization(playerId) || {};
      }
      return originalGetSquadPlayerCustomization(playerId);
    };
  }

  const originalSetSquadPlayerCustomization = window.setSquadPlayerCustomization;
  if (typeof originalSetSquadPlayerCustomization === 'function') {
    window.setSquadPlayerCustomization = function(playerId, updates = {}, reason = 'update') {
      if (compareCustomizationContext.active) {
        return;
      }
      return originalSetSquadPlayerCustomization(playerId, updates, reason);
    };
  }

  const originalApplySquadPlayerCustomization = window.applySquadPlayerCustomization;
  if (typeof originalApplySquadPlayerCustomization === 'function') {
    window.applySquadPlayerCustomization = function() {
      if (compareCustomizationContext.active) {
        applyCompareCustomization();
        return;
      }
      return originalApplySquadPlayerCustomization();
    };
  }

  const originalOpenSquadPlayerStatsView = window.openSquadPlayerStatsView;
  if (typeof originalOpenSquadPlayerStatsView === 'function') {
    window.openSquadPlayerStatsView = function() {
      if (compareCustomizationContext.active) {
        openComparePlayerStatsView();
        return;
      }
      return originalOpenSquadPlayerStatsView();
    };
  }

  const originalCloseSquadPlayerStatsView = window.closeSquadPlayerStatsView;
  if (typeof originalCloseSquadPlayerStatsView === 'function') {
    window.closeSquadPlayerStatsView = function() {
      if (compareCustomizationContext.active) {
        closeComparePlayerStatsView();
        return;
      }
      return originalCloseSquadPlayerStatsView();
    };
  }

  const originalRemoveSquadPlayer = window.removeSquadPlayer;
  if (typeof originalRemoveSquadPlayer === 'function') {
    window.removeSquadPlayer = function() {
      if (compareCustomizationContext.active) {
        removeComparePlayerById(compareCustomizationContext.playerId);
        if (compareCustomizationContext.active) {
          window.closePlayerCustomizationModal?.();
        }
        return;
      }
      return originalRemoveSquadPlayer();
    };
  }

  const originalClosePlayerCustomizationModal = window.closePlayerCustomizationModal;
  if (typeof originalClosePlayerCustomizationModal === 'function') {
    window.closePlayerCustomizationModal = function() {
      if (compareCustomizationContext.active) {
        closeCompareCustomizationModal();
        return;
      }
      return originalClosePlayerCustomizationModal();
    };
  }

  const originalSelectSquadRank = window.selectSquadRank;
  if (typeof originalSelectSquadRank === 'function') {
    window.selectSquadRank = async function(rankNumber, options = {}) {
      if (compareCustomizationContext.active) {
        return compareSelectRank(rankNumber, options);
      }
      return originalSelectSquadRank.call(this, rankNumber, options);
    };
  }

  const originalUpdateSquadTraining = window.updateSquadTraining;
  if (typeof originalUpdateSquadTraining === 'function') {
    window.updateSquadTraining = function(level) {
      if (compareCustomizationContext.active) {
        return compareUpdateTraining(level);
      }
      return originalUpdateSquadTraining.call(this, level);
    };
  }

  const originalResetSquadPlayerRank = window.resetSquadPlayerRank;
  if (typeof originalResetSquadPlayerRank === 'function') {
    window.resetSquadPlayerRank = function() {
      if (compareCustomizationContext.active) {
        return compareResetRank();
      }
      return originalResetSquadPlayerRank.call(this);
    };
  }
}

initializeCompareCustomizationHooks();
compareLog('Player Comparison Tool initialized');



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
      break;
    case 'programs':
      break;
    case 'pricetracker':
      break;
    case 'sync':
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


// Market Under Construction Modal Functions
function openMarketModal() {
    const modal = document.getElementById('market-construction-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeMarketModal() {
    const modal = document.getElementById('market-construction-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    // Redirect to homepage
    switchView('database');
}

// Intercept Market navigation clicks - UPDATED
document.addEventListener('DOMContentLoaded', () => {
    // Desktop Market button
    const desktopMarketBtns = document.querySelectorAll('.nav-link[data-view="market"]');
    desktopMarketBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openMarketModal();
        });
    });
    
    // Mobile Market button
    const mobileMarketBtns = document.querySelectorAll('.mobile-nav-btn[data-view="market"]');
    mobileMarketBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openMarketModal();
        });
    });
});


// ========== DATABASE HORIZONTAL SCROLL SYNC ==========
function initDatabaseScrollSync() {
    const playersGrid = document.getElementById('players-grid');
    if (!playersGrid) return;

    // Check if top scrollbar already exists
    let topScrollbar = document.getElementById('database-top-scrollbar');
    
    // Create top scrollbar if it doesn't exist
    if (!topScrollbar) {
        topScrollbar = document.createElement('div');
        topScrollbar.id = 'database-top-scrollbar';
        topScrollbar.className = 'database-top-scrollbar';
        topScrollbar.innerHTML = '<div class="database-scrollbar-content"></div>';
        
        // Insert before players grid
        playersGrid.parentNode.insertBefore(topScrollbar, playersGrid);
    }

    const scrollbarContent = topScrollbar.querySelector('.database-scrollbar-content');
    const statRows = playersGrid.querySelectorAll('.player-card-stats-row');

    if (statRows.length === 0) {
        topScrollbar.style.display = 'none';
        return;
    }

    // Show scrollbar
    topScrollbar.style.display = 'block';

    // Calculate max scroll width from all stat rows
    let maxScrollWidth = 0;
    statRows.forEach(row => {
        if (row.scrollWidth > maxScrollWidth) {
            maxScrollWidth = row.scrollWidth;
        }
    });

    // Set scrollbar content width
    scrollbarContent.style.width = `${maxScrollWidth}px`;

    // Remove old listeners to avoid duplicates
    topScrollbar.replaceWith(topScrollbar.cloneNode(true));
    topScrollbar = document.getElementById('database-top-scrollbar');

    // Top scrollbar controls all rows
    topScrollbar.addEventListener('scroll', () => {
        const scrollLeft = topScrollbar.scrollLeft;
        statRows.forEach(row => {
            row.scrollLeft = scrollLeft;
        });
    });

    // Any row scroll updates top scrollbar
    statRows.forEach(row => {
        row.addEventListener('scroll', () => {
            topScrollbar.scrollLeft = row.scrollLeft;
        });
    });

    console.log('✅ Database scroll sync initialized:', statRows.length, 'rows');
}
