// Checklist Module: Trading Checklist with Dynamic Circular Progress Gauge

import { StorageService } from '../services/storage.js';

const DEFAULT_RULES = [
  { id: 1, text: 'Confirm global session alignment (Tokyo/London/NY)', checked: false, isDefault: true },
  { id: 2, text: 'Verify daily calendar events and high-impact logs', checked: false, isDefault: true },
  { id: 3, text: 'Identify key horizontal levels and parameters', checked: false, isDefault: true },
  { id: 4, text: 'Validate directional alignment on multiple timelines', checked: false, isDefault: true },
  { id: 5, text: 'Calculate scale size and parameters', checked: false, isDefault: true },
  { id: 6, text: 'Define exact exit targets (Limit & Target levels)', checked: false, isDefault: true }
];

export const ChecklistModule = {
  container: null,
  items: [],

  init(container) {
    this.container = container;
    this.loadChecklist();
    this.render();
  },

  loadChecklist() {
    const saved = StorageService.getChecklist();
    if (saved && saved.length > 0) {
      this.items = saved;
    } else {
      this.items = [...DEFAULT_RULES];
      StorageService.saveChecklist(this.items);
    }
  },

  saveChecklist() {
    StorageService.saveChecklist(this.items);
    this.updateProgress();
  },

  render() {
    this.container.innerHTML = `
      <div class="card">
        <div class="card-title">Setup Verification</div>
        <div class="card-subtitle">Complete your plan before execution</div>

        <div class="progress-ring-container">
          <svg width="120" height="120" viewBox="0 0 120 120" class="progress-ring-svg">
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="transparent"
              stroke="rgba(255, 255, 255, 0.05)"
              stroke-width="10"
            />
            <circle
              id="checklist-progress-ring"
              cx="60"
              cy="60"
              r="50"
              fill="transparent"
              stroke="var(--primary)"
              stroke-width="10"
              stroke-dasharray="314.16"
              stroke-dashoffset="314.16"
              stroke-linecap="round"
              transform="rotate(-90 60 60)"
              style="transition: stroke-dashoffset 0.35s cubic-bezier(0.4, 0, 0.2, 1); filter: drop-shadow(0 0 4px var(--primary-glow));"
            />
          </svg>
          <div class="progress-ring-text">
            <span class="progress-ring-percentage" id="checklist-pct">0%</span>
            <span class="progress-ring-subtext" id="checklist-ratio">0/0 Rules</span>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">
          <span>Daily Action Rules</span>
          <button class="btn btn-secondary btn-small" id="btn-reset-checklist">Reset</button>
        </div>
        
        <div class="checklist-list" id="checklist-items-container">
          <!-- Items will be injected here -->
        </div>

        <div class="add-rule-block mt-8">
          <input type="text" class="form-control" id="input-new-rule" placeholder="Add custom rule..." maxlength="80">
          <button class="btn btn-primary btn-small" id="btn-add-rule">+</button>
        </div>
      </div>
    `;

    this.renderItems();
    this.setupListeners();
    this.updateProgress();
  },

  renderItems() {
    const listContainer = document.getElementById('checklist-items-container');
    if (!listContainer) return;

    if (this.items.length === 0) {
      listContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.9rem; padding: 12px 0;">No checklist rules added.</div>`;
      return;
    }

    listContainer.innerHTML = this.items.map(item => `
      <div class="checklist-item ${item.checked ? 'checked' : ''}" data-id="${item.id}">
        <div class="checkbox-container">
          <svg viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          </svg>
        </div>
        <div class="checklist-text">${this.escapeHTML(item.text)}</div>
        <button class="checklist-delete" title="Delete rule">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    `).join('');

    // Attach individual list item event listeners
    listContainer.querySelectorAll('.checklist-item').forEach(itemEl => {
      const itemId = parseInt(itemEl.getAttribute('data-id'));
      
      // Toggle check
      itemEl.querySelector('.checkbox-container').addEventListener('click', () => {
        this.toggleItem(itemId);
      });

      // Delete custom item
      const delBtn = itemEl.querySelector('.checklist-delete');
      if (delBtn) {
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.deleteItem(itemId);
        });
      }
    });
  },

  setupListeners() {
    // Add rule
    const inputEl = document.getElementById('input-new-rule');
    const addBtn = document.getElementById('btn-add-rule');
    const addRuleAction = () => {
      const text = inputEl.value.trim();
      if (text) {
        this.addItem(text);
        inputEl.value = '';
      }
    };

    if (addBtn && inputEl) {
      addBtn.addEventListener('click', addRuleAction);
      inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addRuleAction();
      });
    }

    // Reset daily checklist
    const resetBtn = document.getElementById('btn-reset-checklist');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetChecklist();
      });
    }
  },

  toggleItem(id) {
    this.items = this.items.map(item => {
      if (item.id === id) {
        return { ...item, checked: !item.checked };
      }
      return item;
    });
    this.saveChecklist();
    this.renderItems();
  },

  addItem(text) {
    const newItem = {
      id: Date.now(),
      text: text,
      checked: false,
      isDefault: false
    };
    this.items.push(newItem);
    this.saveChecklist();
    this.renderItems();
  },

  deleteItem(id) {
    this.items = this.items.filter(item => item.id !== id);
    this.saveChecklist();
    this.renderItems();
  },

  resetChecklist() {
    this.items = this.items.map(item => ({ ...item, checked: false }));
    this.saveChecklist();
    this.renderItems();
  },

  updateProgress() {
    const total = this.items.length;
    const checked = this.items.filter(item => item.checked).length;
    const percentage = total > 0 ? Math.round((checked / total) * 100) : 0;

    // Update Text
    const pctEl = document.getElementById('checklist-pct');
    const ratioEl = document.getElementById('checklist-ratio');
    if (pctEl) pctEl.textContent = `${percentage}%`;
    if (ratioEl) ratioEl.textContent = `${checked}/${total} Rules`;

    // Update circular SVG gauge
    const ring = document.getElementById('checklist-progress-ring');
    if (ring) {
      const radius = 50;
      const circumference = 2 * Math.PI * radius; // 314.16
      const offset = circumference - (percentage / 100) * circumference;
      ring.style.strokeDashoffset = offset;
      
      // Update color dynamic based on completion
      if (percentage === 100) {
        ring.style.stroke = 'var(--success)';
      } else if (percentage >= 50) {
        ring.style.stroke = 'var(--primary)';
      } else {
        ring.style.stroke = 'var(--secondary)';
      }
    }
  },

  escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }
};
