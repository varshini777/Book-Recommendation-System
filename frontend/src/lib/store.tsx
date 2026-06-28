'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Book, GENRES } from './data';

export interface LibraryEntry {
  book: Book;
  shelf: string;
  progress: number;
  rating: number;
  notes: string;
  addedAt: string;
}

export interface UserPrefs {
  genres: string[];
  languages: string[];
  authors: string[];
}

export interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'info' | 'error';
}

export interface User {
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'user';
}

interface UserStats {
  totalBooks: number;
  genreCount: Record<string, number>;
  languageCount: Record<string, number>;
  avgProgress: number;
}

interface AppState {
  darkMode: boolean;
  toggleDark: () => void;
  library: LibraryEntry[];
  addToLibrary: (book: Book, shelf?: string) => void;
  removeFromLibrary: (bookId: number) => void;
  updateEntry: (bookId: number, update: Partial<LibraryEntry>) => void;
  getEntry: (bookId: number) => LibraryEntry | undefined;
  prefs: UserPrefs;
  setPrefs: (p: UserPrefs) => void;
  onboarded: boolean;
  setOnboarded: (v: boolean) => void;
  user: User | null;
  setUser: (u: User | null) => void;
  loginUser: (email: string, password: string) => boolean;
  logout: () => void;
  registerUser: (name: string, email: string, password: string) => boolean;
  getAllUsers: () => User[];
  getUserStats: () => UserStats;
  getOverallStats: () => UserStats;
  toasts: ToastMessage[];
  addToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  removeToast: (id: number) => void;
}

const AppContext = createContext<AppState>({} as AppState);

export function AppProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState(false);
  const [library, setLibrary] = useState<LibraryEntry[]>([]);
  const [prefs, setPrefsState] = useState<UserPrefs>({ genres: [], languages: [], authors: [] });
  const [onboarded, setOnboardedState] = useState(false);
  const [user, setUserState] = useState<User | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Helpers for persistent users list
  const getStoredUsers = () => {
    try {
      return JSON.parse(localStorage.getItem('users') || '[]') as {
        name: string;
        email: string;
        password: string;
        avatar: string;
        role: 'admin' | 'user';
      }[];
    } catch {
      return [];
    }
  };
  const setStoredUsers = (users: any) => localStorage.setItem('users', JSON.stringify(users));

  // Hydrate on mount
  useEffect(() => {
    const dark = localStorage.getItem('dark') === 'true';
    let lib: LibraryEntry[] = [];
    let p: UserPrefs = { genres: [], languages: [], authors: [] };
    let u: User | null = null;
    try { lib = JSON.parse(localStorage.getItem('library') || '[]'); } catch {}
    try { p = JSON.parse(localStorage.getItem('prefs') || '{"genres":[],"languages":[],"authors":[]}'); } catch {}
    try { u = JSON.parse(localStorage.getItem('user') || 'null'); } catch {}
    const ob = localStorage.getItem('onboarded') === 'true';
    setDarkMode(dark);
    setLibrary(lib);
    setPrefsState(p);
    setOnboardedState(ob);
    setUserState(u);
    if (dark) document.documentElement.classList.add('dark');
  }, []);

  const addToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => removeToast(id), 4000);
  };
  const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('dark', String(next));
    document.documentElement.classList.toggle('dark', next);
    addToast(next ? 'Dark mode enabled 🌙' : 'Light mode enabled ☀️', 'info');
  };

  // Library functions (unchanged logic) --------------------------------------
  const addToLibrary = (book: Book, shelf = 'Want to Read') => {
    setLibrary(prev => {
      if (prev.find(e => e.book.id === book.id)) return prev;
      const progress = shelf === 'Completed' ? 100 : 0;
      const next = [...prev, { book, shelf, progress, rating: 0, notes: '', addedAt: new Date().toISOString() }];
      localStorage.setItem('library', JSON.stringify(next));
      addToast(`"${book.title}" added to ${shelf} shelf! 🗂️`);
      return next;
    });
  };
  const removeFromLibrary = (bookId: number) => {
    const title = library.find(e => e.book.id === bookId)?.book.title || 'Book';
    setLibrary(prev => {
      const next = prev.filter(e => e.book.id !== bookId);
      localStorage.setItem('library', JSON.stringify(next));
      addToast(`"${title}" removed from library.`, 'info');
      return next;
    });
  };
  const updateEntry = (bookId: number, update: Partial<LibraryEntry>) => {
    setLibrary(prev => {
      const next = prev.map(e => {
        if (e.book.id === bookId) {
          const updated = { ...e, ...update };
          // Smart logics – same as earlier version
          if (update.shelf && update.shelf === 'Completed' && e.shelf !== 'Completed') updated.progress = 100;
          else if (update.shelf && e.shelf === 'Completed' && update.shelf !== 'Completed') {
            updated.progress = update.shelf === 'Currently Reading' ? 90 : 0;
          }
          if (update.progress === 100 && e.progress !== 100) updated.shelf = 'Completed';
          else if (update.progress && update.progress < 100 && updated.shelf === 'Completed') updated.shelf = 'Currently Reading';
          return updated;
        }
        return e;
      });
      localStorage.setItem('library', JSON.stringify(next));
      return next;
    });
  };
  const getEntry = (bookId: number) => library.find(e => e.book.id === bookId);

  const setPrefs = (p: UserPrefs) => {
    setPrefsState(p);
    localStorage.setItem('prefs', JSON.stringify(p));
  };
  const setOnboarded = (v: boolean) => {
    setOnboardedState(v);
    localStorage.setItem('onboarded', String(v));
  };
  const setUser = (u: User | null) => {
    setUserState(u);
    localStorage.setItem('user', JSON.stringify(u));
  };

  // ---------- Authentication -------------------------------------------------
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    addToast('Logged out', 'info');
  };
  const registerUser = (name: string, email: string, password: string): boolean => {
    const users = getStoredUsers();
    if (users.find(u => u.email === email)) {
      addToast('Email already registered', 'error');
      return false;
    }
    // First registered user becomes admin (convenient for demo)
    const role: 'admin' | 'user' = users.length === 0 ? 'admin' : 'user';
    users.push({ name, email, password, avatar: '👤', role });
    setStoredUsers(users);
    addToast('Registration successful', 'success');
    return true;
  };

  const loginUser = (email: string, password: string): boolean => {
    const users = getStoredUsers();
    const found = users.find(u => u.email === email && u.password === password);
    if (found) {
      const { name, avatar, role } = found;
      setUser({ name, email, avatar, role });
      addToast('Login successful', 'success');
      return true;
    }
    addToast('Invalid credentials', 'error');
    return false;
  };

  const getAllUsers = () => getStoredUsers();

  const getUserStats = (): UserStats => {
    const total = library.length;
    const genreCount: Record<string, number> = {};
    const languageCount: Record<string, number> = {};
    let progressSum = 0;
    library.forEach(entry => {
      const genre = (entry.book as any).genre;
      const lang = (entry.book as any).language;
      if (genre) genreCount[genre] = (genreCount[genre] || 0) + 1;
      if (lang) languageCount[lang] = (languageCount[lang] || 0) + 1;
      progressSum += entry.progress;
    });
    const avgProgress = total ? progressSum / total : 0;
    return { totalBooks: total, genreCount, languageCount, avgProgress };
  };

  const getOverallStats = (): UserStats => {
    const users = getStoredUsers();
    let allEntries: any[] = [];
    users.forEach(u => {
      const libKey = `library_${u.email}`;
      try {
        const lib = JSON.parse(localStorage.getItem(libKey) || '[]');
        allEntries = allEntries.concat(lib);
      } catch {}
    });
    const total = allEntries.length;
    const genreCount: Record<string, number> = {};
    const languageCount: Record<string, number> = {};
    let progressSum = 0;
    allEntries.forEach(entry => {
      const genre = (entry.book as any).genre;
      const lang = (entry.book as any).language;
      if (genre) genreCount[genre] = (genreCount[genre] || 0) + 1;
      if (lang) languageCount[lang] = (languageCount[lang] || 0) + 1;
      progressSum += entry.progress;
    });
    const avgProgress = total ? progressSum / total : 0;
    return { totalBooks: total, genreCount, languageCount, avgProgress };
  };

  return (
    <AppContext.Provider
      value={{
        darkMode,
        toggleDark,
        library,
        addToLibrary,
        removeFromLibrary,
        updateEntry,
        getEntry,
        prefs,
        setPrefs,
        onboarded,
        setOnboarded,
        user,
        setUser,
        loginUser,
        logout,
        registerUser,
        getAllUsers,
        getUserStats,
        getOverallStats,
        toasts,
        addToast,
        removeToast,
      }}>
      {children}
      {/* Toast overlay */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 10000,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '350px',
          width: '100%',
        }}
      >
        {toasts.map(t => (
          <div
            key={t.id}
            style={{
              background: 'var(--navy)',
              color: 'white',
              padding: '16px 20px',
              borderRadius: '16px',
              boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
              borderLeft:
                t.type === 'success'
                  ? '5px solid var(--gold)'
                  : t.type === 'error'
                  ? '5px solid #dc2626'
                  : '5px solid var(--burgundy-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              fontSize: '0.88rem',
              fontWeight: 600,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.2rem' }}>{t.type === 'success' ? '✨' : t.type === 'error' ? '❌' : 'ℹ️'}</span>
              <span>{t.text}</span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                fontSize: '1.2rem',
                padding: '0 4px',
                fontWeight: 'bold',
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
