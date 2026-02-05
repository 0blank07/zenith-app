// assets/js/data/supabase-provider.js
if (typeof window.supabaseClient === 'undefined') {
    window.supabaseClient = supabase.createClient(window.ENV.SUPABASE_URL, window.ENV.SUPABASE_ANON_KEY);
}

window.supabaseProvider = {
  async syncPrices(players) {
    console.log("[DEBUG] syncPrices started for:", players.length, "players");
    if (!players || players.length === 0) return players;

    // 🔥 FIX: Use 'player_id' instead of 'id' to match your API data structure
    const playerIds = players
        .map(p => p.player_id) 
        .filter(id => id != null);

    console.log("[CRITICAL DEBUG] Sending these IDs to Supabase:", playerIds);

    if (playerIds.length === 0) {
        console.error("[ERROR] No valid player_ids found in the player list!");
        return players;
    }

    try {
      const { data, error } = await window.supabaseClient
        .from('price_snapshots')
        .select('asset_id, price0, price1, price2, price3, price4, price5')
        .in('asset_id', playerIds)
        .order('captured_at', { ascending: false });

      if (error) throw error;

      console.log(`[DEBUG] Supabase returned ${data?.length || 0} matches.`);

      players.forEach(zenithPlayer => {
        const snapshot = data.find(
          s => String(s.asset_id) === String(zenithPlayer.player_id)
        );

        if (snapshot) {
          const rank = parseInt(zenithPlayer.rank || 0);
          const priceKey = `price${rank}`;

          zenithPlayer.price = snapshot[priceKey] ?? null;
        } else {
          zenithPlayer.price = null;
        }
      });

      return players;
    } catch (err) {
      console.error('[DEBUG] Supabase Sync Fail:', err);
      return players;
    }
  },
  async fetchPriceHistory({ playerId, startTime, endTime, priceColumn }) {
    if (!playerId && playerId !== 0) {
      throw new Error('playerId is required');
    }
    if (!priceColumn || !/^price[0-5]$/.test(priceColumn)) {
      throw new Error('Valid priceColumn is required');
    }
    if (!window.supabaseClient) {
      throw new Error('Supabase client not available');
    }

    console.log('[PRICE HISTORY] Supabase query params:', { playerId, startTime, endTime, priceColumn });

    let query = window.supabaseClient
      .from('price_snapshots')
      .select(`asset_id, captured_at, ${priceColumn}`)
      .eq('asset_id', playerId)
      .order('captured_at', { ascending: true });

    if (startTime) {
      query = query.gte('captured_at', startTime);
    }
    if (endTime) {
      query = query.lte('captured_at', endTime);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  }
};
