# Squad Builder Save/Load Feature - Integration Instructions

## 📋 Overview
This feature allows users to save and load their squad configurations using browser localStorage.

## ✅ What Was Added

### New File Created
- **`assets/js/views/squadBuilder-saveload.js`** - Contains all save/load functions

### Functions Included

1. **`saveSquad()`** - Saves current squad to localStorage
   - Captures all 11 field players
   - Captures all 7 bench players  
   - Saves formation, badges, OVR, value, and theme
   - Stores as JSON in `localStorage.savedSquad_main`

2. **`loadSquad()`** - Loads saved squad from localStorage
   - Restores all players to exact positions
   - Restores formation and badges
   - Restores field theme
   - Shows save timestamp

3. **`calculateValue()`** - Calculates total squad value
4. **`formatPrice()`** - Formats prices (1.5M, 250K)
5. **`hasSavedSquad()`** - Checks if a save exists
6. **`deleteSavedSquad()`** - Deletes saved squad

## 🔧 Integration Steps

### Step 1: Include the Script in Your HTML

Find your HTML file that loads the Squad Builder (likely `index.html` or similar) and add this script tag **AFTER** `squadBuilder.js`:

```html
<!-- Existing squad builder script -->
<script src="assets/js/views/squadBuilder.js"></script>

<!-- NEW: Add this line -->
<script src="assets/js/views/squadBuilder-saveload.js"></script>
```

### Step 2: Update Save/Load Buttons

Find the Save and Load buttons in your Squad Builder modal HTML and update them:

**Find this (or similar):**
```html
<button class="squad-action-btn save-btn">
    💾 Save Squad
</button>

<button class="squad-action-btn load-btn">
    📥 Load Squad
</button>
```

**Replace with:**
```html
<button class="squad-action-btn save-btn" onclick="saveSquad()">
    💾 Save Squad
</button>

<button class="squad-action-btn load-btn" onclick="loadSquad()">
    📥 Load Squad
</button>
```

### Step 3: Test the Feature

1. **Build a squad:**
   - Add players to field positions
   - Add players to bench
   - Select a formation
   - Activate badges (optional)

2. **Click "💾 Save Squad"**
   - Should see success toast: "✅ Squad saved successfully!"

3. **Clear the squad or refresh page**
   - Remove all players manually OR refresh browser

4. **Click "📥 Load Squad"**
   - Should see toast: "✅ Squad loaded (Saved: [timestamp])"
   - All players should return to exact positions
   - Formation, badges, theme restored

## 📦 What Gets Saved

```javascript
{
  version: '1.0',
  timestamp: '2026-01-30T07:37:32.000Z',
  name: 'My Squad',
  formationId: '4-3-3',
  starters: {                    // 11 field positions
    'GK': 'player_id_123',
    'LB': 'player_id_456',
    // ... etc
  },
  bench: [                       // 7 bench slots
    'player_id_789',
    'player_id_101',
    // ...
  ],
  badges: {                      // Badge status
    badge1: true,
    badge2: false,
    badge3: true
  },
  teamOVR: 85,                   // Calculated OVR
  teamValue: 15000000,           // Total squad value
  fieldTheme: 'stadium-blue'     // Selected theme
}
```

## 🐛 Debugging

If save/load doesn't work, check browser console for:

```javascript
// Success messages:
✅ Squad saved successfully: {...}
📥 Loading squad: {...}
✅ Squad loaded successfully

// Error messages:
❌ Error saving squad: [error]
❌ Failed to save squad
⚠️ No saved squad found
```

## 🔍 Browser localStorage Check

Open browser DevTools → Application/Storage → Local Storage → Check for key:
```
savedSquad_main
```

## ⚠️ Important Notes

1. **Data is stored locally** - Saved squads are per-browser, per-device
2. **Only ONE squad can be saved** - Saving overwrites previous save
3. **Clearing browser data** - Will delete saved squads
4. **Players must exist in database** - If a saved player is removed from database, load may fail for that player

## 🚀 Future Enhancements (Optional)

- Multiple save slots (savedSquad_1, savedSquad_2, etc.)
- Export/Import squad as JSON file
- Share squad via URL
- Auto-save feature
- Cloud sync

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify script is loaded: Check Network tab for `squadBuilder-saveload.js`
3. Test in different browser
4. Clear localStorage and try again

---

**Created:** January 30, 2026  
**Branch:** `feature/squad-save-load`  
**Status:** Ready for testing ✅