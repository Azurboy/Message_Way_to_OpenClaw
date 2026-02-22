"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const FAVORITES_KEY = "dailybit_favorites";
const MIGRATED_KEY = "dailybit_favorites_migrated";

export interface FavoriteArticle {
  id: string;
  title: string;
  url: string;
  feed_title: string;
  summary_zh: string;
  savedAt: string;
}

// Shared auth state so we don't create multiple subscriptions
let cachedUser: User | null | undefined = undefined;
const listeners = new Set<(u: User | null) => void>();
let fetchingUser = false;

function useSupabaseUser() {
  const [user, setUser] = useState<User | null>(
    cachedUser === undefined ? null : cachedUser
  );
  const [ready, setReady] = useState(cachedUser !== undefined);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    if (cachedUser === undefined && !fetchingUser) {
      fetchingUser = true;
      supabase.auth
        .getUser()
        .then(({ data }) => {
          fetchingUser = false;
          cachedUser = data.user;
          if (!cancelled) {
            setUser(data.user);
            setReady(true);
          }
          listeners.forEach((fn) => fn(data.user));
        })
        .catch(() => {
          fetchingUser = false;
          cachedUser = null;
          if (!cancelled) {
            setUser(null);
            setReady(true);
          }
        });
    }

    const handler = (u: User | null) => {
      if (!cancelled) {
        setUser(u);
        setReady(true);
      }
    };
    listeners.add(handler);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      // Only notify if user actually changed (avoid infinite re-render loops)
      if (newUser?.id !== cachedUser?.id) {
        cachedUser = newUser;
        listeners.forEach((fn) => fn(cachedUser!));
      }
    });

    return () => {
      cancelled = true;
      listeners.delete(handler);
      subscription.unsubscribe();
    };
  }, []);

  return { user, ready };
}

function mapRow(row: Record<string, string | null>): FavoriteArticle {
  return {
    id: row.article_id ?? "",
    title: row.article_title ?? "",
    url: row.article_url ?? "",
    feed_title: row.feed_title ?? "",
    summary_zh: row.summary_zh ?? "",
    savedAt: row.saved_at ?? new Date().toISOString(),
  };
}

export function useFavorites() {
  const { user, ready: authReady } = useSupabaseUser();
  const [favorites, setFavorites] = useState<FavoriteArticle[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const migratedRef = useRef(false);

  // Load favorites: Supabase if logged in, localStorage otherwise
  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;

    if (user) {
      const supabase = createClient();
      Promise.resolve(
        supabase
          .from("favorites")
          .select("article_id, article_title, article_url, feed_title, summary_zh, saved_at")
          .eq("user_id", user.id)
          .order("saved_at", { ascending: false })
      ).then(({ data }) => {
          if (cancelled) return;
          if (data) setFavorites(data.map(mapRow));
          setIsLoaded(true);

          // Migrate localStorage favorites on first login
          if (!migratedRef.current && !localStorage.getItem(MIGRATED_KEY)) {
            migratedRef.current = true;
            const stored = localStorage.getItem(FAVORITES_KEY);
            if (stored) {
              try {
                const local: FavoriteArticle[] = JSON.parse(stored);
                if (local.length > 0) {
                  const rows = local.map((f) => ({
                    user_id: user.id,
                    article_id: f.id,
                    article_title: f.title,
                    article_url: f.url,
                    feed_title: f.feed_title,
                    summary_zh: f.summary_zh,
                    saved_at: f.savedAt,
                  }));
                  Promise.resolve(
                    supabase
                      .from("favorites")
                      .upsert(rows, { onConflict: "user_id,article_id" })
                  ).then(() => {
                      if (cancelled) return;
                      localStorage.setItem(MIGRATED_KEY, "1");
                      localStorage.removeItem(FAVORITES_KEY);
                      // Reload merged list
                      Promise.resolve(
                        supabase
                          .from("favorites")
                          .select("article_id, article_title, article_url, feed_title, summary_zh, saved_at")
                          .eq("user_id", user.id)
                          .order("saved_at", { ascending: false })
                      ).then(({ data: merged }) => {
                          if (!cancelled && merged) setFavorites(merged.map(mapRow));
                        }).catch(() => {});
                    }).catch(() => {});
                }
              } catch {
                // Ignore malformed localStorage
              }
            }
          }
        })
        .catch(() => {
          if (!cancelled) setIsLoaded(true);
        });
    } else {
      // Not logged in — use localStorage
      const stored = localStorage.getItem(FAVORITES_KEY);
      if (stored) {
        try {
          setFavorites(JSON.parse(stored));
        } catch {
          setFavorites([]);
        }
      }
      setIsLoaded(true);
    }

    return () => {
      cancelled = true;
    };
  }, [user?.id, authReady]);

  // Save to localStorage when not logged in
  useEffect(() => {
    if (isLoaded && !user) {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    }
  }, [favorites, isLoaded, user?.id]);

  const addFavorite = useCallback(
    (article: Omit<FavoriteArticle, "savedAt">) => {
      const savedAt = new Date().toISOString();

      setFavorites((prev) => {
        if (prev.some((f) => f.id === article.id)) return prev;
        return [...prev, { ...article, savedAt }];
      });

      if (user) {
        const supabase = createClient();
        Promise.resolve(
          supabase
            .from("favorites")
            .upsert(
              {
                user_id: user.id,
                article_id: article.id,
                article_title: article.title,
                article_url: article.url,
                feed_title: article.feed_title,
                summary_zh: article.summary_zh,
                saved_at: savedAt,
              },
              { onConflict: "user_id,article_id" }
            )
        ).then(() => {}).catch(() => {});
      }
    },
    [user]
  );

  const removeFavorite = useCallback(
    (id: string) => {
      setFavorites((prev) => prev.filter((f) => f.id !== id));

      if (user) {
        const supabase = createClient();
        Promise.resolve(
          supabase
            .from("favorites")
            .delete()
            .eq("user_id", user.id)
            .eq("article_id", id)
        ).then(() => {}).catch(() => {});
      }
    },
    [user]
  );

  const isFavorite = useCallback(
    (id: string) => favorites.some((f) => f.id === id),
    [favorites]
  );

  return { favorites, addFavorite, removeFavorite, isFavorite, isLoaded };
}
