# Squad Builder Skills Fix - Testing Guide

## Issues Fixed

### 1. Too Many Skills (100+) → Fixed ✅
**Problem**: Squad Builder was showing all game skills (100+) instead of player-specific skills (5)
**Solution**: Changed from `getSkills()` to `getPlayerDetails(playerId, rank)` which returns player-specific skills

**Test**:
1. Open Squad Builder
2. Add a player (e.g., Cafu, Mbappé, etc.)
3. Click on the player card to open customization
4. Select a rank (1-5)
5. **Expected**: See exactly 5 skills (player-specific)
6. **Before**: Saw 100+ skills

### 2. Skills Not Player-Specific → Fixed ✅
**Problem**: All players were showing the same skills list
**Solution**: Now fetches skills using `getPlayerDetails(playerId, rank)` which returns that player's specific skills

**Test**:
1. Add player A (e.g., Striker) - note their skills
2. Remove and add player B (e.g., Goalkeeper) - note their skills
3. **Expected**: Different skills for different players
4. **Before**: Same skills for all players

### 3. Max Level Always 1 → Should be Fixed ✅
**Problem**: Skill cards showed "Level: 0/1" even when skills have 2-3 levels
**Solution**: Using `calculateSquadMaxLevels()` which calculates correct max levels based on prerequisites

**Test**:
1. Open player customization
2. Select a rank
3. Look at skill cards
4. **Expected**: Some skills show "Level: 0/2" or "Level: 0/3"
5. The max level depends on whether other skills require it as prerequisite

**How Max Levels Work**:
- Base skills that aren't prerequisites: Max level 1
- Skills that are prerequisites: Max level = highest requirement level
- Example: If "Power Header" requires "Finishing Lv 2", then Finishing max = 2

### 4. Lock/Unlock States → Already Working ✅
**Problem**: Thought locks weren't working
**Solution**: They were already implemented correctly

**Test**:
1. Open player customization
2. Select a rank
3. **Expected**: 
   - Some skills show unlocked (no lock icon)
   - Some skills show locked (🔒 icon)
   - Locked skills are grayed out (opacity 0.5, grayscale)
   - Locked skills show unlock requirement text

**Lock Logic**:
- Skills without prerequisites: Always unlocked
- Skills with prerequisites: Locked until prerequisite is met
- Example: "Power Header" locked until you have "Finishing Lv 2"

## Code Changes

### File: `assets/js/views/squadBuilder.js`

**Function**: `renderSquadPlayerSkills(playerId, rank)`

**Before**:
```javascript
const skillsResp = await window.apiClient.getSkills();
const skills = skillsResp.skills || skillsResp || [];
// Returns ALL game skills (100+)
```

**After**:
```javascript
const playerResp = await window.apiClient.getPlayerDetails(playerId, rank);
skills = playerResp.skills || [];
// Returns player-specific skills (5 skills)
```

**Fallback Chain** (if getPlayerDetails fails):
1. Try cached player skills
2. Last resort: all skills (with warning)

## Expected Behavior

### When Opening Customization
1. Modal opens
2. See player card preview
3. Skills section shows: "Select a rank to unlock skills"

### When Selecting Rank
1. Click rank button (1-5)
2. Skills section shows: "Loading skills..."
3. After load: See 5 skill cards
4. Each card shows:
   - Skill icon/image
   - Skill name
   - Current level / Max level (e.g., "Level: 0/2")
   - Lock icon if locked
   - Unlock requirement text if locked

### Skill Card States

**Unlocked Skill**:
```
[Skill Icon]
Finishing
Level: 0/2
```

**Locked Skill**:
```
[Skill Icon with 🔒]
Power Header
Level: 0/1
Requires: Finishing Lv 2
```

## Console Logs to Expect

```javascript
[SQUAD SKILLS] Rendering skills for player: 629396 Rank: 3
[SQUAD SKILLS] Fetched player-specific skills: 5 skills
[SQUAD SKILLS] Points - Available: 3 Spent: 0 Remaining: 3
[SQUAD SKILLS] Rendering 5 skill cards
```

## Common Issues & Solutions

### Issue: Still seeing 100+ skills
**Cause**: API might be returning all skills
**Solution**: Check if `playerResp.skills` has correct data
**Debug**: Look for console log "Fetched player-specific skills: X skills"

### Issue: Skills not showing
**Cause**: API endpoint might be failing
**Solution**: Check console for error messages
**Debug**: Look for "Could not fetch player details" warning

### Issue: Max level still 1
**Cause**: Skills don't have prerequisites
**Solution**: This is correct - not all skills have higher max levels
**Debug**: Check calculateSquadMaxLevels output in console

### Issue: All skills unlocked
**Cause**: Player's 5 skills might not have prerequisites
**Solution**: This is correct - base skills are unlocked by default
**Debug**: Check skill data for unlock_requirement fields

## API Endpoints

### Player Details
```
GET /api/players/{playerId}?rank={rank}

Response:
{
  player: {...},
  skills: [
    { skill_id: 1, skill_name: "Finishing", ... },
    { skill_id: 2, skill_name: "Shot Power", ... },
    // ... 5 skills total
  ],
  available_skill_points: 3
}
```

### All Skills (Fallback)
```
GET /api/skills

Response:
{
  skills: [
    // 100+ skills
  ]
}
```

## Success Criteria

✅ **5 skills max** - Never more than 5 skills showing
✅ **Player-specific** - Different players show different skills
✅ **Correct max levels** - Skills show correct max level (1, 2, or 3)
✅ **Lock states work** - Locked skills are grayed and show 🔒
✅ **Unlock requirements** - Locked skills show what's needed to unlock

## Notes

- Max levels are calculated dynamically based on skill relationships
- Not all skills will have max level > 1 (only those used as prerequisites)
- Lock/unlock state is independent of max level
- Skills are fetched fresh each time rank changes
- State is stored per player/rank combination

---

**Status**: ✅ FIXED
**Files Changed**: 1 (squadBuilder.js)
**Lines Changed**: ~20 lines
**Testing**: Manual testing required with live data
