import { useState, useCallback } from 'react';

const STORAGE_KEY = 'facepay_recent_faces';
const MAX_RECENT = 10;

export function useRecentFaces() {
  const [recent, setRecent] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch { return []; }
  });

  const addRecent = useCallback((face) => {
    setRecent((prev) => {
      const filtered = prev.filter((f) => f.id !== face.id);
      const next = [{ id: face.id, name: face.name, photo: face.photo_url || face.photo, price: face.price }, ...filtered].slice(0, MAX_RECENT);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { recent, addRecent };
}
