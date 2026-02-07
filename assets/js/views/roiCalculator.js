// FC Market Pro - ROI Calculator Modal
// Handles investment ROI calculations with beautiful modal UI

/**
 * Open ROI Calculator Modal
 */
function openROIModal() {
  const modal = document.getElementById('roi-calculator-modal');
  if (modal) {
    modal.style.display = 'flex';
    // Focus on buying price input
    setTimeout(() => {
      document.getElementById('roi-buying-price')?.focus();
    }, 100);
  }
}

/**
 * Close ROI Calculator Modal
 */
function closeROIModal() {
  const modal = document.getElementById('roi-calculator-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

/**
 * Calculate ROI and display results
 */
function calculateROIModal() {
  const buyingPrice = parseFloat(document.getElementById('roi-buying-price')?.value) || 0;
  const sellingPrice = parseFloat(document.getElementById('roi-selling-price')?.value) || 0;
  const quantity = parseInt(document.getElementById('roi-quantity')?.value) || 1;
  const taxRate = parseFloat(document.getElementById('roi-tax-rate')?.value) || 10;

  // Validation
  if (buyingPrice <= 0) {
    document.getElementById('roi-buying-price').focus();
    return;
  }

  if (sellingPrice <= 0) {
    document.getElementById('roi-selling-price').focus();
    return;
  }

  if (quantity <= 0) {
    return;
  }

  if (taxRate < 0 || taxRate > 100) {
    return;
  }

  // Calculate metrics
  const totalInvestment = buyingPrice * quantity;
  const totalRevenue = sellingPrice * quantity;
  const grossProfit = totalRevenue - totalInvestment;
  const taxAmount = totalRevenue * (taxRate / 100);
  const netProfit = grossProfit - taxAmount;
  const roiPercent = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;

  // Update results display
  document.getElementById('roi-result-tax').textContent = formatPrice(taxAmount);
  document.getElementById('roi-result-profit').textContent = formatPrice(netProfit);
  document.getElementById('roi-result-roi-percent').textContent = roiPercent.toFixed(2) + '%';

  // Show results section with animation
  const resultsSection = document.getElementById('roi-results-section');
  if (resultsSection) {
    resultsSection.style.display = 'block';
  }

  // Change profit color based on positive/negative
  const profitElement = document.getElementById('roi-result-profit');
  if (netProfit < 0) {
    profitElement.style.color = '#ff6b9d';
  } else if (netProfit === 0) {
    profitElement.style.color = '#a0aec0';
  } else {
    profitElement.style.color = '#4ade80';
  }

  // Change ROI% color based on value
  const roiElement = document.getElementById('roi-result-roi-percent');
  if (roiPercent < 0) {
    roiElement.style.color = '#ff6b9d';
  } else if (roiPercent === 0) {
    roiElement.style.color = '#a0aec0';
  } else {
    roiElement.style.color = '#ffd700';
  }

}

/**
 * Reset ROI Calculator
 */
function resetROIModal() {
  document.getElementById('roi-buying-price').value = '';
  document.getElementById('roi-selling-price').value = '';
  document.getElementById('roi-quantity').value = '1';
  document.getElementById('roi-tax-rate').value = '10';

  const resultsSection = document.getElementById('roi-results-section');
  if (resultsSection) {
    resultsSection.style.display = 'none';
  }

  document.getElementById('roi-buying-price').focus();
}

// Initialize event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Allow Enter key to calculate in all ROI inputs
  ['roi-buying-price', 'roi-selling-price', 'roi-quantity', 'roi-tax-rate'].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          calculateROIModal();
        }
      });
    }
  });

  // Close modal when clicking outside
  const modal = document.getElementById('roi-calculator-modal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        closeROIModal();
      }
    });
  }

  // Allow Tab navigation in the form
  const taxRateInput = document.getElementById('roi-tax-rate');
  if (taxRateInput) {
    taxRateInput.addEventListener('keydown', function(e) {
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        document.querySelector('.roi-calculate-btn')?.focus();
      }
    });
  }
});
