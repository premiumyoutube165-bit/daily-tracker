// Main Application Scaffolder and Routing Engine

import { SessionsModule } from './modules/sessions.js';
import { ChecklistModule } from './modules/checklist.js';
import { CalculatorsModule } from './modules/calculators.js';
import { ReportsModule } from './modules/reports.js';

const App = {
  activeView: 'sessions',
  modules: {
    sessions: SessionsModule,
    checklist: ChecklistModule,
    calculators: CalculatorsModule,
    reports: ReportsModule
  },

  init() {
    this.setupRouter();
    this.setupNetworkStatus();
    
    // Load initial view
    this.switchView('sessions');
  },

  setupRouter() {
    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const targetView = item.getAttribute('data-view');
        if (targetView && targetView !== this.activeView) {
          this.switchView(targetView);
        }
      });
    });
  },

  switchView(viewName) {
    // 1. Teardown active module if it has a cleanup routine
    const prevModule = this.modules[this.activeView];
    if (prevModule && typeof prevModule.destroy === 'function') {
      prevModule.destroy();
    }

    // Remove active class from old nav item and view container
    const oldNavItem = document.querySelector(`.nav-item[data-view="${this.activeView}"]`);
    const oldContainer = document.getElementById(`view-${this.activeView}`);
    if (oldNavItem) oldNavItem.classList.remove('active');
    if (oldContainer) oldContainer.classList.remove('active');

    // Update state
    this.activeView = viewName;

    // 2. Setup new module
    const newNavItem = document.querySelector(`.nav-item[data-view="${viewName}"]`);
    const newContainer = document.getElementById(`view-${viewName}`);
    if (newNavItem) newNavItem.classList.add('active');
    if (newContainer) {
      newContainer.classList.add('active');
      
      // Initialize view logic
      const activeModule = this.modules[viewName];
      if (activeModule && typeof activeModule.init === 'function') {
        activeModule.init(newContainer);
      }
    }
  },

  setupNetworkStatus() {
    const updateStatus = () => {
      const badge = document.getElementById('app-connection-status');
      if (!badge) return;

      if (navigator.onLine) {
        badge.textContent = 'Offline Ready';
        badge.className = 'badge badge-success';
        badge.style.borderColor = 'rgba(16, 185, 129, 0.2)';
      } else {
        badge.textContent = 'Offline Mode';
        badge.className = 'badge badge-danger';
        badge.style.borderColor = 'rgba(244, 63, 94, 0.2)';
      }
    };

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    
    // Initial check
    updateStatus();
  }
};

// Start the app on DOM Load
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
