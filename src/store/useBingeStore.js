import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { pickCategoryStyle } from '../lib/colors'

function makeId() {
  return crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export const useBingeStore = create(
  persist(
    (set, get) => ({
      categories: [],
      movies: [],

      // ---- Categories ----
      addCategory(name) {
        const trimmed = name.trim()
        if (!trimmed) return
        const { color, angle } = pickCategoryStyle(get().categories)
        const category = {
          id: makeId(),
          name: trimmed,
          color,
          angle,
          createdAt: Date.now(),
        }
        set((state) => ({ categories: [...state.categories, category] }))
        return category
      },

      renameCategory(id, name) {
        const trimmed = name.trim()
        if (!trimmed) return
        set((state) => ({
          categories: state.categories.map((c) => (c.id === id ? { ...c, name: trimmed } : c)),
        }))
      },

      deleteCategory(id) {
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
          movies: state.movies.filter((m) => m.categoryId !== id),
        }))
      },

      // ---- Movies ----
      addMovie(categoryId, title) {
        const trimmed = title.trim()
        if (!trimmed) return
        const movie = {
          id: makeId(),
          categoryId,
          title: trimmed,
          rating: null,
          createdAt: Date.now(),
        }
        set((state) => ({ movies: [...state.movies, movie] }))
        return movie
      },

      renameMovie(id, title) {
        const trimmed = title.trim()
        if (!trimmed) return
        set((state) => ({
          movies: state.movies.map((m) => (m.id === id ? { ...m, title: trimmed } : m)),
        }))
      },

      rateMovie(id, rating) {
        set((state) => ({
          movies: state.movies.map((m) => (m.id === id ? { ...m, rating } : m)),
        }))
      },

      deleteMovie(id) {
        set((state) => ({ movies: state.movies.filter((m) => m.id !== id) }))
      },

      // ---- Selectors (plain helpers, not derived state) ----
      moviesByCategory(categoryId) {
        return get().movies.filter((m) => m.categoryId === categoryId)
      },
    }),
    {
      name: 'binge-storage',
    },
  ),
)
