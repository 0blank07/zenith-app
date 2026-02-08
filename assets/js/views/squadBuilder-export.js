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
        console.info('EXPORT_START', { formationId: squadState?.formationId });
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

        const loadState = await waitForExportLoadState();
        const playersLoaded = loadState.playersLoaded;
        const subsLoaded = loadState.subsLoaded;

        if (!playersLoaded || !subsLoaded) {
            console.warn('[EXPORT] Export blocked: squad data not ready', loadState);
            return;
        }

        console.info('EXPORT_PLAYERS_LOADED', { starters: loadState.starterCount });
        console.info('EXPORT_SUBS_LOADED', { subs: loadState.benchCount });

        const exportPayload = buildExportSquadLayout(currentFormation);
        const exportRoot = exportPayload.root;
        const backgroundUrl = exportPayload.backgroundUrl;

        document.body.appendChild(exportRoot);

        await waitForExportRenderCycle();

        await Promise.all([
            ensureExportImagesReady(exportRoot),
            preloadBackgroundImage(backgroundUrl)
        ]);

        const renderedCardCount = countExportCards(exportRoot);
        console.info('EXPORT_RENDER_COMPLETE', { cards: renderedCardCount });

        const captureWidth = exportRoot.scrollWidth || exportRoot.offsetWidth;
        const captureHeight = exportRoot.scrollHeight || exportRoot.offsetHeight;
        const captureOptions = {
            backgroundColor: '#0a1628',
            scale: 2,
            logging: false,
            useCORS: true,
            allowTaint: true,
            width: captureWidth,
            height: captureHeight,
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

function getExportLoadState() {
    const starters = Object.entries(squadState?.starters || {});
    const bench = Array.isArray(squadState?.bench) ? squadState.bench : [];
    const missingStarters = [];
    const missingBench = [];
    let starterCount = 0;
    let benchCount = 0;

    starters.forEach(([, pid]) => {
        if (!pid) return;
        starterCount += 1;
        const player = typeof getSquadPlayerById === 'function'
            ? getSquadPlayerById(pid)
            : getPlayers().find(p => p.id === pid || p.playerid === pid || p.player_id === pid);
        if (!player) missingStarters.push(pid);
    });

    bench.forEach(pid => {
        if (!pid) return;
        benchCount += 1;
        const player = typeof getSquadPlayerById === 'function'
            ? getSquadPlayerById(pid)
            : getPlayers().find(p => p.id === pid || p.playerid === pid || p.player_id === pid);
        if (!player) missingBench.push(pid);
    });

    return {
        playersLoaded: missingStarters.length === 0,
        subsLoaded: missingBench.length === 0,
        missingStarters,
        missingBench,
        starterCount,
        benchCount
    };
}

async function waitForExportLoadState(options = {}) {
    const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : 2000;
    const intervalMs = Number.isFinite(options.intervalMs) ? options.intervalMs : 120;
    const start = Date.now();
    let state = getExportLoadState();

    while ((!state.playersLoaded || !state.subsLoaded) && (Date.now() - start < timeoutMs)) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
        state = getExportLoadState();
    }

    return state;
}

function waitForExportRenderCycle() {
    return new Promise(resolve => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
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
    const rawValue = calculateValue() || 0;
    const squadValue = Number.isFinite(rawValue) ? rawValue : 0;
    console.info('EXPORT_VALUE_CALCULATED', { value: squadValue });
    rightCol.innerHTML = `
        <div class="squad-export-card-section">
            <div class="squad-export-card-title">Squad Value</div>
            <div class="squad-export-card-value">${formatPrice(squadValue)} Coins</div>
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
    positionDot.style.zIndex = '1';
    container.appendChild(positionDot);

    const assignedId = squadState.starters[slot.id] || null;
    if (!assignedId) {
        return container;
    }

    const player = typeof getSquadPlayerById === 'function'
        ? getSquadPlayerById(assignedId)
        : getPlayers().find(p => p.id === assignedId || p.playerid === assignedId || p.player_id === assignedId);
    if (!player) {
        return container;
    }

    const previewCard = document.createElement('div');
    previewCard.className = 'player-preview-card squad-export-player-card';
    previewCard.style.zIndex = '2';
    previewCard.innerHTML = buildSquadPreviewCardMarkup(player, slot.label || '', slot.id, { includeCrossOrigin: true });

    container.appendChild(previewCard);
    return container;
}

function buildExportBench() {
    const benchContainer = document.createElement('div');
    benchContainer.className = 'squad-export-bench';

    const benchGrid = document.createElement('div');
    benchGrid.className = 'squad-bench squad-export-bench-grid';

    const benchSlots = Array.from({ length: 7 }, (_, i) => squadState.bench?.[i] || null);

    for (let i = 0; i < 7; i++) {
        const pid = benchSlots[i];
        const player = pid
            ? (typeof getSquadPlayerById === 'function'
                ? getSquadPlayerById(pid)
                : getPlayers().find(p => p.id === pid || p.playerid === pid || p.player_id === pid))
            : null;

        const cell = document.createElement('div');
        cell.className = 'bench-cell';

        const emptySlot = document.createElement('div');
        emptySlot.className = 'bench-empty-slot';
        emptySlot.innerHTML = `<span class="bench-slot-label">SUB ${i + 1}</span>`;
        cell.appendChild(emptySlot);

        if (player) {
            const benchCard = document.createElement('div');
            benchCard.className = 'bench-preview-card squad-export-bench-card';
            benchCard.style.zIndex = '2';
            benchCard.innerHTML = buildSquadBenchCardMarkup(player, i, { includeCrossOrigin: true });
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

function countExportCards(container) {
    return container.querySelectorAll('.squad-export-player-card, .squad-export-bench-card').length;
}

function getExportCardImages(container) {
    return Array.from(container.querySelectorAll(
        '.preview-card-bg, .preview-card-player-img, .bench-card-bg, .bench-card-player-img'
    ));
}

function getMissingImages(images) {
    return images.filter(img => !(img.complete && img.naturalWidth > 0));
}

async function retryMissingImages(images) {
    if (!images.length) return;
    const retryStamp = Date.now();

    await Promise.all(images.map(img => {
        const src = img.getAttribute('src');
        if (!src) return Promise.resolve();
        const separator = src.includes('?') ? '&' : '?';
        img.src = `${src}${separator}retry=${retryStamp}`;
        return new Promise(resolve => {
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', resolve, { once: true });
        });
    }));
}

async function ensureExportImagesReady(container) {
    await waitForImages(container);
    const cardImages = getExportCardImages(container);
    const missing = getMissingImages(cardImages);
    if (missing.length) {
        await retryMissingImages(missing);
    }
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
