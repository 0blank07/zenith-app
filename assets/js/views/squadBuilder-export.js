// ============================================
// SQUAD EXPORT SYSTEM (Screenshot to Image)
// ============================================
// Capture squad formation as image and download to PC

/**
 * Export squad as image using html2canvas
 * Captures the squad field and downloads as PNG
 */
async function exportSquad() {
    let exportRoot = null;
    try {
        exportLiveImageDataUrlCache.clear();
        console.info('[EXPORT] Pipeline version', '2026-02-20-cors-hangfix-v2');
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
        exportRoot = exportPayload.root;
        const backgroundUrl = exportPayload.backgroundUrl;

        document.body.appendChild(exportRoot);

        await waitForExportRenderCycle();
        const [mediaAudit] = await Promise.all([
            ensureExportImagesReady(exportRoot),
            preloadBackgroundImage(backgroundUrl)
        ]);
        if (mediaAudit?.missingRequired?.length) {
            console.warn('[EXPORT] Required media unresolved before capture', mediaAudit.missingRequired);
        }

        const renderedCardCount = countExportCards(exportRoot);
        console.info('EXPORT_RENDER_COMPLETE', { cards: renderedCardCount });

        const captureWidth = exportRoot.scrollWidth || exportRoot.offsetWidth;
        const captureHeight = exportRoot.scrollHeight || exportRoot.offsetHeight;
        const captureOptions = {
            backgroundColor: '#0a1628',
            scale: 2,
            logging: false,
            useCORS: true,
            allowTaint: false,
            foreignObjectRendering: false,
            imageTimeout: 15000,
            width: captureWidth,
            height: captureHeight,
            x: 0,
            y: 0
        };

        console.log('📸 Capturing with options:', captureOptions);

        const canvas = await html2canvas(exportRoot, captureOptions);
        console.log('✅ Canvas captured:', canvas.width, 'x', canvas.height);
        const blob = await canvasToBlob(canvas, 'image/png');

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
        
    } catch (error) {
        console.error('❌ Error exporting squad:', error);
        console.error('[EXPORT][ROOT_CAUSE]', {
            message: error?.message || String(error),
            hint: 'Cross-origin media without CORS headers can block canvas export; rewritten URLs are logged as [EXPORT][CORS_REWRITE]'
        });
    } finally {
        if (exportRoot && exportRoot.isConnected) {
            exportRoot.remove();
        }
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

function canvasToBlob(canvas, mimeType = 'image/png') {
    return new Promise((resolve, reject) => {
        if (!canvas) {
            reject(new Error('Canvas is required'));
            return;
        }
        try {
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Failed to create image blob (canvas may be tainted by CORS-restricted media)'));
                    return;
                }
                resolve(blob);
            }, mimeType);
        } catch (error) {
            reject(error);
        }
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

const EXPORT_CORS_SAFE_HOST = 'images.zenithfcm.com';
const exportAssetRewriteLog = new Set();
const exportAssetSkipLog = new Set();
const EXPORT_REWRITEABLE_RENDERZ_PATH = /^(flags_|club_|league_|bg_23_|player_)/i;
const EXPORT_FALLBACK_CARD_URL = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#1E293B"/><stop offset="100%" stop-color="#334155"/></linearGradient></defs><rect width="300" height="400" rx="26" fill="url(#g)"/><rect x="18" y="18" width="264" height="364" rx="20" fill="none" stroke="#64748B" stroke-opacity="0.45" stroke-width="3"/><text x="150" y="208" text-anchor="middle" fill="#CBD5E1" font-size="24" font-family="Segoe UI, Arial">ZENITH</text></svg>'
)}`;
const EXPORT_FALLBACK_PLAYER_URL = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300"><defs><linearGradient id="p" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#A5B4FC"/><stop offset="100%" stop-color="#60A5FA"/></linearGradient></defs><rect width="200" height="300" fill="none"/><circle cx="100" cy="88" r="42" fill="url(#p)" opacity="0.92"/><rect x="48" y="136" width="104" height="122" rx="52" fill="url(#p)" opacity="0.92"/></svg>'
)}`;
const EXPORT_FALLBACK_FLAG_URL = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="16"><rect width="24" height="16" rx="2" fill="#0F172A"/><rect x="1" y="1" width="22" height="14" rx="1.5" fill="#1E293B"/><rect x="1" y="1" width="7.3" height="14" fill="#1D4ED8"/><rect x="8.3" y="1" width="7.3" height="14" fill="#E2E8F0"/><rect x="15.6" y="1" width="7.4" height="14" fill="#DC2626"/></svg>'
)}`;
const exportLiveImageDataUrlCache = new Map();

function getGuaranteedExportFallbackByRole(role) {
    if (role === 'card-bg') return EXPORT_FALLBACK_CARD_URL;
    if (role === 'player-img') return EXPORT_FALLBACK_PLAYER_URL;
    if (role === 'nation-flag' || role === 'club-flag' || role === 'league-flag') return EXPORT_FALLBACK_FLAG_URL;
    return '';
}

function normalizeExportAssetUrl(url) {
    if (!url) return '';
    const raw = String(url).trim();
    if (!raw) return '';
    if (raw.startsWith('data:') || raw.startsWith('blob:')) return raw;
    try {
        const parsed = new URL(raw, window.location.href);
        if (/renderz\.app$/i.test(parsed.hostname)) {
            const assetPath = parsed.pathname.replace(/^\/+/, '');
            if (assetPath) {
                if (!EXPORT_REWRITEABLE_RENDERZ_PATH.test(assetPath)) {
                    const skipKey = `${parsed.hostname}${parsed.pathname}`;
                    if (!exportAssetSkipLog.has(skipKey)) {
                        exportAssetSkipLog.add(skipKey);
                        console.warn('[EXPORT][CORS_SKIP]', {
                            host: parsed.hostname,
                            path: parsed.pathname,
                            reason: 'renderz asset is not export-safe for canvas'
                        });
                    }
                    return '';
                }
                const rewrittenUrl = `https://${EXPORT_CORS_SAFE_HOST}/${assetPath}${parsed.search || ''}`;
                const rewriteKey = `${parsed.hostname}${parsed.pathname}`;
                if (!exportAssetRewriteLog.has(rewriteKey)) {
                    exportAssetRewriteLog.add(rewriteKey);
                    console.warn('[EXPORT][CORS_REWRITE]', {
                        fromHost: parsed.hostname,
                        toHost: EXPORT_CORS_SAFE_HOST,
                        path: parsed.pathname
                    });
                }
                return rewrittenUrl;
            }
        }
        return parsed.href;
    } catch (_) {
        return raw;
    }
}

function extractLoadedImageAsDataUrl(imgElement) {
    if (!imgElement) return '';
    const src = imgElement.currentSrc || imgElement.getAttribute('src') || '';
    if (!src) return '';
    if (src.startsWith('data:')) return src;
    if (!imgElement.complete || imgElement.naturalWidth <= 0 || imgElement.naturalHeight <= 0) {
        return '';
    }
    try {
        const canvas = document.createElement('canvas');
        canvas.width = imgElement.naturalWidth;
        canvas.height = imgElement.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';
        ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        if (!dataUrl || !dataUrl.startsWith('data:image/')) return '';
        return dataUrl;
    } catch (error) {
        console.warn('[EXPORT][LIVE_IMG_EXTRACT_FAIL]', {
            src,
            message: error?.message || String(error)
        });
        return '';
    }
}

function getLiveCardImage(playerId, selector) {
    if (!playerId || !selector) return '';
    const cacheKey = `${playerId}::${selector}`;
    if (exportLiveImageDataUrlCache.has(cacheKey)) {
        return exportLiveImageDataUrlCache.get(cacheKey);
    }

    const targetId = String(playerId);
    let cardElement = Array.from(document.querySelectorAll('.player-preview-card[data-player-id]'))
        .find(card => String(card.dataset.playerId || '') === targetId);
    if (!cardElement) {
        cardElement = Array.from(document.querySelectorAll('.bench-preview-card[data-player-id]'))
            .find(card => String(card.dataset.playerId || '') === targetId);
    }
    if (!cardElement) {
        exportLiveImageDataUrlCache.set(cacheKey, '');
        return '';
    }

    const imgElement = cardElement.querySelector(selector);
    if (!imgElement) {
        exportLiveImageDataUrlCache.set(cacheKey, '');
        return '';
    }

    const dataUrl = extractLoadedImageAsDataUrl(imgElement);
    if (dataUrl) {
        exportLiveImageDataUrlCache.set(cacheKey, dataUrl);
        console.info('[EXPORT][LIVE_IMG_EXTRACT_OK]', { playerId: targetId, selector });
        return dataUrl;
    }

    const normalizedLiveSrc = normalizeExportAssetUrl(imgElement.currentSrc || imgElement.getAttribute('src') || '');
    exportLiveImageDataUrlCache.set(cacheKey, normalizedLiveSrc || '');
    if (normalizedLiveSrc) {
        console.info('[EXPORT][LIVE_IMG_SOURCE_FALLBACK]', { playerId: targetId, selector });
    }
    return normalizedLiveSrc;
}

function findExportPlayerById(collection, playerId) {
    if (!Array.isArray(collection) || !playerId) return null;
    const target = String(playerId);
    return collection.find(item => String(item?.player_id || item?.id || item?.playerid || '') === target) || null;
}

function collectExportPlayerCandidates(playerId, fallbackPlayer) {
    const candidates = [];
    const pushCandidate = (candidate) => {
        if (candidate && typeof candidate === 'object') {
            candidates.push(candidate);
        }
    };

    pushCandidate(fallbackPlayer);

    if (typeof getSquadPlayerById === 'function') {
        pushCandidate(getSquadPlayerById(playerId));
    }

    if (typeof getPlayers === 'function') {
        pushCandidate(findExportPlayerById(getPlayers(), playerId));
    }

    if (window.state?.allPlayers) {
        pushCandidate(findExportPlayerById(window.state.allPlayers, playerId));
    }

    return candidates;
}

function pickFirstAssetUrl(candidates, keys) {
    for (const candidate of candidates) {
        for (const key of keys) {
            const value = candidate?.[key];
            if (value !== undefined && value !== null && String(value).trim() !== '') {
                const normalized = normalizeExportAssetUrl(value);
                if (normalized) {
                    return normalized;
                }
            }
        }
    }
    return '';
}

function collectExportPlayerAssetSources(playerId, fallbackPlayer) {
    const resolvedPlayerId = playerId || fallbackPlayer?.player_id || fallbackPlayer?.id || fallbackPlayer?.playerid || null;
    const candidates = collectExportPlayerCandidates(resolvedPlayerId, fallbackPlayer);
    const liveCardBg = resolvedPlayerId
        ? (getLiveCardImage(resolvedPlayerId, '.preview-card-bg') || getLiveCardImage(resolvedPlayerId, '.bench-card-bg'))
        : '';
    const livePlayerImg = resolvedPlayerId
        ? (getLiveCardImage(resolvedPlayerId, '.preview-card-player-img') || getLiveCardImage(resolvedPlayerId, '.bench-card-player-img'))
        : '';
    const fallbackCard = EXPORT_FALLBACK_CARD_URL;
    const fallbackPlayerImg = (resolvedPlayerId
        ? normalizeExportAssetUrl(`https://cdn.futbin.com/content/fifa25/img/players/${resolvedPlayerId}.png`)
        : '') || EXPORT_FALLBACK_PLAYER_URL;

    const sources = {
        playerId: resolvedPlayerId,
        cardBg: liveCardBg || pickFirstAssetUrl(candidates, [
            'card_background', 'cardbackground', 'cardBackground', 'card_bg', 'cardBg',
            'card_image', 'cardImage', 'cardimg', 'card',
            'card_background_url', 'cardBackgroundUrl', 'card_image_url', 'cardImageUrl'
        ]) || fallbackCard,
        playerImg: livePlayerImg || pickFirstAssetUrl(candidates, [
            'player_image', 'playerimage', 'playerImage', 'playerimg', 'playerImg', 'player_img',
            'image', 'image_url', 'imageUrl', 'imageurl', 'player_face', 'playerFace',
            'player_image_url', 'playerImageUrl'
        ]) || fallbackPlayerImg,
        nationFlag: pickFirstAssetUrl(candidates, [
            'nation_flag', 'nationflag', 'nationFlag', 'country_flag', 'countryFlag', 'national_flag',
            'nationflagurl', 'nationFlagUrl', 'flag_nation', 'flagNation'
        ]),
        clubFlag: pickFirstAssetUrl(candidates, [
            'club_flag', 'clubflag', 'clubFlag', 'team_flag', 'teamFlag', 'club_logo', 'clubLogo', 'team_logo',
            'clublogourl', 'clubLogoUrl', 'club_image', 'clubImage'
        ]),
        leagueFlag: pickFirstAssetUrl(candidates, [
            'league_flag', 'leagueflag', 'leagueFlag', 'league_logo', 'leagueLogo', 'league_image', 'leagueimg',
            'leagueflagurl', 'leagueFlagUrl', 'league_logo_url', 'leagueLogoUrl'
        ])
    };

    console.info('[EXPORT][ASSETS] Resolved media sources', {
        playerId: sources.playerId,
        hasLiveCardBg: Boolean(liveCardBg),
        hasLivePlayerImg: Boolean(livePlayerImg),
        hasCardBg: Boolean(sources.cardBg),
        hasPlayerImg: Boolean(sources.playerImg),
        hasNationFlag: Boolean(sources.nationFlag),
        hasClubFlag: Boolean(sources.clubFlag),
        hasLeagueFlag: Boolean(sources.leagueFlag)
    });

    return sources;
}

function setExportImageSource(imageElement, sourceUrl, role, playerId) {
    if (!imageElement) return;
    if (role) imageElement.dataset.imageRole = role;
    if (playerId) imageElement.dataset.playerId = String(playerId);
    const guaranteedFallback = getGuaranteedExportFallbackByRole(role);

    if (!sourceUrl) {
        if (guaranteedFallback) {
            sourceUrl = guaranteedFallback;
            console.warn('[EXPORT][SOURCE_MISSING_FALLBACK]', { role, playerId });
        } else {
            imageElement.removeAttribute('src');
            imageElement.dataset.missingSource = 'true';
            imageElement.style.display = 'none';
            return;
        }
    }

    imageElement.dataset.missingSource = 'false';
    imageElement.dataset.fallbackApplied = sourceUrl === guaranteedFallback ? 'true' : 'false';
    if (guaranteedFallback) {
        imageElement.onerror = function () {
            const failedSrc = this.getAttribute('src') || '';
            if (failedSrc === guaranteedFallback || this.dataset.fallbackApplied === 'true') {
                console.warn('[EXPORT][IMG_FAIL_NO_FALLBACK]', {
                    role,
                    playerId,
                    src: failedSrc
                });
                this.style.display = '';
                return;
            }
            console.warn('[EXPORT][IMG_FAIL_FALLBACK]', {
                role,
                playerId,
                failedSrc
            });
            this.dataset.fallbackApplied = 'true';
            setExportImageSource(this, guaranteedFallback, role, playerId);
        };
    } else {
        imageElement.onerror = null;
    }
    imageElement.setAttribute('crossorigin', 'anonymous');
    imageElement.setAttribute('referrerpolicy', 'no-referrer');
    imageElement.loading = 'eager';
    imageElement.decoding = 'sync';
    imageElement.src = sourceUrl;
    imageElement.style.display = '';
}

function ensureExportFlagImage(cardInner, className, sourceUrl, role, playerId, inlineStyle) {
    if (!cardInner) return;
    let flagImage = cardInner.querySelector(`.${className}`);

    if (!sourceUrl) {
        if (flagImage) flagImage.remove();
        return;
    }

    if (!flagImage) {
        flagImage = document.createElement('img');
        flagImage.className = className;
        flagImage.alt = role;
        if (inlineStyle) {
            flagImage.style.cssText = inlineStyle;
        }
        flagImage.onerror = function () {
            this.style.display = 'none';
        };
        cardInner.appendChild(flagImage);
    }

    setExportImageSource(flagImage, sourceUrl, role, playerId);
}

function hydrateExportCardMedia(cardElement, playerId, fallbackPlayer, cardType) {
    if (!cardElement) return;
    const sources = collectExportPlayerAssetSources(playerId, fallbackPlayer);
    const resolvedPlayerId = sources.playerId || playerId;
    if (resolvedPlayerId) {
        cardElement.dataset.playerId = String(resolvedPlayerId);
    }

    const isBenchCard = cardType === 'bench';
    const backgroundImage = cardElement.querySelector(isBenchCard ? '.bench-card-bg' : '.preview-card-bg');
    const playerImage = cardElement.querySelector(isBenchCard ? '.bench-card-player-img' : '.preview-card-player-img');
    const cardInner = cardElement.querySelector(isBenchCard ? '.bench-card-inner' : '.preview-card-inner');

    setExportImageSource(backgroundImage, sources.cardBg, 'card-bg', resolvedPlayerId);
    setExportImageSource(playerImage, sources.playerImg, 'player-img', resolvedPlayerId);

    if (cardInner) {
        ensureExportFlagImage(
            cardInner,
            isBenchCard ? 'bench-card-flag-nation' : 'preview-card-flag-nation',
            sources.nationFlag, 'nation-flag', resolvedPlayerId,
            null
        );
        ensureExportFlagImage(
            cardInner,
            isBenchCard ? 'bench-card-flag-club' : 'preview-card-flag-club',
            sources.clubFlag, 'club-flag', resolvedPlayerId,
            null
        );
        ensureExportFlagImage(
            cardInner,
            isBenchCard ? 'bench-card-flag-league' : 'preview-card-flag-league',
            sources.leagueFlag, 'league-flag', resolvedPlayerId,
            null
        );
    }


}

function cloneLiveSquadCard(cardClassName, playerId, exportClassName, cardType, fallbackPlayer) {
    if (!playerId) return null;

    const sourceCards = Array.from(document.querySelectorAll(`.${cardClassName}[data-player-id]`));
    const sourceCard = sourceCards.find(card => String(card.dataset.playerId || '') === String(playerId));
    if (!sourceCard) {
        console.warn('[EXPORT][CLONE_MISS] Live card not found', {
            cardClassName,
            playerId,
            availableIds: sourceCards.map(card => card.dataset.playerId || null)
        });
        return null;
    }

    const clonedCard = sourceCard.cloneNode(true);
    clonedCard.classList.add(exportClassName);
    clonedCard.removeAttribute('draggable');
    clonedCard.querySelectorAll('.preview-card-remove, .bench-card-remove').forEach(button => button.remove());

    // Strip all flag images from export cards
    clonedCard.querySelectorAll(
      '.preview-card-flag-nation, .preview-card-flag-club, .preview-card-flag-league, ' +
      '.bench-card-flag-nation, .bench-card-flag-club, .bench-card-flag-league, ' +
      '.card-nation-flag, .card-club-flag, .card-league-flag'
    ).forEach(flag => flag.remove());

    hydrateExportCardMedia(clonedCard, playerId, fallbackPlayer, cardType);
    return clonedCard;
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

    // ── Determine card type class ──
    const isIcon = !!(player.isicon || player.is_icon || player.isIcon);
    const isHero = !!(player.ishero || player.is_hero || player.isHero);
    const cardTypeClass = isIcon ? 'card-type-icon' : isHero ? 'card-type-hero' : 'card-type-normal';

    const playerId = typeof resolveSquadPlayerId === 'function'
        ? (resolveSquadPlayerId(player) || assignedId)
        : (player.player_id || player.id || player.playerid || assignedId);

    const livePreviewCard = cloneLiveSquadCard('player-preview-card', playerId, 'squad-export-player-card', 'starter', player);
    if (livePreviewCard) {
        livePreviewCard.classList.add(cardTypeClass);
        livePreviewCard.style.zIndex = '2';
        container.appendChild(livePreviewCard);
        return container;
    }

    const previewCard = document.createElement('div');
    previewCard.className = `player-preview-card squad-export-player-card ${cardTypeClass}`;
    previewCard.style.zIndex = '2';
    previewCard.dataset.playerId = String(playerId);
    previewCard.innerHTML = buildSquadPreviewCardMarkup(player, slot.label || '', slot.id, {
        includeCrossOrigin: true,
        includeRemoveButton: false
    });
    hydrateExportCardMedia(previewCard, playerId, player, 'starter');

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
        const playerId = player
            ? (typeof resolveSquadPlayerId === 'function'
                ? (resolveSquadPlayerId(player) || pid)
                : (player.player_id || player.id || player.playerid || pid))
            : pid;

        const cell = document.createElement('div');
        cell.className = 'bench-cell';

        const emptySlot = document.createElement('div');
        emptySlot.className = 'bench-empty-slot';
        emptySlot.innerHTML = `<span class="bench-slot-label">SUB ${i + 1}</span>`;
        cell.appendChild(emptySlot);

        if (player) {
            // ── Determine card type class ──
            const isIcon = !!(player.isicon || player.is_icon || player.isIcon);
            const isHero = !!(player.ishero || player.is_hero || player.isHero);
            const cardTypeClass = isIcon ? 'bench-type-icon' : isHero ? 'bench-type-hero' : 'bench-type-normal';

            const liveBenchCard = cloneLiveSquadCard('bench-preview-card', playerId, 'squad-export-bench-card', 'bench', player);
            if (liveBenchCard) {
                liveBenchCard.classList.add(cardTypeClass);
                liveBenchCard.style.zIndex = '2';
                cell.appendChild(liveBenchCard);
            } else {
                const benchCard = document.createElement('div');
                benchCard.className = `bench-preview-card squad-export-bench-card ${cardTypeClass}`;
                benchCard.style.zIndex = '2';
                benchCard.dataset.playerId = String(playerId);
                benchCard.innerHTML = buildSquadBenchCardMarkup(player, i, {
                    includeCrossOrigin: true,
                    includeRemoveButton: false
                });
                hydrateExportCardMedia(benchCard, playerId, player, 'bench');
                cell.appendChild(benchCard);
            }
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

function getExportCardRoleStatus(card, selector, role, required = false) {
    const image = card.querySelector(selector);
    const src = image?.getAttribute('src') || '';
    const loaded = Boolean(image && src && image.complete && image.naturalWidth > 0);
    let host = null;
    if (src) {
        try {
            host = new URL(src, window.location.href).hostname;
        } catch (_) {
            host = null;
        }
    }
    return {
        role,
        required,
        hasSource: Boolean(src),
        loaded,
        src: src || null,
        host
    };
}

function logExportMediaAudit(container) {
    const cards = Array.from(container.querySelectorAll('.squad-export-player-card, .squad-export-bench-card'));
    const cardSummaries = [];
    const missingRequired = [];
    const missingOptional = [];

    cards.forEach(card => {
        const isBenchCard = card.classList.contains('squad-export-bench-card');
        const playerId = card.dataset.playerId || null;
        const roleStatuses = [
            getExportCardRoleStatus(card, isBenchCard ? '.bench-card-bg' : '.preview-card-bg', 'card-bg', true),
            getExportCardRoleStatus(card, isBenchCard ? '.bench-card-player-img' : '.preview-card-player-img', 'player-img', true),
            getExportCardRoleStatus(card, isBenchCard ? '.bench-card-flag-nation' : '.preview-card-flag-nation', 'nation-flag'),
            getExportCardRoleStatus(card, isBenchCard ? '.bench-card-flag-club' : '.preview-card-flag-club', 'club-flag'),
            getExportCardRoleStatus(card, isBenchCard ? '.bench-card-flag-league' : '.preview-card-flag-league', 'league-flag')
        ];
        cardSummaries.push({
            playerId,
            cardType: isBenchCard ? 'bench' : 'starter',
            roles: roleStatuses.map(status => ({
                role: status.role,
                required: status.required,
                hasSource: status.hasSource,
                loaded: status.loaded,
                host: status.host
            }))
        });

        roleStatuses.forEach(status => {
            if (status.hasSource && status.loaded) return;
            const issue = {
                playerId,
                role: status.role,
                hasSource: status.hasSource,
                loaded: status.loaded,
                src: status.src,
                host: status.host
            };
            if (status.required) {
                missingRequired.push(issue);
            } else if (status.hasSource) {
                missingOptional.push(issue);
            }
        });
    });

    console.info('[EXPORT][MEDIA_AUDIT]', {
        cardCount: cards.length,
        requiredMissing: missingRequired.length,
        optionalMissing: missingOptional.length,
        cards: cardSummaries
    });
    if (missingRequired.length) {
        console.warn('[EXPORT][MEDIA_AUDIT] Required media missing', missingRequired);
    } else {
        console.info('[EXPORT][MEDIA_AUDIT] Required media ready for all cards');
    }
    if (missingOptional.length) {
        console.warn('[EXPORT][MEDIA_AUDIT] Optional media missing', missingOptional);
    }

    return { missingRequired, missingOptional };
}

function getExportCardImages(container) {
    return Array.from(container.querySelectorAll(
        '.preview-card-bg, .preview-card-player-img, .preview-card-flag-nation, .preview-card-flag-club, .preview-card-flag-league, .bench-card-bg, .bench-card-player-img, .bench-card-flag-nation, .bench-card-flag-club, .bench-card-flag-league'
    ));
}

function getMissingImages(images) {
    return images.filter(img => {
        const role = img.dataset.imageRole || '';
        const isRequiredRole = role === 'card-bg' || role === 'player-img';
        const src = img.getAttribute('src');
        if (!src || img.style.display === 'none') return isRequiredRole;
        return !(img.complete && img.naturalWidth > 0);
    });
}

async function retryMissingImages(images) {
    if (!images.length) return;
    const retryStamp = Date.now();

    await Promise.all(images.map(img => {
        const src = img.getAttribute('src');
        if (!src || src.startsWith('data:') || src.startsWith('blob:')) return Promise.resolve();
        try {
            const host = new URL(src, window.location.href).hostname;
            if (/renderz\.app$/i.test(host)) {
                console.warn('[EXPORT][RETRY_SKIP_CORS]', {
                    role: img.dataset.imageRole || 'unknown',
                    playerId: img.dataset.playerId || img.closest('[data-player-id]')?.dataset.playerId || null,
                    host
                });
                return Promise.resolve();
            }
        } catch (_) {
            // ignore invalid URLs and let retry proceed
        }
        return new Promise(resolve => {
            let settled = false;
            const onDone = (status) => {
                if (settled) return;
                settled = true;
                clearTimeout(timeoutId);
                img.removeEventListener('load', onLoad);
                img.removeEventListener('error', onError);
                if (status === 'timeout') {
                    console.warn('[EXPORT][RETRY_TIMEOUT]', {
                        role: img.dataset.imageRole || 'unknown',
                        playerId: img.dataset.playerId || img.closest('[data-player-id]')?.dataset.playerId || null,
                        src
                    });
                }
                resolve();
            };
            const onLoad = () => onDone('load');
            const onError = () => onDone('error');
            const timeoutId = setTimeout(() => onDone('timeout'), 4000);
            img.addEventListener('load', onLoad);
            img.addEventListener('error', onError);
            const separator = src.includes('?') ? '&' : '?';
            img.src = `${src}${separator}retry=${retryStamp}`;
        });
    }));
}

function repairMissingExportImages(images) {
    let repairedCount = 0;
    const guaranteedFallbackByRole = {
        'card-bg': EXPORT_FALLBACK_CARD_URL,
        'player-img': EXPORT_FALLBACK_PLAYER_URL,
        'nation-flag': EXPORT_FALLBACK_FLAG_URL,
        'club-flag': EXPORT_FALLBACK_FLAG_URL,
        'league-flag': EXPORT_FALLBACK_FLAG_URL
    };

    images.forEach(img => {
        const role = img.dataset.imageRole || '';
        const playerId = img.dataset.playerId || img.closest('[data-player-id]')?.dataset.playerId || null;
        if (!playerId || !role) return;

        const sources = collectExportPlayerAssetSources(playerId, null);
        const replacementByRole = {
            'card-bg': sources.cardBg,
            'player-img': sources.playerImg,
            'nation-flag': sources.nationFlag,
            'club-flag': sources.clubFlag,
            'league-flag': sources.leagueFlag
        };
        const replacement = replacementByRole[role];
        const currentSrc = img.getAttribute('src') || '';
        if (replacement && currentSrc !== replacement) {
            setExportImageSource(img, replacement, role, playerId);
            repairedCount += 1;
            console.warn('[EXPORT][REPAIR] Replaced missing media', {
                playerId,
                role,
                replacement
            });
            return;
        }

        const guaranteedFallback = guaranteedFallbackByRole[role];
        if (!guaranteedFallback || currentSrc === guaranteedFallback) return;

        setExportImageSource(img, guaranteedFallback, role, playerId);
        repairedCount += 1;
        console.warn('[EXPORT][REPAIR] Applied guaranteed fallback media', {
            playerId,
            role
        });

    });

    return repairedCount;
}

async function ensureExportImagesReady(container) {
    await waitForImages(container);
    let cardImages = getExportCardImages(container);
    let missing = getMissingImages(cardImages);

    if (missing.length) {
        console.warn('[EXPORT] Missing media before retry', missing.map(img => ({
            role: img.dataset.imageRole || 'unknown',
            playerId: img.dataset.playerId || img.closest('[data-player-id]')?.dataset.playerId || null,
            src: img.getAttribute('src')
        })));
    }

    if (missing.length) {
        await retryMissingImages(missing);
        await waitForImages(container);
        cardImages = getExportCardImages(container);
        missing = getMissingImages(cardImages);
    }

    if (missing.length) {
        const repairedCount = repairMissingExportImages(missing);
        if (repairedCount > 0) {
            await waitForImages(container);
            cardImages = getExportCardImages(container);
            missing = getMissingImages(cardImages);
        }
    }

    if (missing.length) {
        console.warn('[EXPORT] Media still missing after repair pipeline', missing.map(img => ({
            role: img.dataset.imageRole || 'unknown',
            playerId: img.dataset.playerId || img.closest('[data-player-id]')?.dataset.playerId || null,
            src: img.getAttribute('src')
        })));
    } else {
        console.info('[EXPORT] All export media ready for capture');
    }

    return logExportMediaAudit(container);
}

function waitForImages(container, options = {}) {
    const images = Array.from(container.querySelectorAll('img'));
    if (!images.length) return Promise.resolve();
    const perImageTimeoutMs = Number.isFinite(options.perImageTimeoutMs) ? options.perImageTimeoutMs : 5000;

    return Promise.all(images.map(img => {
        if (img.complete) {
            if (img.naturalWidth <= 0 && img.getAttribute('src')) {
                console.warn('[EXPORT][IMG_COMPLETE_ERROR]', {
                    role: img.dataset.imageRole || 'unknown',
                    playerId: img.dataset.playerId || img.closest('[data-player-id]')?.dataset.playerId || null,
                    src: img.getAttribute('src')
                });
            }
            return Promise.resolve();
        }
        return new Promise(resolve => {
            let settled = false;
            const onDone = (status) => {
                if (settled) return;
                settled = true;
                clearTimeout(timeoutId);
                img.removeEventListener('load', onLoad);
                img.removeEventListener('error', onError);
                if (status === 'timeout') {
                    console.warn('[EXPORT][IMG_WAIT_TIMEOUT]', {
                        role: img.dataset.imageRole || 'unknown',
                        playerId: img.dataset.playerId || img.closest('[data-player-id]')?.dataset.playerId || null,
                        src: img.getAttribute('src')
                    });
                }
                resolve();
            };
            const onLoad = () => onDone('load');
            const onError = () => onDone('error');
            const timeoutId = setTimeout(() => onDone('timeout'), perImageTimeoutMs);
            img.addEventListener('load', onLoad);
            img.addEventListener('error', onError);
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
    let overlay = null;
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
        overlay = document.createElement('div');
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
            allowTaint: false
        });
        
        // Remove overlay
        squadField.removeChild(overlay);
        overlay = null;
        
        // Download
        const blob = await canvasToBlob(canvas, 'image/png');
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
        
    } catch (error) {
        console.error('❌ Error exporting squad:', error);
    } finally {
        if (overlay && overlay.isConnected) {
            overlay.remove();
        }
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
