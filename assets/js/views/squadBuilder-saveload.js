// ============================================
// SQUAD SAVE/LOAD SYSTEM
// ============================================
// This file contains save/load functionality for the Squad Builder
// Add this to your squadBuilder.js or include it as a separate script

/**
 * Calculate total squad value
 */
function calculateValue() {
    let total = 0;
    const missing = [];
    const parseOptionalBoolean = (value) => {
        if (value === undefined || value === null || value === '') return null;
        const normalized = String(value).trim().toLowerCase();
        if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
        if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
        return null;
    };
    const shouldIncludePlayerValue = (player) => {
        const untradable = parseOptionalBoolean(player.is_untradable ?? player.isuntradable ?? player.untradable);
        const unauctionable = parseOptionalBoolean(player.is_unauctionable ?? player.unauctionable);
        const tradable = parseOptionalBoolean(player.tradable);
        const auctionable = parseOptionalBoolean(player.auctionable);
        const isTradable = tradable !== null ? tradable : (untradable !== null ? !untradable : true);
        const isAuctionable = auctionable !== null ? auctionable : (unauctionable !== null ? !unauctionable : (untradable !== null ? !untradable : true));
        return isTradable && isAuctionable;
    };
    
    // Sum starter values
    Object.values(squadState.starters).forEach(pid => {
        if (!pid) return;
        const player = getPlayers().find(p => 
            p.id === pid || p.playerid === pid || p.player_id === pid
        );
        if (player && shouldIncludePlayerValue(player)) {
            const price = typeof resolveSquadPlayerPrice === 'function'
                ? resolveSquadPlayerPrice(player)
                : (player.price || 0);
            total += price;
        } else {
            missing.push(pid);
        }
    });
    
    // Sum bench values
    squadState.bench.forEach(pid => {
        if (!pid) return;
        const player = getPlayers().find(p => 
            p.id === pid || p.playerid === pid || p.player_id === pid
        );
        if (player && shouldIncludePlayerValue(player)) {
            const price = typeof resolveSquadPlayerPrice === 'function'
                ? resolveSquadPlayerPrice(player)
                : (player.price || 0);
            total += price;
        } else {
            missing.push(pid);
        }
    });
    
    console.log('[SQUAD VALUE] Total:', total, 'Missing:', missing.length ? missing : 'none');
    return total;
}

/**
 * Format price for display
 */
function formatPrice(price) {
    if (!price || price === 0) return '0';
    
    if (price >= 1000000) {
        return (price / 1000000).toFixed(2) + 'M';
    } else if (price >= 1000) {
        return (price / 1000).toFixed(1) + 'K';
    }
    
    return price.toString();
}

/**
 * Save current squad to localStorage
 */
function saveSquad() {
    try {
        // Prepare squad data object
        const squadData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            name: squadState.name || 'My Squad',
            formationId: squadState.formationId || '4-3-3',
            starters: { ...squadState.starters },
            bench: [...squadState.bench],
            badges: { ...squadState.badges },
            playerCustomizations: { ...(squadState.playerCustomizations || {}) },
            teamOVR: getFinalTeamOVR(),
            teamValue: calculateValue(),
            fieldTheme: localStorage.getItem('selectedFieldTheme') || 'stadium-blue'
        };

        // Save to localStorage
        localStorage.setItem('savedSquad_main', JSON.stringify(squadData));
        
        console.log('✅ Squad saved successfully:', squadData);
        
        return true;
    } catch (error) {
        console.error('❌ Error saving squad:', error);
        return false;
    }
}

/**
 * Load squad from localStorage
 */
function loadSquad() {
    try {
        // Get saved data
        const savedData = localStorage.getItem('savedSquad_main');
        
        if (!savedData) {
            return false;
        }

        // Parse saved data
        const squadData = JSON.parse(savedData);
        
        console.log('📥 Loading squad:', squadData);

        // Restore squad state
        squadState.name = squadData.name || 'My Squad';
        squadState.formationId = squadData.formationId || '4-3-3';
        squadState.starters = squadData.starters || {};
        squadState.bench = squadData.bench || [];
        squadState.badges = squadData.badges || { badge1: false, badge2: false, badge3: false };
        squadState.playerCustomizations = squadData.playerCustomizations || {};

        if (window.squadCustomizationState) {
            window.squadCustomizationState.savedByPlayer = { ...squadState.playerCustomizations };
        }

        // Restore field theme if saved
        if (squadData.fieldTheme) {
            localStorage.setItem('selectedFieldTheme', squadData.fieldTheme);
            if (typeof applyTheme === 'function') {
                applyTheme(squadData.fieldTheme);
            }
        }

        // Re-render the squad builder
        renderSquadBuilder();
        
        console.log('✅ Squad loaded successfully');
        
        return true;
    } catch (error) {
        console.error('❌ Error loading squad:', error);
        return false;
    }
}

/**
 * Check if a saved squad exists
 */
function hasSavedSquad() {
    return localStorage.getItem('savedSquad_main') !== null;
}

/**
 * Delete saved squad
 */
function deleteSavedSquad() {
    try {
        localStorage.removeItem('savedSquad_main');
        console.log('🗑️ Saved squad deleted');
        return true;
    } catch (error) {
        console.error('❌ Error deleting saved squad:', error);
        return false;
    }
}

// Export functions if using modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateValue,
        formatPrice,
        saveSquad,
        loadSquad,
        hasSavedSquad,
        deleteSavedSquad
    };
}
