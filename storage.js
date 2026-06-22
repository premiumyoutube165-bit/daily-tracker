// Storage Service for Offline-First Capability

const DB_NAME = 'TradingCompanionDB';
const DB_VERSION = 1;
const STORE_REPORTS = 'reports';

// Initialize IndexedDB
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Database error:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_REPORTS)) {
        db.createObjectStore(STORE_REPORTS, { keyPath: 'id' });
      }
    };
  });
};

export const StorageService = {
  // LocalStorage Helpers (Checklist, Settings)
  getChecklist() {
    try {
      const data = localStorage.getItem('trading_checklist');
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Error reading checklist from LocalStorage:', e);
      return null;
    }
  },

  saveChecklist(items) {
    try {
      localStorage.setItem('trading_checklist', JSON.stringify(items));
      return true;
    } catch (e) {
      console.error('Error saving checklist to LocalStorage:', e);
      return false;
    }
  },

  // IndexedDB Helpers (CSV Reports - large datasets)
  async saveReport(report) {
    try {
      const db = await initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_REPORTS], 'readwrite');
        const store = transaction.objectStore(STORE_REPORTS);
        const request = store.put(report);

        request.onsuccess = () => resolve(true);
        request.onerror = (e) => reject(e.target.error);
      });
    } catch (e) {
      console.error('IndexedDB saveReport error:', e);
      return false;
    }
  },

  async getLatestReport() {
    try {
      const db = await initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_REPORTS], 'readonly');
        const store = transaction.objectStore(STORE_REPORTS);
        const request = store.getAll(); // Get all reports

        request.onsuccess = (e) => {
          const reports = e.target.result;
          if (reports && reports.length > 0) {
            // Sort by creation time to get the latest
            reports.sort((a, b) => b.timestamp - a.timestamp);
            resolve(reports[0]);
          } else {
            resolve(null);
          }
        };
        request.onerror = (e) => reject(e.target.error);
      });
    } catch (e) {
      console.error('IndexedDB getLatestReport error:', e);
      return null;
    }
  },

  async deleteReport(id) {
    try {
      const db = await initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_REPORTS], 'readwrite');
        const store = transaction.objectStore(STORE_REPORTS);
        const request = store.delete(id);

        request.onsuccess = () => resolve(true);
        request.onerror = (e) => reject(e.target.error);
      });
    } catch (e) {
      console.error('IndexedDB deleteReport error:', e);
      return false;
    }
  }
};
