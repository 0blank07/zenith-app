# Squad Export Feature - Integration Instructions

## 📋 Overview
Export squad formation as a PNG image that users can download to their PC.

## ✅ What Was Added

### New File Created
- **`assets/js/views/squadBuilder-export.js`** - Screenshot export functionality

### Functions Included

1. **`exportSquad()`** - Basic export (just the squad field)
2. **`exportSquadWithInfo()`** - Advanced export with overlay (Squad name, OVR, Formation)
3. **`isExportAvailable()`** - Check if export library is loaded

## 🔧 Integration Steps

### Step 1: Add html2canvas Library

Add this script in your `<head>` or before closing `</body>` tag in your HTML file:

```html
<!-- Add html2canvas library for screenshot capture -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
```

### Step 2: Include Export Script

Add the export script **AFTER** squadBuilder.js:

```html
<script src="assets/js/views/squadBuilder.js"></script>
<script src="assets/js/views/squadBuilder-saveload.js"></script>
<script src="assets/js/views/squadBuilder-export.js"></script>  <!-- ADD THIS -->
```

### Step 3: Add Export Button

Add the Export button **BEFORE** the Badges button in your Squad Builder header:

#### Option A: Simple Export Button
```html
<button class="squad-action-btn export-btn" onclick="exportSquad()" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
    📸 Export
</button>
```

#### Option B: Export with Info Overlay
```html
<button class="squad-action-btn export-btn" onclick="exportSquadWithInfo()" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
    📸 Export
</button>
```

### Step 4: Complete Button Layout

Your complete button layout should look like:

```html
<div class="squad-header">
    <!-- Left side: Squad name -->
    <input type="text" id="squad-name-input" placeholder="My Squad" />
    
    <!-- Center: Stats -->
    <div class="squad-stats">
        <div>OVR: <span id="squad-ovr">0</span></div>
        <div>VALUE: <span id="squad-value">Free</span></div>
    </div>
    
    <!-- Right side: Action buttons -->
    <div class="squad-actions">
        <!-- Formation dropdown -->
        <select id="formation-select">
            <option value="4-3-3">4-3-3</option>
            <!-- ... other formations ... -->
        </select>
        
        <!-- Export Button (NEW) -->
        <button class="squad-action-btn export-btn" onclick="exportSquad()" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            📸 Export
        </button>
        
        <!-- Badges Button -->
        <button class="squad-action-btn badges-btn" onclick="openBadgesModal()">
            🏅 Badges
        </button>
        
        <!-- Save Button -->
        <button class="squad-action-btn save-btn" onclick="saveSquad()">
            💾 Save
        </button>
        
        <!-- Load Button -->
        <button class="squad-action-btn load-btn" onclick="loadSquad()">
            📥 Load
        </button>
    </div>
</div>
```

## 🎨 Optional: Custom Styling

Add custom styles for the export button:

```css
.export-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s ease;
}

.export-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.export-btn:active {
    transform: translateY(0);
}
```

## 📦 How It Works

1. **User clicks "Export" button**
2. **html2canvas captures** the squad field element as canvas
3. **Canvas converts** to PNG image blob
4. **Browser downloads** image automatically
5. **Filename format:** `My_Squad_2026-01-30T08-13-47.png`

## 📝 Export Options

### Basic Export (`exportSquad()`)
- Captures only the squad formation field
- Clean screenshot without extra info
- Best for sharing just the squad layout

### Advanced Export (`exportSquadWithInfo()`)
- Captures squad field + overlay with:
  - Squad name
  - Formation (e.g., 4-3-3)
  - Team OVR
  - "Created with Zenith FCM" watermark
- Best for sharing on social media

## 🐛 Troubleshooting

### Export button doesn't work
1. Check browser console for errors
2. Verify html2canvas library is loaded:
   ```javascript
   console.log(typeof html2canvas); // Should output "function"
   ```
3. Make sure squad field has `id="squad-field"`

### Image quality is poor
- Adjust `scale` option in squadBuilder-export.js:
  ```javascript
  scale: 3, // Higher = better quality (but slower)
  ```

### Images don't include player cards
- Player card images may be CORS-blocked
- Make sure `useCORS: true` is set in capture options
- Consider hosting player images on same domain

### Export is slow
- Reduce `scale` from 2 to 1
- Optimize image sizes
- Capture smaller area

## 🚀 Advanced: Custom Export Sizes

Modify capture options in `squadBuilder-export.js`:

```javascript
const captureOptions = {
    backgroundColor: '#0a1628',
    scale: 2,              // Resolution multiplier
    width: 1920,           // Custom width
    height: 1080,          // Custom height
    useCORS: true,
    allowTaint: true
};
```

## 📱 Mobile Considerations

- Export works on mobile browsers
- Downloaded file goes to device Downloads folder
- May require "Download" permission on Android

## ⚠️ Important Notes

1. **Browser Compatibility:**
   - Chrome/Edge: ✅ Full support
   - Firefox: ✅ Full support
   - Safari: ✅ Full support
   - IE11: ❌ Not supported

2. **File Size:**
   - Typical export: 500KB - 2MB
   - Higher scale = larger file

3. **Privacy:**
   - All processing happens client-side
   - No data sent to server
   - Image saved locally only

## 🎉 Example Export Result

```
Filename: My_Squad_2026-01-30T08-13-47.png
Format: PNG
Size: ~1.2MB
Resolution: 2048x1536 (with scale: 2)
Content: Squad formation with all player cards visible
```

---

**Created:** January 30, 2026  
**Branch:** `feature/squad-save-load`  
**Dependencies:** html2canvas v1.4.1  
**Status:** Ready for testing ✅