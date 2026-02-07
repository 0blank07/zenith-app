// ============================================
// SQUAD EXPORT SYSTEM (Screenshot to Image)
// ============================================
// Capture squad formation as image and download to PC

/**
 * Export squad as image using html2canvas
 * Captures the squad field and downloads as PNG
 */
async function exportSquad() {
    try {
        console.log('📸 Starting squad export...');
        
        if (typeof html2canvas === 'undefined') {
            throw new Error('html2canvas library not loaded. Please include the library.');
        }

        const squadField = document.getElementById('squad-field');
        if (!squadField) {
            throw new Error('Squad field not found');
        }

        // Sync squad name from input
        const nameInput = document.getElementById('squad-name-input');
        if (nameInput) {
            squadState.name = (nameInput.value || '').trim() || squadState.name || 'My Squad';
        }

        const currentFormation = typeof getFormations === 'function' ? getFormations()[squadState.formationId] : null;
        if (!currentFormation) {
            throw new Error('Formation data not found');
        }

        const exportPayload = buildExportSquadLayout(currentFormation);
        const exportRoot = exportPayload.root;
        const backgroundUrl = exportPayload.backgroundUrl;

        document.body.appendChild(exportRoot);

        await Promise.all([
            waitForImages(exportRoot),
            preloadBackgroundImage(backgroundUrl)
        ]);

        const captureOptions = {
            backgroundColor: '#0a1628',
            scale: 2,
            logging: false,
            useCORS: true,
            allowTaint: true,
            width: exportRoot.offsetWidth,
            height: exportRoot.offsetHeight,
            x: 0,
            y: 0
        };

        console.log('📸 Capturing with options:', captureOptions);

        const canvas = await html2canvas(exportRoot, captureOptions);
        console.log('✅ Canvas captured:', canvas.width, 'x', canvas.height);

        exportRoot.remove();

        canvas.toBlob((blob) => {
            if (!blob) {
                throw new Error('Failed to create image blob');
            }

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const squadName = squadState.name || 'My Squad';
            const filename = `${squadName.replace(/\s+/g, '_')}_${timestamp}.png`;

            link.href = url;
            link.download = filename;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);

            console.log('✅ Squad exported:', filename);

        }, 'image/png');
        
    } catch (error) {
        console.error('❌ Error exporting squad:', error);
        
    }
}

function buildExportSquadLayout(currentFormation) {
    const exportRoot = document.createElement('div');
    exportRoot.id = 'squad-export-root';

    const wrapper = document.createElement('div');
    wrapper.className = 'squad-export-card';

    const header = document.createElement('div');
    header.className = 'squad-export-header';
    header.innerHTML = `
        <div class="squad-export-title">ZENITH</div>
        <div class="squad-export-subtitle">Football Squad Builder</div>
    `;

    const metaRow = document.createElement('div');
    metaRow.className = 'squad-export-meta';
    metaRow.innerHTML = `
        <div class="squad-export-team">TEAM: ${escapeHtml(squadState.name || 'My Squad')}</div>
        <div class="squad-export-ovr">OVR: ${getFinalTeamOVR() || 0}</div>
    `;

    const grid = document.createElement('div');
    grid.className = 'squad-export-grid';

    const leftCol = document.createElement('div');
    leftCol.className = 'squad-export-left';

    const pitchCard = document.createElement('div');
    pitchCard.className = 'squad-export-pitch-card';
    const backgroundUrl = applyExportThemeBackground(pitchCard);

    const pitchField = document.createElement('div');
    pitchField.className = 'squad-export-field';

    const pitchSlots = document.createElement('div');
    pitchSlots.className = 'squad-export-slots';

    currentFormation.slots.forEach(slot => {
        pitchSlots.appendChild(buildExportSlot(slot));
    });

    const bench = buildExportBench();

    pitchCard.appendChild(pitchField);
    pitchCard.appendChild(pitchSlots);
    leftCol.appendChild(pitchCard);
    leftCol.appendChild(bench);

    const rightCol = document.createElement('div');
    rightCol.className = 'squad-export-right';
    rightCol.innerHTML = `
        <div class="squad-export-card-section">
            <div class="squad-export-card-title">Squad Value</div>
            <div class="squad-export-card-value">${formatPrice(calculateValue() || 0)} Coins</div>
        </div>
        <div class="squad-export-card-section">
            <div class="squad-export-card-title">OVR</div>
            <div class="squad-export-card-value">${getFinalTeamOVR() || 0}</div>
        </div>
        <div class="squad-export-card-section">
            <div class="squad-export-card-title">Formation</div>
            <div class="squad-export-card-value">${formatFormationLabel(squadState.formationId)}</div>
        </div>
        <div class="squad-export-card-section">
            <div class="squad-export-card-title">Badges</div>
            <div class="squad-export-badges">${renderBadgeStars()}</div>
        </div>
        <div class="squad-export-card-section squad-export-qr-card">
            <div class="squad-export-card-title">QR Access</div>
            <img class="squad-export-qr" src="${getQrImageUrl()}" alt="QR code linking to zenithfcm.com" crossorigin="anonymous">
            <div class="squad-export-qr-text">CHECK SQUAD</div>
        </div>
        <div class="squad-export-card-section">
            <div class="squad-export-card-title">Zenith Engine</div>
            <div class="squad-export-card-subtitle">Squad Analytics</div>
        </div>
    `;

    grid.appendChild(leftCol);
    grid.appendChild(rightCol);

    wrapper.appendChild(header);
    wrapper.appendChild(metaRow);
    wrapper.appendChild(grid);
    exportRoot.appendChild(wrapper);

    return { root: exportRoot, backgroundUrl };
}

function renderBadgeStars() {
    const activeBadges = Object.values(squadState.badges || {}).filter(Boolean).length;
    const starCount = Math.min(Math.max(activeBadges, 0), 3);
    if (starCount === 0) {
        return '<div class="squad-export-badge">No Stars</div>';
    }
    return `<div class="squad-export-stars">${'★'.repeat(starCount)}</div>`;
}

function buildExportSlot(slot) {
    const container = document.createElement('div');
    container.className = 'squad-slot squad-export-slot';
    container.style.left = slot.x + '%';
    container.style.top = slot.y + '%';

    const positionDot = document.createElement('div');
    positionDot.className = 'position-dot';
    positionDot.innerHTML = `<span class="position-label">${slot.label}</span>`;
    container.appendChild(positionDot);

    const assignedId = squadState.starters[slot.id] || null;
    if (!assignedId) {
        return container;
    }

    const player = getPlayers().find(p => p.id === assignedId || p.playerid === assignedId || p.player_id === assignedId);
    if (!player) {
        return container;
    }

    const playerId = player.id || player.playerid || player.player_id;
    const overall = player.ovr || player.overall || 0;
    const position = player.position || 'NA';
    const playerName = player.name || 'Unknown';
    const slotPosition = slot.label.toLowerCase();
    const adjustedOVR = typeof getPositionAdjustedOVR === 'function'
        ? getPositionAdjustedOVR(player, slotPosition)
        : overall;

    const cardBg = player.cardbackground || player.card_background || player.cardBackground ||
        `https://cdn.futbin.com/content/fifa25/img/cards/e_${playerId}.png`;
    const playerImg = player.playerimage || player.player_image || player.playerImage ||
        player.playerimg || player.playerImg || player.image ||
        `https://cdn.futbin.com/content/fifa25/img/players/${playerId}.png`;

    const colorRating = player.colorrating || player.color_rating || player.colorRating || '#FFFFFF';
    const colorPosition = player.colorposition || player.color_position || player.colorPosition || '#FFFFFF';
    const colorName = player.colorname || player.color_name || player.colorName || '#FFFFFF';

    const previewCard = document.createElement('div');
    previewCard.className = 'player-preview-card squad-export-player-card';
    previewCard.innerHTML = `
        <div class="preview-card-inner">
            <img src="${cardBg}" alt="Card" class="preview-card-bg" crossorigin="anonymous"
                onerror="this.style.background='linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%)'; this.style.opacity='0.3';">
            <img src="${playerImg}" alt="${escapeHtml(playerName)}" class="preview-card-player-img" crossorigin="anonymous"
                onerror="this.style.display='none';">
            <div class="preview-card-ovr" style="color: ${colorRating};">${adjustedOVR > 0 ? adjustedOVR : 'NA'}</div>
            <div class="preview-card-position" style="color: ${colorPosition}">${escapeHtml(position)}</div>
            <div class="preview-card-name" style="color: ${colorName}">${escapeHtml(playerName)}</div>
            ${player.nationflag || player.nation_flag ?
                `<img src="${player.nationflag || player.nation_flag}" alt="Nation" class="preview-card-flag-nation" crossorigin="anonymous" onerror="this.style.display='none'">`
                : ''}
            ${player.clubflag || player.club_flag ?
                `<img src="${player.clubflag || player.club_flag}" alt="Club" class="preview-card-flag-club" crossorigin="anonymous" onerror="this.style.display='none'">`
                : ''}
        </div>
    `;

    container.appendChild(previewCard);
    return container;
}

function buildExportBench() {
    const benchContainer = document.createElement('div');
    benchContainer.className = 'squad-export-bench';

    const benchGrid = document.createElement('div');
    benchGrid.className = 'squad-bench squad-export-bench-grid';

    for (let i = 0; i < 7; i++) {
        const pid = squadState.bench[i] || null;
        const player = pid ? getPlayers().find(p => p.id === pid || p.playerid === pid || p.player_id === pid) : null;

        const cell = document.createElement('div');
        cell.className = 'bench-cell';

        const emptySlot = document.createElement('div');
        emptySlot.className = 'bench-empty-slot';
        emptySlot.innerHTML = `<span class="bench-slot-label">SUB ${i + 1}</span>`;
        cell.appendChild(emptySlot);

        if (player) {
            const playerId = player.id || player.playerid || player.player_id;
            const overall = player.ovr || player.overall || 0;
            const position = player.position || 'NA';
            const playerName = player.name || 'Unknown';

            const cardBg = player.cardbackground || player.card_background || player.cardBackground ||
                `https://cdn.futbin.com/content/fifa25/img/cards/e_${playerId}.png`;
            const playerImg = player.playerimage || player.player_image || player.playerImage ||
                player.playerimg || player.playerImg || player.image ||
                `https://cdn.futbin.com/content/fifa25/img/players/${playerId}.png`;

            const colorRating = player.colorrating || player.color_rating || player.colorRating || '#FFFFFF';
            const colorPosition = player.colorposition || player.color_position || player.colorPosition || '#FFFFFF';
            const colorName = player.colorname || player.color_name || player.colorName || '#FFFFFF';

            const benchCard = document.createElement('div');
            benchCard.className = 'bench-preview-card squad-export-bench-card';
            benchCard.innerHTML = `
                <div class="bench-card-inner">
                    <img src="${cardBg}" alt="Card" class="bench-card-bg" crossorigin="anonymous"
                        onerror="this.style.background='linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%)'; this.style.opacity='0.3';">
                    <img src="${playerImg}" alt="${escapeHtml(playerName)}" class="bench-card-player-img" crossorigin="anonymous"
                        onerror="this.style.display='none';">
                    <div class="bench-card-ovr" style="color: ${colorRating}">${overall > 0 ? overall : 'NA'}</div>
                    <div class="bench-card-position" style="color: ${colorPosition}">${escapeHtml(position)}</div>
                    <div class="bench-card-name" style="color: ${colorName}">${escapeHtml(playerName)}</div>
                    ${player.nationflag || player.nation_flag ?
                        `<img src="${player.nationflag || player.nation_flag}" alt="Nation" class="bench-card-flag-nation" crossorigin="anonymous" onerror="this.style.display='none'">`
                        : ''}
                    ${player.clubflag || player.club_flag ?
                        `<img src="${player.clubflag || player.club_flag}" alt="Club" class="bench-card-flag-club" crossorigin="anonymous" onerror="this.style.display='none'">`
                        : ''}
                </div>
            `;
            cell.appendChild(benchCard);
        }

        benchGrid.appendChild(cell);
    }

    benchContainer.appendChild(benchGrid);
    return benchContainer;
}

function formatFormationLabel(formationId) {
    const select = document.getElementById('formation-select');
    if (select) {
        const option = select.querySelector(`option[value="${formationId}"]`);
        if (option) {
            return option.textContent.trim();
        }
    }

    return formationId || 'Formation';
}

function getQrImageUrl() {
    return 'https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=https%3A%2F%2Fzenithfcm.com';
}

function applyExportThemeBackground(target) {
    const themeBackground = getSelectedThemeBackground();
    if (themeBackground) {
        target.style.background = themeBackground;
    }
    const backgroundUrl = extractBackgroundUrl(themeBackground);
    console.log('🎨 Export background:', themeBackground || 'none');
    return backgroundUrl;
}

function getSelectedThemeBackground() {
    const themeId = localStorage.getItem('selectedFieldTheme') || 'camp-nou';
    const themeMap = {
        'stadium-blue': 'url(assets/images/background/squad_builder_1.webp) center/cover no-repeat',
        'camp-nou': 'url(assets/images/background/squad_builder_2.webp) center/cover no-repeat',
        'old-trafford': 'url(assets/images/background/squad_builder_3.webp) center/cover no-repeat',
        'santiago-bernabeu': 'url(assets/images/background/squad_builder_4.webp) center/cover no-repeat',
        'anfield': 'url(assets/images/background/squad_builder_5.webp) center/cover no-repeat'
    };

    return themeMap[themeId] || themeMap['camp-nou'];
}

function extractBackgroundUrl(backgroundValue) {
    if (!backgroundValue) return null;
    const match = backgroundValue.match(/url\((['"]?)(.+?)\1\)/);
    return match ? match[2] : null;
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function waitForImages(container) {
    const images = Array.from(container.querySelectorAll('img'));
    if (!images.length) return Promise.resolve();

    return Promise.all(images.map(img => {
        if (img.complete && img.naturalWidth > 0) {
            return Promise.resolve();
        }
        return new Promise(resolve => {
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', resolve, { once: true });
        });
    }));
}

function preloadBackgroundImage(url) {
    if (!url) return Promise.resolve();
    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = url;
    });
}

/**
 * Export squad with overlay information (OVR, Formation, etc.)
 * Advanced version with metadata overlay
 */
async function exportSquadWithInfo() {
    try {
        console.log('📸 Starting advanced squad export...');
        
        const squadField = document.getElementById('squad-field');
        
        if (!squadField) {
            throw new Error('Squad field not found');
        }
        
        if (typeof html2canvas === 'undefined') {
            throw new Error('html2canvas library not loaded');
        }
        
        // Create temporary overlay with squad info
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: absolute;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 15px;
            border-radius: 10px;
            font-family: 'Segoe UI', sans-serif;
            z-index: 9999;
        `;
        
        overlay.innerHTML = `
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">
                ${squadState.name || 'My Squad'}
            </div>
            <div style="font-size: 14px; opacity: 0.9;">
                Formation: ${squadState.formationId} | OVR: ${getFinalTeamOVR()}
            </div>
            <div style="font-size: 12px; opacity: 0.7; margin-top: 5px;">
                Created with Zenith FCM
            </div>
        `;
        
        squadField.appendChild(overlay);
        
        // Capture
        const canvas = await html2canvas(squadField, {
            backgroundColor: '#0a1628',
            scale: 2,
            logging: false,
            useCORS: true,
            allowTaint: true
        });
        
        // Remove overlay
        squadField.removeChild(overlay);
        
        // Download
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const filename = `${(squadState.name || 'My_Squad').replace(/\s+/g, '_')}_${timestamp}.png`;
            
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
        }, 'image/png');
        
    } catch (error) {
        console.error('❌ Error exporting squad:', error);
        
    }
}

/**
 * Check if html2canvas library is loaded
 */
function isExportAvailable() {
    return typeof html2canvas !== 'undefined';
}

// Export functions if using modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        exportSquad,
        exportSquadWithInfo,
        isExportAvailable
    };
}
