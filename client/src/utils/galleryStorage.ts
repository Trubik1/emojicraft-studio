import type { SavedEmoji, EmojiConfig } from '../types';

const STORAGE_KEY = 'emojicraft_saved_creations_v1';

export function getSavedGallery(): SavedEmoji[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load gallery', e);
    return [];
  }
}

export function saveEmojiToGallery(character: string, baseShape: any, previewUrl: string, config: EmojiConfig): SavedEmoji {
  try {
    const existing = getSavedGallery();
    const newItem: SavedEmoji = {
      id: `emoji_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now(),
      character,
      baseShape,
      previewUrl,
      config,
    };
    const updated = [newItem, ...existing.slice(0, 39)]; // Keep up to 40 items
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newItem;
  } catch (e) {
    console.error('Failed to save to gallery', e);
    return {
      id: String(Date.now()),
      createdAt: Date.now(),
      character,
      baseShape,
      previewUrl,
      config,
    };
  }
}

export function removeEmojiFromGallery(id: string): SavedEmoji[] {
  try {
    const existing = getSavedGallery();
    const updated = existing.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to remove from gallery', e);
    return [];
  }
}
