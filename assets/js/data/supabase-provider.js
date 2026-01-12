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
        .select('asset_id, price0')
        .in('asset_id', playerIds)
        .order('captured_at', { ascending: false });

      if (error) throw error;

      console.log(`[DEBUG] Supabase returned ${data?.length || 0} matches.`);

      players.forEach(zenithPlayer => {
        // 🔥 FIX: Match Supabase 'asset_id' against Zenith 'player_id'
        const snapshot = data.find(s => String(s.asset_id) === String(zenithPlayer.player_id));
        
        if (snapshot) {
          zenithPlayer.price = snapshot.price0;
        } else {
          zenithPlayer.price = null;
        }
      });

      return players;
    } catch (err) {
      console.error('[DEBUG] Supabase Sync Fail:', err);
      return players;
    }
  }
};