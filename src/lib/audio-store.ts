/**
 * Client-side recording storage — IndexedDB, keyed by sermon-note id.
 *
 * Sermon-length audio (30-60 MB) can't go in the database, so recordings
 * live on the device that made them. Every function fails soft (resolves
 * null/false) so private-browsing modes and storage-denied contexts just
 * degrade to the in-memory recording instead of throwing.
 *
 * Note: browsers (notably iOS Safari) may evict IndexedDB for sites that
 * haven't been used in a while — the UI labels Download as the durable path.
 */

export interface StoredRecording {
  blob: Blob;
  mimeType: string;
  /** Seconds, measured by our own timer — Chrome webm blobs report Infinity. */
  duration: number;
  createdAt: number;
}

const DB_NAME = "parakletos-audio";
const STORE = "recordings";

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === "undefined") {
      resolve(null);
      return;
    }
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function putRecording(
  noteId: string,
  recording: StoredRecording
): Promise<boolean> {
  const db = await openDb();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(recording, noteId);
      tx.oncomplete = () => {
        db.close();
        resolve(true);
      };
      tx.onerror = () => {
        db.close();
        resolve(false);
      };
      tx.onabort = () => {
        db.close();
        resolve(false);
      };
    } catch {
      db.close();
      resolve(false);
    }
  });
}

export async function getRecording(noteId: string): Promise<StoredRecording | null> {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(noteId);
      req.onsuccess = () => {
        db.close();
        const value = req.result as StoredRecording | undefined;
        resolve(value && value.blob instanceof Blob ? value : null);
      };
      req.onerror = () => {
        db.close();
        resolve(null);
      };
    } catch {
      db.close();
      resolve(null);
    }
  });
}

export async function deleteRecording(noteId: string): Promise<void> {
  const db = await openDb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(noteId);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
      tx.onabort = () => {
        db.close();
        resolve();
      };
    } catch {
      db.close();
      resolve();
    }
  });
}
