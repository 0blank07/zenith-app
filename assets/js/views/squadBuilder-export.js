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
        
        // Show loading toast
        if (typeof showToast === 'function') {
            showToast('📸 Capturing squad...', 'info');
        }
        
        // Get the squad field element
        const squadField = document.getElementById('squad-field');
        
        if (!squadField) {
            throw new Error('Squad field not found');
        }
        
        // Check if html2canvas is loaded
        if (typeof html2canvas === 'undefined') {
            throw new Error('html2canvas library not loaded. Please include the library.');
        }
        
        // Get squad container for better context
        const squadContainer = squadField.closest('.squad-container') || squadField;
        
        // Capture options
        const captureOptions = {
            backgroundColor: '#0a1628', // Dark background
            scale: 2, // Higher quality (2x resolution)
            logging: false,
            useCORS: true, // Allow cross-origin images
            allowTaint: true,
            width: squadField.offsetWidth,
            height: squadField.offsetHeight,
            x: 0,
            y: 0
        };
        
        console.log('📸 Capturing with options:', captureOptions);
        
        // Capture the squad field as canvas
        const canvas = await html2canvas(squadField, captureOptions);
        
        console.log('✅ Canvas captured:', canvas.width, 'x', canvas.height);
        
        // Convert canvas to blob
        canvas.toBlob((blob) => {
            if (!blob) {
                throw new Error('Failed to create image blob');
            }
            
            // Create download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            
            // Generate filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const squadName = squadState.name || 'My Squad';
            const filename = `${squadName.replace(/\s+/g, '_')}_${timestamp}.png`;
            
            link.href = url;
            link.download = filename;
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up
            URL.revokeObjectURL(url);
            
            console.log('✅ Squad exported:', filename);
            
            if (typeof showToast === 'function') {
                showToast('✅ Squad exported successfully!', 'success');
            }
        }, 'image/png');
        
    } catch (error) {
        console.error('❌ Error exporting squad:', error);
        
        if (typeof showToast === 'function') {
            showToast(`❌ Export failed: ${error.message}`, 'error');
        }
    }
}

/**
 * Export squad with overlay information (OVR, Formation, etc.)
 * Advanced version with metadata overlay
 */
async function exportSquadWithInfo() {
    try {
        console.log('📸 Starting advanced squad export...');
        
        if (typeof showToast === 'function') {
            showToast('📸 Capturing squad...', 'info');
        }
        
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
            
            if (typeof showToast === 'function') {
                showToast('✅ Squad exported with info!', 'success');
            }
        }, 'image/png');
        
    } catch (error) {
        console.error('❌ Error exporting squad:', error);
        
        if (typeof showToast === 'function') {
            showToast(`❌ Export failed: ${error.message}`, 'error');
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