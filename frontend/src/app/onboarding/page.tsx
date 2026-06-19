'use client';
import { useAppStore } from '@/lib/zustandStore';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, BookOpen, User, Check, ChevronRight, 
  Star, ArrowLeft, Award, Search, Target, Compass, 
  TrendingUp, Library, ShieldCheck, Heart, UserCheck, CheckCircle2 
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const STEPS = [
  'Welcome',
  'Genres',
  'Authors',
  'Reading Goal',
  'Interests',
  'Sample Books',
  'Calibrating',
  'Ready!'
];

const GENRES = [
  'Technology', 'AI', 'Programming', 'Data Science', 'Cybersecurity', 
  'Business', 'Finance', 'Psychology', 'Productivity', 'Biography', 
  'History', 'Philosophy', 'Science', 'Physics', 'Space', 
  'Mystery', 'Thriller', 'Adventure', 'Fantasy', 'Education', 
  'Self Help', 'Leadership', 'Innovation'
];

const INTERESTS = [
  { id: 'Learn New Skills', icon: '💡', desc: 'Acquire practical knowledge & programming skills' },
  { id: 'Career Growth', icon: '📈', desc: 'Boost career efficiency and corporate insights' },
  { id: 'Personal Development', icon: '🌱', desc: 'Mindfulness, healthy habits, and mental strength' },
  { id: 'Entertainment', icon: '🍿', desc: 'Gripping stories, mysteries, and deep worlds' },
  { id: 'Research', icon: '🔬', desc: 'Scientific data, facts, and academic discoveries' },
  { id: 'Leadership', icon: '👑', desc: 'Guide teams, command projects, and motivate others' },
  { id: 'Entrepreneurship', icon: '🚀', desc: 'Build startups, study markets, and scale ideas' },
  { id: 'Technology', icon: '💻', desc: 'Modern software, cybersecurity, and future AI systems' }
];

const GOAL_OPTIONS = [
  { label: 'Casual Reader', value: 12, desc: '1 book per month' },
  { label: 'Avid Reader', value: 24, desc: '2 books per month' },
  { label: 'Bookworm', value: 50, desc: '4-5 books per month' },
  { label: 'Bibliophile', value: 100, desc: '8-9 books per month' },
  { label: 'Custom', value: 0, desc: 'Define your own goal' }
];

interface BookSample {
  id: number;
  title: string;
  author_name: string;
  cover_url: string;
  genres: string[];
  rating: number;
}

interface AuthorSuggestion {
  id: number;
  name: string;
}

export default function Onboarding() {
  const { user, token, setPreferences, setOnboarded, addToast, refreshUser } = useAppStore();
  const router = useRouter();

  // Onboarding Wizard States
  const [step, setStep] = useState(0);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [selectedBooks, setSelectedBooks] = useState<number[]>([]);
  const [goalType, setGoalType] = useState('Avid Reader');
  const [customGoal, setCustomGoal] = useState(24);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // Search & Loading States
  const [authorQuery, setAuthorQuery] = useState('');
  const [authorSuggestions, setAuthorSuggestions] = useState<AuthorSuggestion[]>([]);
  const [popularAuthors, setPopularAuthors] = useState<AuthorSuggestion[]>([]);
  const [sampleBooks, setSampleBooks] = useState<BookSample[]>([]);
  const [booksLoading, setBooksLoading] = useState(false);
  const [authorSearchLoading, setAuthorSearchLoading] = useState(false);

  // Profile Generation Ticks
  const [profileTicks, setProfileTicks] = useState<string[]>([]);
  const [currentTickIndex, setCurrentTickIndex] = useState(0);
  const calibrationStarted = useRef(false);

  // Redirection guard
  useEffect(() => {
    if (!token) {
      router.replace('/login');
    }
  }, [token, router]);

  // Load Popular Authors once on mount
  useEffect(() => {
    const fetchPopularAuthors = async () => {
      try {
        const res = await fetch(`${API}/books/authors/list?popular=true&limit=12`);
        if (res.ok) {
          const data = await res.json();
          setPopularAuthors(data);
        }
      } catch (e) {
        console.error('Error fetching popular authors:', e);
      }
    };
    fetchPopularAuthors();
  }, []);

  // Search Authors as type
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (authorQuery.trim().length >= 2) {
        setAuthorSearchLoading(true);
        try {
          const res = await fetch(`${API}/books/authors/list?search=${encodeURIComponent(authorQuery)}&limit=5`);
          if (res.ok) {
            const data = await res.json();
            setAuthorSuggestions(data);
          }
        } catch (e) {
          console.error('Error searching authors:', e);
        } finally {
          setAuthorSearchLoading(false);
        }
      } else {
        setAuthorSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [authorQuery]);

  // Fetch sample books when step moves to Step 6 (index 5)
  useEffect(() => {
    if (step === 5) {
      const fetchSampleBooks = async () => {
        setBooksLoading(true);
        try {
          const genreParams = selectedGenres.join(',');
          const res = await fetch(`${API}/books/onboarding-samples?genres=${encodeURIComponent(genreParams)}&limit=30`);
          if (res.ok) {
            const data = await res.json();
            setSampleBooks(data.books || []);
          }
        } catch (e) {
          console.error('Error loading sample books:', e);
          addToast('Could not load sample books. Using default catalog.', 'error');
        } finally {
          setBooksLoading(false);
        }
      };
      fetchSampleBooks();
    }
  }, [step, selectedGenres, addToast]);

  // Handle Calibration Ticks & API Submission
  useEffect(() => {
    if (step === 6 && !calibrationStarted.current) {
      calibrationStarted.current = true;
      const ticks = [
        'Analyzing your favorite genres...',
        'Mapping your preferred authors...',
        'Calibrating your reading interests...',
        'Cross-referencing selected books similarity matrix...',
        'Injecting diversity weights to hybrid recommender...',
        'Personalized profile generated successfully!'
      ];
      setProfileTicks([]);
      setCurrentTickIndex(0);

      let currentIdx = 0;
      const interval = setInterval(() => {
        if (currentIdx < ticks.length) {
          setProfileTicks(prev => [...prev, ticks[currentIdx]]);
          setCurrentTickIndex(currentIdx + 1);
          currentIdx++;
        } else {
          clearInterval(interval);
          submitOnboardingProfile();
        }
      }, 900);

      return () => clearInterval(interval);
    }
  }, [step]);

  const submitOnboardingProfile = async () => {
    const finalGoal = goalType === 'Custom' ? customGoal : (GOAL_OPTIONS.find(g => g.label === goalType)?.value || 24);
    const payload = {
      genres: selectedGenres,
      authors: selectedAuthors,
      interests: selectedInterests,
      reading_goal: finalGoal,
      selected_books: selectedBooks
    };

    try {
      const res = await fetch(`${API}/users/me/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // Sync local zustand store
        const prefs = {
          preferred_genres: selectedGenres,
          preferred_authors: selectedAuthors,
          preferred_languages: ['English'],
          onboarding_completed: true,
        };
        setPreferences(prefs);
        setOnboarded(true);
        await refreshUser();
        setTimeout(() => {
          setStep(7); // Go to Completion screen
        }, 500);
      } else {
        const data = await res.json();
        addToast(data.detail || 'Failed to save profile. Try again.', 'error');
        setStep(5); // Go back to books selection to retry
        calibrationStarted.current = false;
      }
    } catch (e) {
      console.error('Error submitting onboarding:', e);
      addToast('Network error during calibration. Please retry.', 'error');
      setStep(5);
      calibrationStarted.current = false;
    }
  };

  if (!user) return null;

  const handleNext = () => {
    if (step === 1 && selectedGenres.length < 3) {
      addToast('Please select at least 3 genres to proceed.', 'info');
      return;
    }
    if (step === 4 && selectedInterests.length < 1) {
      addToast('Please select at least 1 reading interest to proceed.', 'info');
      return;
    }
    if (step === 5 && selectedBooks.length < 5) {
      addToast('Please choose at least 5 sample books you enjoy.', 'info');
      return;
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(prev => prev - 1);
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  // Custom styling elements to force glassmorphism & deep spotify/netflix styling
  const gradientBg = {
    background: 'radial-gradient(circle at top left, #0e172a, #020617, #1a0f2e)',
    minHeight: 'calc(100vh - 72px)',
  };

  return (
    <div style={gradientBg} className="text-white flex flex-col items-center justify-start py-8 px-4 sm:px-6 overflow-x-hidden">
      {/* Container Card */}
      <div className="w-full max-w-4xl bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col min-height-container">
        
        {/* Animated Progress Bar */}
        {step < 6 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                Onboarding Step {step + 1} of {STEPS.length - 2}
              </span>
              <span className="text-xs font-bold text-amber-500">{Math.round(progress)}% Completed</span>
            </div>
            <div className="w-full bg-slate-950/60 rounded-full h-2 overflow-hidden border border-slate-800/40">
              <motion.div 
                className="bg-gradient-to-r from-rose-900 via-purple-700 to-amber-500 h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        {/* Navigation Indicator Pills */}
        {step < 6 && (
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {STEPS.slice(0, 6).map((label, idx) => (
              <div
                key={label}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                  idx === step 
                    ? 'bg-rose-900/80 text-white border border-rose-500 shadow-md shadow-rose-900/20' 
                    : idx < step 
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50' 
                      : 'bg-slate-950/60 text-slate-500 border border-slate-900'
                }`}
              >
                {idx < step ? '✓ ' : ''}{label}
              </div>
            ))}
          </div>
        )}

        {/* Wizard Steps Content */}
        <div className="flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: Welcome Screen */}
            {step === 0 && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="text-center space-y-6 max-w-2xl mx-auto"
              >
                <div className="inline-flex p-4 bg-gradient-to-br from-rose-900/50 to-purple-900/50 border border-rose-800/30 rounded-2xl shadow-xl shadow-rose-950/20 animate-pulse">
                  <Sparkles size={48} className="text-amber-500" />
                </div>
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-rose-400 bg-clip-text text-transparent">
                  Welcome to LitRealm
                </h1>
                <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                  Embark on a highly personalized reading adventure. Customize your tastes, set reading targets, and get intelligent book recommendations tailored uniquely to you.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-4">
                  <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800/50 backdrop-blur-sm hover:border-rose-900/30 transition-all duration-300">
                    <Compass className="text-rose-500 mx-auto mb-3" size={28} />
                    <h3 className="font-bold text-sm text-slate-200">Smart Discovery</h3>
                    <p className="text-xs text-slate-500 mt-1">Weighted recommendation formulas mapping your preferred genres, authors, and interests.</p>
                  </div>
                  <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800/50 backdrop-blur-sm hover:border-purple-900/30 transition-all duration-300">
                    <Target className="text-purple-500 mx-auto mb-3" size={28} />
                    <h3 className="font-bold text-sm text-slate-200">Set Reading Goals</h3>
                    <p className="text-xs text-slate-500 mt-1">Select a reading goal for the year and track your progress page-by-page.</p>
                  </div>
                  <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800/50 backdrop-blur-sm hover:border-amber-900/30 transition-all duration-300">
                    <Library className="text-amber-500 mx-auto mb-3" size={28} />
                    <h3 className="font-bold text-sm text-slate-200">Personalized Library</h3>
                    <p className="text-xs text-slate-500 mt-1">Organize favorites, want to read, currently reading, and completed books seamlessly.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Favorite Genres */}
            {step === 1 && (
              <motion.div
                key="genres"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-2xl sm:text-3xl font-black text-rose-400">Choose Your Favorite Genres</h2>
                  <p className="text-slate-400 text-xs sm:text-sm mt-2">Select at least <span className="text-rose-500 font-bold">3 genres</span> to customize your recommendations feed.</p>
                </div>

                {/* Spotify-style Genre Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar">
                  {GENRES.map((g, idx) => {
                    const isSelected = selectedGenres.includes(g);
                    // generate unique color hue based on index for Spotify style cards
                    const hue = (idx * 57) % 360;
                    const cardBg = isSelected 
                      ? `hsla(${hue}, 70%, 15%, 0.75)`
                      : 'rgba(15, 23, 42, 0.4)';
                    const cardBorder = isSelected
                      ? `1px solid hsla(${hue}, 80%, 45%, 0.8)`
                      : '1px solid rgba(51, 65, 85, 0.3)';
                    const dotColor = `hsla(${hue}, 80%, 55%, 1)`;

                    return (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        key={g}
                        onClick={() => setSelectedGenres(prev =>
                          prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
                        )}
                        className={`p-4 rounded-xl text-left font-bold text-sm relative transition-all duration-300 h-24 overflow-hidden border flex flex-col justify-between`}
                        style={{ background: cardBg, border: cardBorder }}
                      >
                        {/* Decorative circle glow */}
                        <div 
                          className="absolute -right-6 -bottom-6 w-16 h-16 rounded-full blur-xl opacity-30"
                          style={{ backgroundColor: dotColor }}
                        />

                        <div className="flex justify-between items-center">
                          <span style={{ color: isSelected ? '#ffffff' : '#94a3b8' }} className="z-10">{g}</span>
                          {isSelected ? (
                            <div className="bg-white text-slate-900 rounded-full p-0.5 z-10">
                              <Check size={12} className="stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-slate-700 z-10" />
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-normal z-10">CURATED</span>
                      </motion.button>
                    );
                  })}
                </div>
                <div className="text-center text-xs text-slate-500">
                  Selected: <span className="text-white font-bold">{selectedGenres.length}</span> / 3 minimum
                </div>
              </motion.div>
            )}

            {/* STEP 3: Favorite Authors */}
            {step === 2 && (
              <motion.div
                key="authors"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-2xl sm:text-3xl font-black text-purple-400">Select Favorite Authors</h2>
                  <p className="text-slate-400 text-xs sm:text-sm mt-2">Find and select authors you enjoy. Recommendations will prioritize their works.</p>
                </div>

                {/* Author Search bar */}
                <div className="relative max-w-md mx-auto">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-slate-500" />
                  </div>
                  <input
                    type="text"
                    value={authorQuery}
                    onChange={e => setAuthorQuery(e.target.value)}
                    placeholder="Search by author name..."
                    className="w-full bg-slate-950/70 border border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 transition-all outline-none"
                  />
                  {authorSearchLoading && (
                    <div className="absolute right-3 top-3.5">
                      <div className="w-4 h-4 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                    </div>
                  )}
                  
                  {/* Search Suggestions Dropdown */}
                  {authorSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto">
                      {authorSuggestions.map(author => (
                        <button
                          key={author.id}
                          onClick={() => {
                            if (!selectedAuthors.includes(author.name)) {
                              setSelectedAuthors([...selectedAuthors, author.name]);
                            }
                            setAuthorQuery('');
                            setAuthorSuggestions([]);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-purple-950/30 hover:text-purple-300 transition-all flex items-center justify-between"
                        >
                          <span>{author.name}</span>
                          <Check size={14} className="opacity-0 hover:opacity-100 text-purple-400" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Authors Badges */}
                <div className="flex flex-wrap gap-2 justify-center min-h-[40px]">
                  {selectedAuthors.map(author => (
                    <motion.span
                      layout
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      key={author}
                      className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-950 to-indigo-950 border border-purple-800/40 text-purple-200 text-xs font-bold px-3 py-1.5 rounded-full"
                    >
                      <span>{author}</span>
                      <button
                        onClick={() => setSelectedAuthors(selectedAuthors.filter(x => x !== author))}
                        className="text-purple-400 hover:text-rose-400 transition-all text-sm font-black ml-1 outline-none"
                      >
                        ×
                      </button>
                    </motion.span>
                  ))}
                </div>

                {/* Suggested/Popular Authors list */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Suggested Authors</h4>
                  <div className="flex flex-wrap gap-2 justify-center max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {popularAuthors.slice(0, 15).map(author => {
                      const isSelected = selectedAuthors.includes(author.name);
                      return (
                        <button
                          key={author.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedAuthors(selectedAuthors.filter(x => x !== author.name));
                            } else {
                              setSelectedAuthors([...selectedAuthors, author.name]);
                            }
                          }}
                          className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-300 flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-purple-900 border-purple-500 text-white'
                              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                          }`}
                        >
                          {isSelected && <UserCheck size={12} />}
                          {author.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Reading Goals */}
            {step === 3 && (
              <motion.div
                key="goals"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-2xl sm:text-3xl font-black text-amber-400">Set Your Reading Goal</h2>
                  <p className="text-slate-400 text-xs sm:text-sm mt-2">How many books do you plan to read this year? Establish your target.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 max-w-3xl mx-auto">
                  {GOAL_OPTIONS.map(g => (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      key={g.label}
                      onClick={() => setGoalType(g.label)}
                      className={`p-5 rounded-2xl border text-center transition-all duration-300 flex flex-col justify-between h-40 ${
                        goalType === g.label
                          ? 'bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-950/20 text-white'
                          : 'bg-slate-950/30 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="mx-auto bg-amber-500/10 p-2 rounded-xl text-amber-500 mb-2">
                        <Award size={20} />
                      </div>
                      
                      {g.label === 'Custom' ? (
                        <div className="flex flex-col items-center">
                          <span className="text-2xl font-black text-amber-500">{customGoal}</span>
                          <span className="text-[10px] text-slate-500 uppercase mt-1">BOOKS</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <span className="text-3xl font-black text-amber-500">{g.value}</span>
                          <span className="text-[10px] text-slate-500 uppercase mt-1">BOOKS</span>
                        </div>
                      )}
                      
                      <div>
                        <h3 className="font-bold text-xs text-slate-200 mt-2">{g.label}</h3>
                        <p className="text-[9px] text-slate-500 mt-1">{g.desc}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Custom Goal Slider */}
                {goalType === 'Custom' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="max-w-md mx-auto bg-slate-950/40 border border-slate-800 p-6 rounded-2xl text-center space-y-4"
                  >
                    <label className="text-xs font-bold text-slate-300 block">Drag to adjust goal: {customGoal} books per year</label>
                    <input
                      type="range"
                      min={1}
                      max={200}
                      value={customGoal}
                      onChange={e => setCustomGoal(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 px-1">
                      <span>1 Book</span>
                      <span>100 Books</span>
                      <span>200 Books</span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* STEP 5: Reading Interests */}
            {step === 4 && (
              <motion.div
                key="interests"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-2xl sm:text-3xl font-black text-rose-400">What are your reading interests?</h2>
                  <p className="text-slate-400 text-xs sm:text-sm mt-2">Select at least <span className="text-rose-500 font-bold">1 interest</span>. This matches Netflix-style personalization grids.</p>
                </div>

                {/* Netflix-style Interest Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                  {INTERESTS.map(item => {
                    const isSelected = selectedInterests.includes(item.id);
                    return (
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        key={item.id}
                        onClick={() => setSelectedInterests(prev =>
                          prev.includes(item.id) ? prev.filter(x => x !== item.id) : [...prev, item.id]
                        )}
                        className={`p-4 rounded-2xl border text-left flex items-start gap-4 transition-all duration-300 ${
                          isSelected
                            ? 'bg-rose-950/30 border-rose-500 shadow-md shadow-rose-950/20 text-white'
                            : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-3xl bg-slate-900 p-2.5 rounded-xl border border-slate-800/80 shadow-md">
                          {item.icon}
                        </div>
                        <div className="flex-1 space-y-1">
                          <h3 className="font-bold text-sm text-slate-100 flex items-center justify-between">
                            <span>{item.id}</span>
                            {isSelected && <CheckCircle2 size={16} className="text-rose-500" />}
                          </h3>
                          <p className="text-xs text-slate-500 leading-normal">{item.desc}</p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 6: Choose Sample Books */}
            {step === 5 && (
              <motion.div
                key="sample-books"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-2xl sm:text-3xl font-black text-rose-400">Select books you like</h2>
                  <p className="text-slate-400 text-xs sm:text-sm mt-2">Pick at least <span className="text-rose-500 font-bold">5 books</span>. We prioritize these as content-similarity seeds.</p>
                </div>

                {booksLoading ? (
                  /* Loading Skeletons */
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 max-h-[350px] overflow-hidden pr-2">
                    {Array.from({ length: 10 }).map((_, idx) => (
                      <div key={idx} className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-3 space-y-3 h-64 animate-pulse">
                        <div className="bg-slate-950 w-full h-40 rounded-lg" />
                        <div className="bg-slate-950 w-3/4 h-3.5 rounded" />
                        <div className="bg-slate-950 w-1/2 h-2.5 rounded" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                    {sampleBooks.map(book => {
                      const isSelected = selectedBooks.includes(book.id);
                      return (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          key={book.id}
                          onClick={() => setSelectedBooks(prev =>
                            prev.includes(book.id) ? prev.filter(x => x !== book.id) : [...prev, book.id]
                          )}
                          className={`p-3 rounded-xl border text-left relative transition-all duration-300 h-68 flex flex-col justify-between overflow-hidden group ${
                            isSelected
                              ? 'bg-rose-950/20 border-rose-500 shadow-md shadow-rose-950/20'
                              : 'bg-slate-950/30 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {/* Image cover fallback placeholder check */}
                          <div className="relative w-full h-40 rounded-lg overflow-hidden bg-slate-900 border border-slate-800/80 mb-2 shadow-inner flex items-center justify-center">
                            {book.cover_url ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img 
                                src={book.cover_url} 
                                alt={book.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  // fallback image cover if fails to load
                                  (e.target as HTMLImageElement).src = '/images/placeholder_cover.jpg';
                                  (e.target as HTMLImageElement).style.objectFit = 'contain';
                                }}
                              />
                            ) : (
                              <div className="text-center text-slate-600 p-2">
                                <BookOpen size={24} className="mx-auto mb-1 text-slate-700" />
                                <span className="text-[10px] uppercase font-bold tracking-wider">No Cover</span>
                              </div>
                            )}
                            
                            {/* Selection checkmark badge */}
                            {isSelected && (
                              <div className="absolute inset-0 bg-rose-950/40 backdrop-blur-xs flex items-center justify-center">
                                <div className="bg-rose-900 text-white rounded-full p-1.5 shadow-lg border border-rose-500">
                                  <Heart size={20} className="fill-white stroke-[0.5]" />
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 flex flex-col justify-between space-y-1">
                            <div className="line-clamp-2 font-bold text-xs text-slate-100 group-hover:text-rose-400 transition-all leading-tight">
                              {book.title}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {book.author_name}
                            </div>
                            {book.rating > 0 && (
                              <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold">
                                <Star size={10} className="fill-amber-500" />
                                <span>{book.rating.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
                
                <div className="text-center text-xs text-slate-500">
                  Selected: <span className="text-white font-bold">{selectedBooks.length}</span> / 5 minimum
                </div>
              </motion.div>
            )}

            {/* STEP 7: Calibration Screen (Loader) */}
            {step === 6 && (
              <motion.div
                key="calibration"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-8 max-w-md mx-auto"
              >
                <div className="relative w-24 h-24 mx-auto">
                  {/* Glowing Spinner */}
                  <div className="absolute inset-0 border-4 border-slate-800 rounded-full" />
                  <motion.div 
                    className="absolute inset-0 border-4 border-t-rose-500 border-r-purple-500 border-b-transparent border-l-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-2xl font-black text-rose-500">
                    {Math.min(100, Math.round((currentTickIndex / 6) * 100))}%
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-bold tracking-tight text-slate-200">Generating recommendation profile...</h3>
                  <p className="text-slate-500 text-xs">Calibrating cold-start filters and populating relational interest indices.</p>
                </div>

                {/* Profiler loading logs */}
                <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 text-left font-mono text-xs text-slate-400 space-y-2.5 max-h-48 overflow-y-auto">
                  {profileTicks.map((tick, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-emerald-400 animate-fadeIn font-semibold">
                      <span>⚡</span>
                      <span>{tick}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 8: Completion Screen */}
            {step === 7 && (
              <motion.div
                key="completion"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6 max-w-md mx-auto"
              >
                <div className="inline-flex p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-full text-emerald-400 shadow-xl shadow-emerald-950/30 animate-bounce">
                  <CheckCircle2 size={64} className="stroke-[2.5]" />
                </div>
                
                <h1 className="text-3xl font-black text-emerald-400">Profile Calibrated!</h1>
                <p className="text-slate-400 text-sm">
                  We have mapped your preferences. Your personalized LitRealm dashboard is calibrated and ready.
                </p>

                {/* Profile Strength Card */}
                <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6 grid grid-cols-2 gap-4">
                  <div className="border-r border-slate-800/80 p-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Profile Strength</span>
                    <span className="text-3xl font-black text-amber-500 mt-1 block">95%</span>
                    <span className="text-[9px] text-slate-600 block mt-1">Excellent seed mapping</span>
                  </div>
                  <div className="p-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Recommender State</span>
                    <span className="text-2xl font-black text-emerald-400 mt-1.5 block">READY</span>
                    <span className="text-[9px] text-slate-600 block mt-1.5">Hybrid formula online</span>
                  </div>
                </div>

                <div className="pt-4">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => router.replace('/')}
                    className="w-full btn-primary bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold py-4 rounded-xl border border-emerald-400/20 hover:shadow-lg hover:shadow-emerald-900/10 cursor-pointer text-sm"
                  >
                    Enter Dashboard
                  </motion.button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        {step < 6 && (
          <div className="flex gap-4 justify-between mt-10 pt-6 border-t border-slate-800/40">
            <button
              onClick={handleBack}
              disabled={step === 0}
              className={`px-6 py-3 rounded-xl border text-sm font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                step === 0 
                  ? 'border-slate-800/40 text-slate-700 cursor-not-allowed' 
                  : 'bg-slate-950/30 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
              }`}
            >
              <ArrowLeft size={14} /> Back
            </button>

            <button
              onClick={handleNext}
              className="px-8 py-3 bg-rose-900 hover:bg-rose-800 text-white font-bold text-sm rounded-xl border border-rose-800/30 flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-rose-950/20"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
