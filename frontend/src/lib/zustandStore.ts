import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  email: string;
  name: string;
  avatar: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

interface LibraryEntry {
  id: number;
  user_id: number;
  book_id: number;
  shelf: string;
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
  cover?: string;
  genres?: string[];
  genre?: string[];
}

interface UserPreferences {
  preferred_genres: string[];
  preferred_languages: string[];
  preferred_authors: string[];
  onboarding_completed: boolean;
}

interface AppState {
  // User state
  user: User | null;
  token: string | null;
  
  // Library state
  library: LibraryEntry[];
  
  // Preferences state
  preferences: UserPreferences | null;
  onboarded: boolean;
  
  // UI state
  darkMode: boolean;
  toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>;
  
  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  
  addToLibrary: (book: BookLike, shelf: string) => void;
  removeFromLibrary: (bookId: number) => void;
  updateEntry: (bookId: number, updates: Partial<LibraryEntry>) => void;
  updateLibraryEntry: (bookId: number, updates: Partial<LibraryEntry>) => void;
  
  setPreferences: (preferences: UserPreferences) => void;
  setOnboarded: (onboarded: boolean) => void;
  
  toggleDark: () => void;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      library: [],
      preferences: null,
      onboarded: false,
      darkMode: false,
      toasts: [],
      
      // User actions
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      
      login: async (email, password) => {
        try {
          const response = await fetch('http://localhost:8000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          
          if (response.ok) {
            const data = await response.json();
            set({ 
              token: data.access_token,
              user: null // Will be fetched separately
            });
            
            // Fetch user profile
            const userResponse = await fetch('http://localhost:8000/auth/me', {
              headers: { 
                'Authorization': `Bearer ${data.access_token}`,
                'Content-Type': 'application/json'
              },
            });
            
            if (userResponse.ok) {
              const userData = await userResponse.json();
              set({ user: userData });
            }
            
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
          const response = await fetch('http://localhost:8000/auth/register', {
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
          onboarded: false
        });
      },
      
      // Library actions
      addToLibrary: (book, shelf) => {
        const { library, user } = get();
        const existing = library.find(e => e.book_id === book.id);
        
        if (existing) return;
        
        const newEntry: LibraryEntry = {
          id: Date.now(),
          user_id: user?.id || 0,
          book_id: book.id,
          shelf: shelf === 'Completed' ? 'Completed' : shelf,
          progress: shelf === 'Completed' ? 100 : 0,
          rating: 0,
          notes: '',
          added_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          book
        };
        
        set({ library: [...library, newEntry] });
        get().addToast('Book added to library!', 'success');
      },
      
      removeFromLibrary: (bookId) => {
        const { library } = get();
        set({ library: library.filter(e => e.book_id !== bookId) });
        get().addToast('Book removed from library', 'info');
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
        get().addToast('Library entry updated!', 'success');
      },
      updateLibraryEntry: (bookId, updates) => get().updateEntry(bookId, updates),
      
      // Preferences actions
      setPreferences: (preferences) => set({ preferences }),
      setOnboarded: (onboarded) => set({ onboarded }),
      
      // UI actions
      toggleDark: () => set({ darkMode: !get().darkMode }),
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
        library: state.library,
        preferences: state.preferences,
        onboarded: state.onboarded,
        darkMode: state.darkMode,
      }),
    }
  )
);
