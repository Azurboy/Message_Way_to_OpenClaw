"use client";

import { useState, useEffect, useCallback } from "react";

const FAVORITES_KEY = "xinqidong_favorites";

export interface FavoriteArticle {
  id: string;
  title: string;
  url: string;
  feed_title: string;
  summary_zh: string;
  savedAt: string;
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteArticle[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch {
        setFavorites([]);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage when favorites change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    }
  }, [favorites, isLoaded]);

  const addFavorite = useCallback((article: Omit<FavoriteArticle, "savedAt">) => {
    setFavorites((prev) => {
      if (prev.some((f) => f.id === article.id)) return prev;
      return [...prev, { ...article, savedAt: new Date().toISOString() }];
    });
  }, []);

  const removeFavorite = useCallback((id: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const isFavorite = useCallback(
    (id: string) => favorites.some((f) => f.id === id),
    [favorites]
  );

  return { favorites, addFavorite, removeFavorite, isFavorite, isLoaded };
}
