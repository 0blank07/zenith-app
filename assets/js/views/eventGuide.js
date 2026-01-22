// FC Market Pro - Event Guide (Redesigned)
// Professional multi-section guide with proper styling and navigation

// ========================================
// INITIALIZATION FUNCTION
// ========================================
window.initEventGuide = function() {
    console.log('[EVENT GUIDE] Initializing...');
    
    const container = document.getElementById('event-guide-view');
    if (!container) {
        console.error('[EVENT GUIDE] Container #event-guide-view not found');
        return;
    }
    
    // Create the main container for event guide
    container.innerHTML = `
        <div id="event-guide-container" style="padding: 24px; max-width: 1400px; margin: 0 auto;">
            <!-- Events will be loaded here -->
        </div>
    `;
    
    // Load the event grid
    loadEventGuide();
    
    console.log('[EVENT GUIDE] Loaded successfully');
};


// ========================================
// EVENT DATA
// ========================================
const fcEvents = [
  {
    id: 1,
    title: "A Nation's Story: Japan Event Guide",
    image: "https://via.placeholder.com/400x250/8B5CF6/ffffff?text=Japan+Event",
    description: "FC Mobile 26 A Nation's Story: Japan event is live now. This event highlight Japanese football and give players the chance to earn tokens, shards...",
    duration: "14 Days",
    color: "#8B5CF6"
  },
  {
    id: 2,
    title: "Footyverse Event Guide",
    image: "https://via.placeholder.com/400x250/3B82F6/ffffff?text=Footyverse+Event",
    description: "The Footyverse event is now live in EA Sports FC Mobile! Inspired by the idea of parallel football worlds, this event introduces unique versions of...",
    duration: "28 Days",
    color: "#3B82F6",
    sections: [
      {
        id: "overview",
        title: "🌌 Overview",
        type: "text",
        content: "Footyverse introduces the concept of alternate football realities — versions of well-known players performing roles or positions that differ from their real-world reputation. Throughout the event, you will collect Footyverse Tickets, Tokens, and Shards to unlock players, complete evolution paths, and explore a variety of themed universes ('Verses')."
      },
      {
        id: "main-chapter",
        title: "📖 Main Chapter Overview",
        type: "text",
        content: "Each day, claim your Footyverse Ticket and choose one of three Navigators: Ruud Gullit, Eden Hazard, or Bastian Schweinsteiger. After selecting a Navigator, you may play one match/skill game among the daily options. Completing the activity grants 100 Footyverse Tokens and unlocks that Navigator's personal universe chapter for the day."
      },
      {
        id: "navigators",
        title: "🎮 Navigators",
        type: "tabs",
        tabs: [
          {
            name: "Ruud Gullit",
            rows: [
              { match: "G-988", objective: "Assist with Dutch players (2x)", reward: "100 Tokens" },
              { match: "G-990", objective: "Complete 10 tackles", reward: "200 Tokens + Hidden Ticket" },
              { match: "G-992", objective: "Score using any Footyverse player (Skill)", reward: "100 Gems + Ticket" }
            ]
          },
          {
            name: "Eden Hazard",
            rows: [
              { match: "H-015", objective: "Complete 15 dribbles + Score with Chelsea players", reward: "Gems + Tokens + Hidden Ticket" },
              { match: "H-016", objective: "Assist 3 Goals with Footyverse Players", reward: "100 Tokens + Ticket" },
              { match: "H-0205", objective: "Complete 10 dribbles (Skill)", reward: "100 Gems + Ticket" }
            ]
          },
          {
            name: "Bastian Schweinsteiger",
            rows: [
              { match: "SCH-212", objective: "Score with Bayern + Win Match", reward: "Tokens, Gems, Hidden Ticket, Curve Magic Key" },
              { match: "SCH-206", objective: "Pass completion & German scoring", reward: "Tokens, Ticket, Gems, Rank Ups" },
              { match: "SCH-208", objective: "German scoring + match victory", reward: "Tokens, Gems, Rank Ups" }
            ]
          }
        ]
      },
      {
        id: "daily-strategy",
        title: "💡 Daily Strategy",
        type: "highlight",
        content: "Best daily grind options:",
        items: [
          "H-0205 (Hazard Skill Game) - Yields 1 Curve Magic Key + 100 Rank Ups",
          "SCH-212 (Schweinsteiger Match 1) - Yields 1 Curve Magic Key + 100 Rank Ups",
          "Consistent rewards: Tokens, Gems, Keys"
        ]
      },
      {
        id: "main-quests",
        title: "✅ Main Quests",
        type: "table",
        table: {
          headers: ["Objective", "Reward"],
          rows: [
            ["Travel with Gullit 5 times", "60 Footyverse Shards"],
            ["Travel with Hazard 5 times", "109–113 OVR Footyverse Player"],
            ["Travel with Schweinsteiger 5 times", "7,500 Gems"],
            ["Obtain 3 Curve Magic Keys", "108 OVR CM Beckham + 5,000,000 Coins"]
          ]
        }
      },
      {
        id: "verses",
        title: "🌍 Verses Guide",
        type: "accordion",
        items: [
          {
            title: "Becks' Verse",
            content: "Progress Beckham from 87 OVR → 113 OVR",
            table: {
              headers: ["Step", "Requirement", "Reward"],
              rows: [
                ["1", "500 Tokens", "87 Beckham"],
                ["2", "300 Tokens + 1 Curve Magic", "108 Beckham"],
                ["3", "50 Shards + 2 Curve Magic", "110 Beckham"],
                ["4", "300 Shards + 3 Curve Magic", "111 Beckham"],
                ["5", "1,100 Shards + 4 Curve Magic", "113 Beckham"]
              ]
            }
          },
          {
            title: "Treasure Verse",
            content: "Spend 5,300 Tokens to clear a linear reward path."
          },
          {
            title: "Swap Verse (Rarest)",
            content: "Exchange a Footyverse player for a different one of the same OVR. Result card becomes untradeable."
          },
          {
            title: "Shapeshifter Verse",
            content: "Players appear in unusual positions. Exchanges require Footyverse players + Shards."
          },
          {
            title: "Gemini Verse",
            content: "Player look-alike conversion system; swap between paired cards using Tokens/Shards."
          },
          {
            title: "Kinverse",
            content: "Focus on football siblings (Timbers, Højlunds, Kluiverts, Zidanes)."
          },
          {
            title: "Morphoverse",
            content: "Switch between alternative card art versions. Cost: 500 Tokens per appearance swap."
          },
          {
            title: "Claw Machine Verse",
            content: "Unlocks October 30, 2025 - Gamble-style reward grabs with slipping chance."
          }
        ]
      },
      {
        id: "supply",
        title: "🏪 Supply Depot & Gallery",
        type: "text",
        content: "Spend Tokens for resources and untradeable Footyverse players. Clearing full rows unlocks further tiers and a final 111 OVR reward. Exchange unwanted Footyverse players to obtain Shards, then redeem weekly player rotations."
      },
      {
        id: "star-pass",
        title: "⭐ Star Pass",
        type: "text",
        content: "Progress the Footyverse Pass through gameplay to earn Shards and a final reward of 111 OVR CM Lampard (Rank 4)."
      },
      {
        id: "featured",
        title: "🔄 Featured Players",
        type: "text",
        content: "Players rotate with market refreshes every 2 hours. Refresh time determines when their listing values update in the market."
      }
    ]
  },
  {
    id: 3,
    title: "Trivia Time: LaLiga Guide",
    image: "https://via.placeholder.com/400x250/EF4444/ffffff?text=LaLiga+Trivia",
    description: "FC Mobile 26 Trivia Time: Laliga is out now! Dive into this exciting new feature on Extra Time...",
    duration: "21 Days",
    color: "#EF4444"
  },
  {
    id: 4,
    title: "CONMEBOL Libertadores Event",
    image: "https://via.placeholder.com/400x250/F59E0B/ffffff?text=Libertadores",
    description: "Experience the glory of CONMEBOL Libertadores in EA Sports FC Mobile...",
    duration: "30 Days",
    color: "#F59E0B"
  },
  {
    id: 5,
    title: "Ballon d'Or Event Guide",
    image: "https://via.placeholder.com/400x250/FCD34D/ffffff?text=Ballon+Or",
    description: "Participate in the prestigious Ballon d'Or event and showcase your elite players...",
    duration: "14 Days",
    color: "#FCD34D"
  },
  {
    id: 6,
    title: "2nd Anniversary Event",
    image: "https://via.placeholder.com/400x250/10B981/ffffff?text=2nd+Anniversary",
    description: "Celebrate 2 years of FC Mobile! This milestone event brings incredible rewards...",
    duration: "35 Days",
    color: "#10B981"
  }
];


// ========================================
// LOAD EVENT GUIDE VIEW (MAIN GRID)
// ========================================
function loadEventGuide() {
  const container = document.getElementById('event-guide-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  // Create grid container
  const gridContainer = document.createElement('div');
  gridContainer.className = 'events-grid-premium';
  
  // Loop through events and create cards
  fcEvents.forEach(event => {
    const eventCard = createPremiumEventCard(event);
    gridContainer.appendChild(eventCard);
  });
  
  container.appendChild(gridContainer);
}


// ========================================
// CREATE PREMIUM EVENT CARD
// ========================================
function createPremiumEventCard(event) {
  const card = document.createElement('div');
  card.className = 'event-card-premium';
  card.style.borderTopColor = event.color;
  
  card.innerHTML = `
    <div class="event-card-image-wrapper">
      <img src="${event.image}" alt="${event.title}" class="event-card-image">
      <div class="event-duration-badge">${event.duration}</div>
    </div>
    <div class="event-card-content-premium">
      <h3 class="event-card-title">${event.title}</h3>
      <p class="event-card-description">${event.description}</p>
      <button class="event-learn-btn-premium" onclick="displayEventDetail(${event.id})">
        Learn More →
      </button>
    </div>
  `;
  
  return card;
}


// ========================================
// DISPLAY DETAILED EVENT VIEW
// ========================================
function displayEventDetail(eventId) {
  const event = fcEvents.find(e => e.id === eventId);
  if (!event) return;
  
  const container = document.getElementById('event-guide-container');
  if (!container) return;
  
  // Check if event has sections
  if (!event.sections) {
    container.innerHTML = `
      <div class="event-detail-view">
        <button class="event-back-btn" onclick="loadEventGuide()">← Back to Events</button>
        <div class="event-simple-detail">
          <img src="${event.image}" alt="${event.title}">
          <h2>${event.title}</h2>
          <p>${event.description}</p>
          <p><em>Detailed guide coming soon...</em></p>
        </div>
      </div>
    `;
    return;
  }
  
  // Build detail view with sidebar and content
  const detailHTML = `
    <div class="event-detail-view">
      <div class="event-detail-header">
        <button class="event-back-btn" onclick="loadEventGuide()">← Back to Events</button>
        <div class="event-header-content">
          <img src="${event.image}" alt="${event.title}" class="event-detail-hero">
          <div class="event-header-info">
            <h1>${event.title}</h1>
            <span class="event-header-duration">📅 ${event.duration}</span>
          </div>
        </div>
      </div>
      
      <div class="event-detail-body">
        <aside class="event-detail-sidebar">
          <h3 class="sidebar-title">Contents</h3>
          <nav class="event-toc">
            ${event.sections.map((section, idx) => `
              <a href="#section-${idx}" class="toc-link" onclick="scrollToSection('section-${idx}', event)">${section.title}</a>
            `).join('')}
          </nav>
        </aside>
        
        <main class="event-detail-content">
          ${event.sections.map((section, idx) => renderEventSection(section, idx)).join('')}
        </main>
      </div>
    </div>
  `;
  
  container.innerHTML = detailHTML;
  
  // Add click handlers for accordion
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', function() {
      this.classList.toggle('active');
      this.nextElementSibling.classList.toggle('active');
    });
  });
}


// ========================================
// RENDER INDIVIDUAL EVENT SECTION
// ========================================
function renderEventSection(section, index) {
  let html = `<section class="event-detail-section" id="section-${index}">
    <h2 class="section-title">${section.title}</h2>`;
  
  switch(section.type) {
    case 'text':
      html += `<p class="section-text">${section.content}</p>`;
      break;
      
    case 'highlight':
      html += `
        <div class="highlight-box">
          <p>${section.content}</p>
          <ul class="highlight-list">
            ${section.items.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
      `;
      break;
      
    case 'table':
      html += `
        <div class="table-wrapper">
          <table class="detail-table">
            <thead>
              <tr>
                ${section.table.headers.map(h => `<th>${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${section.table.rows.map((row, idx) => `
                <tr class="${idx % 2 === 0 ? 'even' : 'odd'}">
                  ${row.map(cell => `<td>${cell}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
      break;
      
    case 'tabs':
      html += `
        <div class="tabs-container">
          <div class="tab-buttons">
            ${section.tabs.map((tab, idx) => `
              <button class="tab-btn ${idx === 0 ? 'active' : ''}" onclick="switchTab(this)">
                ${tab.name}
              </button>
            `).join('')}
          </div>
          <div class="tab-contents">
            ${section.tabs.map((tab, idx) => `
              <div class="tab-content ${idx === 0 ? 'active' : ''}">
                <div class="table-wrapper">
                  <table class="detail-table">
                    <thead>
                      <tr>
                        <th>Match</th>
                        <th>Objective</th>
                        <th>Reward</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${tab.rows.map((row, ridx) => `
                        <tr class="${ridx % 2 === 0 ? 'even' : 'odd'}">
                          <td><strong>${row.match}</strong></td>
                          <td>${row.objective}</td>
                          <td class="reward-cell">${row.reward}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      break;
      
    case 'accordion':
      html += `
        <div class="accordion-container">
          ${section.items.map((item, idx) => `
            <div class="accordion-item">
              <button class="accordion-header">
                <span>${item.title}</span>
                <span class="accordion-icon">+</span>
              </button>
              <div class="accordion-body">
                <p>${item.content}</p>
                ${item.table ? `
                  <div class="table-wrapper">
                    <table class="detail-table">
                      <thead>
                        <tr>
                          ${item.table.headers.map(h => `<th>${h}</th>`).join('')}
                        </tr>
                      </thead>
                      <tbody>
                        ${item.table.rows.map((row, ridx) => `
                          <tr class="${ridx % 2 === 0 ? 'even' : 'odd'}">
                            ${row.map(cell => `<td>${cell}</td>`).join('')}
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `;
      break;
  }
  
  html += '</section>';
  return html;
}


// ========================================
// TAB SWITCHING FUNCTION
// ========================================
function switchTab(button) {
  const container = button.parentElement.parentElement;
  
  // Remove active class from all buttons and contents
  container.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  container.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  
  // Add active class to clicked button and corresponding content
  button.classList.add('active');
  const tabIndex = Array.from(button.parentElement.children).indexOf(button);
  container.querySelectorAll('.tab-content')[tabIndex].classList.add('active');
}


// ========================================
// SCROLL TO SECTION FUNCTION
// ========================================
function scrollToSection(sectionId, event) {
  event.preventDefault();
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

console.log('[EVENT GUIDE] Script loaded successfully');
