import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface User {
  id: number;
  email: string;
  name: string;
  avatar: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  onboarded: boolean;
  created_at: string;
}

interface LibraryEntry {
  id: number;
  user_id: number;
  book_id: number;
  status: string;
  is_favorite: boolean;
  is_bookmarked: boolean;
  progress: number;
  rating: number;
  notes: string;
  added_at: string;
  updated_at: string;
  book: BookLike;
}

interface BookLike {
  id: number;
  title?: string;
  author?: string;
  author_name?: string;
  cover?: string;
  cover_url?: string;
  genres?: string[];
  genre?: string[];
  rating?: number;
  year?: number;
}

interface UserPreferences {
  preferred_genres: string[];
  preferred_languages: string[];
  preferred_authors: string[];
  onboarding_completed: boolean;
}

interface ReadingGoal {
  target_books: number;
  current_books: number;
  target_year: number;
}

interface AppState {
  user: User | null;
  token: string | null;
  library: LibraryEntry[];
  preferences: UserPreferences | null;
  onboarded: boolean;
  darkMode: boolean;
  toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>;
  readingGoal: ReadingGoal | null;

  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;

  addToLibrary: (book: BookLike, status: string) => Promise<void>;
  removeFromLibrary: (bookId: number) => Promise<void>;
  updateEntry: (bookId: number, updates: Partial<LibraryEntry>) => void;
  updateLibraryEntry: (bookId: number, updates: Partial<LibraryEntry>) => void;
  loadLibrary: () => Promise<void>;

  setPreferences: (preferences: UserPreferences) => void;
  setOnboarded: (onboarded: boolean) => void;
  loadPreferences: () => Promise<void>;
  loadReadingGoal: () => Promise<void>;
  updateReadingGoal: (targetBooks: number) => Promise<boolean>;

  toggleDark: () => void;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      library: [],
      preferences: null,
      onboarded: false,
      darkMode: false,
      toasts: [],
      readingGoal: null,

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),

      login: async (email, password) => {
        try {
          const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          if (response.ok) {
            const data = await response.json();
            set({ token: data.access_token, user: null });

            const userResponse = await fetch(`${API_BASE}/auth/me`, {
              headers: {
                'Authorization': `Bearer ${data.access_token}`,
                'Content-Type': 'application/json'
              },
            });

            if (userResponse.ok) {
              const userData = await userResponse.json();
              set({ user: userData });
            }

            get().loadLibrary();
            get().loadPreferences();
            get().loadReadingGoal();
            return true;
          }
          return false;
        } catch (error) {
          console.error('Login error:', error);
          return false;
        }
      },

      register: async (name, email, password) => {
        try {
          const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
          });
          return response.ok;
        } catch (error) {
          console.error('Registration error:', error);
          return false;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          library: [],
          preferences: null,
          onboarded: false,
          readingGoal: null
        });
      },

      refreshUser: async () => {
        const { token } = get();
        if (!token) return;
        try {
          const res = await fetch(`${API_BASE}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (res.ok) {
            const userData = await res.json();
            set({ user: userData });
          }
        } catch (e) {
          console.error('Refresh user error:', e);
        }
      },

      addToLibrary: async (book, status) => {
        const { token } = get();
        if (!token) return;
        try {
          const res = await fetch(`${API_BASE}/libraries/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              book_id: book.id,
              status: status,
              is_favorite: false,
              is_bookmarked: false,
              progress: status === 'completed' ? 100 : 0,
              rating: 0
            })
          });
          if (res.ok) {
            get().loadLibrary();
            get().addToast('Book added to library!', 'success');
          } else {
            const err = await res.json();
            get().addToast(err.detail || 'Failed to add book', 'error');
          }
        } catch (e) {
          get().addToast('Network error', 'error');
        }
      },

      removeFromLibrary: async (bookId) => {
        const { token, library } = get();
        if (!token) return;
        const entry = library.find(e => e.book_id === bookId);
        if (!entry) return;
        try {
          const res = await fetch(`${API_BASE}/libraries/${entry.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            set({ library: library.filter(e => e.book_id !== bookId) });
            get().addToast('Book removed from library', 'info');
          }
        } catch (e) {
          get().addToast('Network error', 'error');
        }
      },

      updateEntry: (bookId, updates) => {
        const { library } = get();
        set({
          library: library.map(entry =>
            entry.book_id === bookId
              ? { ...entry, ...updates, updated_at: new Date().toISOString() }
              : entry
          )
        });
      },

      updateLibraryEntry: (bookId, updates) => get().updateEntry(bookId, updates),

      loadLibrary: async () => {
        const { token } = get();
        if (!token) return;
        try {
          const res = await fetch(`${API_BASE}/libraries/`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const entries = await res.json();
            set({ library: entries });
          }
        } catch (e) {
          console.error('Load library error:', e);
        }
      },

      setPreferences: (preferences) => set({ preferences }),
      setOnboarded: (onboarded) => set({ onboarded }),

      loadPreferences: async () => {
        const { token } = get();
        if (!token) return;
        try {
          const res = await fetch(`${API_BASE}/users/me/preferences`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const prefs = await res.json();
            set({ preferences: prefs, onboarded: prefs.onboarding_completed });
          }
        } catch (e) {
          console.error('Load preferences error:', e);
        }
      },

      loadReadingGoal: async () => {
        const { token } = get();
        if (!token) return;
        try {
          const res = await fetch(`${API_BASE}/users/me/reading-goal`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const goal = await res.json();
            set({ readingGoal: goal });
          }
        } catch (e) {
          console.error('Load reading goal error:', e);
        }
      },

      updateReadingGoal: async (targetBooks) => {
        const { token } = get();
        if (!token) return false;
        try {
          const res = await fetch(`${API_BASE}/users/me/reading-goal`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ target_books: targetBooks })
          });
          if (res.ok) {
            const goal = await res.json();
            set({ readingGoal: goal });
            get().addToast('Reading goal updated successfully! 📚', 'success');
            return true;
          }
          return false;
        } catch (e) {
          console.error('Update reading goal error:', e);
          get().addToast('Failed to update reading goal', 'error');
          return false;
        }
      },

      toggleDark: () => {
        const newMode = !get().darkMode;
        set({ darkMode: newMode });
        if (newMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },

      addToast: (message, type) => {
        const id = Date.now().toString();
        set({ toasts: [...get().toasts, { id, message, type }] });
        setTimeout(() => {
          get().removeToast(id);
        }, 3000);
      },

      removeToast: (id) => {
        set({ toasts: get().toasts.filter(t => t.id !== id) });
      },
    }),
    {
      name: 'litrealm-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        preferences: state.preferences,
        onboarded: state.onboarded,
        darkMode: state.darkMode,
      }),
    }
  )
);
