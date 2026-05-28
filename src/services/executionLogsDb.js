const DB_NAME = 'debugra-execution-logs';
const DB_VERSION = 1;
const STORE_NAME = 'logs';

/**
 * Open the IndexedDB database.
 * Returns a promise resolving to the IDBDatabase instance.
 */
function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open execution logs IndexedDB');
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

/**
 * Add a new code execution log to IndexedDB.
 * @param {Object} log - The log entry object
 * @returns {Promise<number>} - Resolves with the new log's ID
 */
export async function addExecutionLog(log) {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add({
        ...log,
        timestamp: Date.now(),
      });

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error adding execution log:', error);
    throw error;
  }
}

/**
 * Retrieve all execution logs, sorted chronologically descending (newest first).
 * @returns {Promise<Array>} - Resolves to an array of log entries
 */
export async function getExecutionLogs() {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result || [];
        // Sort chronologically descending
        results.sort((a, b) => b.timestamp - a.timestamp);
        resolve(results);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error fetching execution logs:', error);
    return [];
  }
}

/**
 * Delete a single execution log by its auto-incremented ID.
 * @param {number} id - The log entry ID
 * @returns {Promise<void>}
 */
export async function deleteExecutionLog(id) {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error deleting execution log:', error);
    throw error;
  }
}

/**
 * Delete all execution logs (clear the history timeline).
 * @returns {Promise<void>}
 */
export async function clearExecutionLogs() {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error clearing execution logs:', error);
    throw error;
  }
}
