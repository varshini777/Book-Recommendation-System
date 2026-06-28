'use client';
import { useAppStore } from '@/lib/zustandStore';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, BookOpen, User, Check, ChevronRight,
  Star, ArrowLeft, Award, Search, Target, Compass,
  TrendingUp, Library, ShieldCheck, Heart, UserCheck, CheckCircle2,
  X, Plus, Rocket, BookMarked,
  Quote, GraduationCap, Lightbulb, Briefcase, Sprout,
  FlaskConical, Crown, Code2, Microscope
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

const GENRE_ICON_MAP: Record<string, React.ReactNode> = {
  'Technology': <Code2 size={22} />,
  'AI': <Sparkles size={22} />,
  'Programming': <Code2 size={22} />,
  'Data Science': <FlaskConical size={22} />,
  'Cybersecurity': <ShieldCheck size={22} />,
  'Business': <Briefcase size={22} />,
  'Finance': <TrendingUp size={22} />,
  'Psychology': <User size={22} />,
  'Productivity': <Target size={22} />,
  'Biography': <User size={22} />,
  'History': <BookOpen size={22} />,
  'Philosophy': <Quote size={22} />,
  'Science': <Microscope size={22} />,
  'Physics': <FlaskConical size={22} />,
  'Space': <Rocket size={22} />,
  'Mystery': <Search size={22} />,
  'Thriller': <Compass size={22} />,
  'Adventure': <Compass size={22} />,
  'Fantasy': <Sparkles size={22} />,
  'Education': <GraduationCap size={22} />,
  'Self Help': <Lightbulb size={22} />,
  'Leadership': <Crown size={22} />,
  'Innovation': <Sparkles size={22} />
};

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
  image_url?: string | null;
  nationality?: string | null;
  popularity?: number;
}

function OnboardingBookCover({ coverUrl, title, genres }: { coverUrl: string; title: string; genres: string[] }) {
  const [failed, setFailed] = useState(false);
  const showImg = coverUrl && !failed;

  if (showImg) {
    return (
      <img
        src={coverUrl}
        alt={title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className="w-full h-full p-4 flex flex-col items-center justify-center text-center bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl">
      <span className="font-serif text-sm text-yellow-300 font-bold line-clamp-3 leading-tight mb-2">{title}</span>
      {genres && genres[0] && (
        <span className="text-xs text-blue-200 border border-blue-400/40 px-2 py-0.5 rounded-full uppercase tracking-wider">{genres[0]}</span>
      )}
    </div>
  );
}

function AuthorAvatar({ author, size = 64 }: { author: AuthorSuggestion; size?: number }) {
  const [imgFailed, setImgFailed] = useState(false);
  const hasImg = author.image_url && !imgFailed;
  if (hasImg) {
    return (
      <img
        src={author.image_url!}
        alt={author.name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }}
        onError={() => setImgFailed(true)}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: Math.round(size * 0.4),
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
        border: '3px solid white'
      }}
    >
      {author.name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function Onboarding() {
  const { user, token, setPreferences, setOnboarded, addToast, refreshUser } = useAppStore();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [selectedBooks, setSelectedBooks] = useState<number[]>([]);
  const [goalType, setGoalType] = useState('Avid Reader');
  const [customGoal, setCustomGoal] = useState(24);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const [authorQuery, setAuthorQuery] = useState('');
  const [authorSuggestions, setAuthorSuggestions] = useState<AuthorSuggestion[]>([]);
  const [popularAuthors, setPopularAuthors] = useState<AuthorSuggestion[]>([]);
  const [sampleBooks, setSampleBooks] = useState<BookSample[]>([]);
  const [booksLoading, setBooksLoading] = useState(false);
  const [authorSearchLoading, setAuthorSearchLoading] = useState(false);

  const [profileTicks, setProfileTicks] = useState<string[]>([]);
  const [currentTickIndex, setCurrentTickIndex] = useState(0);
  const calibrationStarted = useRef(false);

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

  useEffect(() => {
    if (step === 7) {
      const timer = setTimeout(() => {
        router.replace('/');
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [step, router]);

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
          setStep(7);
        }, 500);
      } else {
        const data = await res.json();
        addToast(data.detail || 'Failed to save profile. Try again.', 'error');
        setStep(5);
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
    if (step === 3) {
      const finalReadingGoal = goalType === 'Custom'
        ? Number(customGoal)
        : (GOAL_OPTIONS.find(g => g.label === goalType)?.value || 0);
      if (!finalReadingGoal || finalReadingGoal <= 0) {
        addToast('Please select a valid reading goal to proceed.', 'info');
        return;
      }
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

  return (
    <div className="fixed inset-0 bg-[#F8FAFC] overflow-y-auto overflow-x-hidden z-[999]">
      <div className="w-full max-w-7xl mx-auto px-6 md:px-10 py-6 min-h-screen flex flex-col">

        {/* Progress Bar */}
        {step < 6 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-semibold tracking-wide text-slate-500">
                Step {step + 1} of {STEPS.length - 2}
              </span>
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => { useAppStore.getState().logout(); router.replace('/login'); }}
                  className="text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Logout
                </button>
                <span className="text-sm font-bold text-blue-600">{Math.round(progress)}% complete</span>
              </div>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        {/* Step Indicator Pills */}
        {step < 6 && (
          <div className="flex flex-wrap gap-2.5 justify-center mb-8">
            {STEPS.slice(0, 6).map((label, idx) => (
              <div
                key={label}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                  idx === step
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                    : idx < step
                      ? 'bg-blue-50 text-blue-600 border border-blue-200'
                      : 'bg-white text-slate-400 border border-slate-200'
                }`}
              >
                {idx < step && <Check size={14} className="inline mr-1 -mt-0.5" />}{label}
              </div>
            ))}
          </div>
        )}

        {/* Wizard Content */}
        <div className="flex-1 flex flex-col">
          <AnimatePresence mode="wait">

            {/* STEP 1: Welcome Screen */}
            {step === 0 && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col items-center justify-center text-center space-y-8 max-w-2xl w-full mx-auto"
              >
                <div className="inline-flex p-5 bg-blue-50 border border-blue-100 rounded-3xl shadow-lg shadow-blue-100">
                  <Sparkles size={52} className="text-blue-600" />
                </div>
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
                  Welcome to <span className="text-blue-600">LitRealm</span>
                </h1>
                <p className="text-slate-500 text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
                  Embark on a personalized reading adventure. Customize your tastes, set targets, and discover books tailored uniquely to you.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-10 pt-4">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 transition-all duration-300">
                    <Compass className="text-blue-500 mx-auto mb-4" size={32} />
                    <h3 className="font-bold text-base text-slate-800">Smart Discovery</h3>
                    <p className="text-sm text-slate-500 mt-2 leading-relaxed">Weighted formulas mapping your preferred genres, authors, and interests.</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 transition-all duration-300">
                    <Target className="text-blue-500 mx-auto mb-4" size={32} />
                    <h3 className="font-bold text-base text-slate-800">Set Reading Goals</h3>
                    <p className="text-sm text-slate-500 mt-2 leading-relaxed">Select a reading goal for the year and track your progress.</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 transition-all duration-300">
                    <Library className="text-blue-500 mx-auto mb-4" size={32} />
                    <h3 className="font-bold text-base text-slate-800">Personalized Library</h3>
                    <p className="text-sm text-slate-500 mt-2 leading-relaxed">Organize favorites, want to read, and completed books seamlessly.</p>
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
                className="flex-1 flex flex-col space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Choose Your Favorite Genres</h2>
                  <p className="text-slate-500 text-sm sm:text-base mt-2">Select at least <span className="text-blue-600 font-bold">3 genres</span> to customize your recommendations.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
                  {GENRES.map((g) => {
                    const isSelected = selectedGenres.includes(g);
                    return (
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        key={g}
                        onClick={() => setSelectedGenres(prev =>
                          prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
                        )}
                         className={`p-6 rounded-2xl text-left transition-all duration-300 min-h-[150px] overflow-hidden border-2 flex flex-col justify-between group ${
                           isSelected
                             ? 'bg-white border-blue-500 shadow-lg shadow-blue-100'
                             : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'
                         }`}
                       >
                         <div className="flex justify-between items-start">
                           <div className={`p-3 rounded-xl transition-all duration-300 ${
                             isSelected
                               ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                               : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'
                           }`}>
                             {GENRE_ICON_MAP[g] || <BookOpen size={24} />}
                           </div>
                           {isSelected ? (
                             <div className="bg-blue-600 text-white rounded-full p-1">
                               <Check size={14} className="stroke-[3]" />
                             </div>
                           ) : (
                             <div className="w-6 h-6 rounded-full border-2 border-slate-300 group-hover:border-blue-400 transition-colors" />
                           )}
                         </div>
                         <div>
                           <span className={`font-bold text-base block ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>{g}</span>
                           <span className={`text-xs font-semibold uppercase tracking-wider ${isSelected ? 'text-blue-400' : 'text-slate-400'}`}>CURATED</span>
                         </div>
                      </motion.button>
                    );
                  })}
                </div>
                <div className="text-center text-sm text-slate-500">
                  Selected: <span className="text-blue-600 font-bold">{selectedGenres.length}</span> / 3 minimum
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
                className="flex-1 flex flex-col space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Select Favorite Authors</h2>
                  <p className="text-slate-500 text-sm sm:text-base mt-2">Find and select authors you enjoy. Recommendations will prioritize their works.</p>
                </div>

                {/* Author Search */}
                <div className="relative max-w-lg mx-auto w-full">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search size={20} className="text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={authorQuery}
                    onChange={e => setAuthorQuery(e.target.value)}
                    placeholder="Search by author name..."
                    className="w-full bg-white border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 rounded-2xl py-4 pl-12 pr-4 text-base text-slate-800 placeholder-slate-400 transition-all outline-none"
                  />
                  {authorSearchLoading && (
                    <div className="absolute right-4 top-4">
                      <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                    </div>
                  )}

                  {authorSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 max-h-56 overflow-y-auto">
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
                          className="w-full text-left px-5 py-3.5 text-sm hover:bg-blue-50 hover:text-blue-700 transition-all flex items-center justify-between border-b border-slate-100 last:border-b-0"
                        >
                          <span className="font-medium text-slate-700">{author.name}</span>
                          <Plus size={16} className="text-blue-500" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Authors */}
                <div className="flex flex-wrap gap-2.5 justify-center min-h-[44px]">
                  {selectedAuthors.map(author => (
                    <motion.span
                      layout
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      key={author}
                      className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-md shadow-blue-200"
                    >
                      <span>{author}</span>
                      <button
                        onClick={() => setSelectedAuthors(selectedAuthors.filter(x => x !== author))}
                        className="text-blue-200 hover:text-white transition-all"
                      >
                        <X size={14} />
                      </button>
                    </motion.span>
                  ))}
                </div>

                {/* Popular Authors Grid (matching Settings page style) */}
                <div className="space-y-4 flex-1 flex flex-col min-h-0">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 text-center">Suggested Authors</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
                    {popularAuthors.slice(0, 12).map(author => {
                      const isSelected = selectedAuthors.includes(author.name);
                      return (
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          key={author.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedAuthors(selectedAuthors.filter(x => x !== author.name));
                            } else {
                              setSelectedAuthors([...selectedAuthors, author.name]);
                            }
                          }}
                         className={`p-6 rounded-2xl border-2 text-center transition-all duration-300 flex flex-col items-center gap-4 ${
                           isSelected
                             ? 'bg-blue-50 border-blue-500 shadow-lg shadow-blue-100'
                             : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'
                         }`}
                       >
                         {isSelected && (
                           <div className="absolute top-3 right-3 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-sm">
                             <Check size={12} className="text-white stroke-[3]" />
                           </div>
                         )}
                         <div className="relative">
                           <AuthorAvatar author={author} size={64} />
                         </div>
                         <p className={`font-bold text-sm leading-tight ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                           {author.name}
                         </p>
                         {author.nationality && (
                           <p className="text-xs text-slate-400 font-medium">{author.nationality}</p>
                         )}
                        </motion.button>
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
                className="flex-1 flex flex-col space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Set Your Reading Goal</h2>
                  <p className="text-slate-500 text-sm sm:text-base mt-2">How many books do you plan to read this year? Establish your target.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-5 max-w-5xl mx-auto w-full">
                  {GOAL_OPTIONS.map(g => (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      key={g.label}
                      onClick={() => setGoalType(g.label)}
                         className={`p-6 rounded-2xl border-2 text-center transition-all duration-300 flex flex-col justify-between min-h-[220px] ${
                           goalType === g.label
                             ? 'bg-blue-50 border-blue-500 shadow-lg shadow-blue-100'
                             : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'
                         }`}
                       >
                         <div className={`mx-auto p-3 rounded-xl transition-all ${
                           goalType === g.label ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'
                         }`}>
                           <Award size={26} />
                         </div>

                         {g.label === 'Custom' ? (
                           <div className="flex flex-col items-center">
                             <span className="text-4xl font-extrabold text-blue-600">{customGoal}</span>
                             <span className="text-xs text-slate-400 uppercase font-bold mt-1">BOOKS</span>
                           </div>
                         ) : (
                           <div className="flex flex-col items-center">
                             <span className="text-4xl font-extrabold text-blue-600">{g.value}</span>
                             <span className="text-xs text-slate-400 uppercase font-bold mt-1">BOOKS</span>
                           </div>
                         )}

                         <div>
                           <h3 className="font-bold text-base text-slate-700 mt-2">{g.label}</h3>
                           <p className="text-xs text-slate-400 mt-1">{g.desc}</p>
                         </div>
                    </motion.button>
                  ))}
                </div>

                {goalType === 'Custom' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="max-w-lg mx-auto bg-white border-2 border-slate-200 p-8 rounded-2xl text-center space-y-5"
                  >
                    <label className="text-sm font-bold text-slate-600 block">Drag to adjust goal: <span className="text-blue-600">{customGoal}</span> books per year</label>
                    <input
                      type="range"
                      min={1}
                      max={200}
                      value={customGoal}
                      onChange={e => setCustomGoal(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-slate-400 font-medium px-1">
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
                className="flex-1 flex flex-col space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">What are your reading interests?</h2>
                  <p className="text-slate-500 text-sm sm:text-base mt-2">Select at least <span className="text-blue-600 font-bold">1 interest</span>. This helps us personalize your experience.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mx-auto w-full flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
                  {INTERESTS.map(item => {
                    const isSelected = selectedInterests.includes(item.id);
                    return (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        key={item.id}
                        onClick={() => setSelectedInterests(prev =>
                          prev.includes(item.id) ? prev.filter(x => x !== item.id) : [...prev, item.id]
                        )}
                         className={`p-6 rounded-2xl border-2 text-left flex items-start gap-5 transition-all duration-300 ${
                           isSelected
                             ? 'bg-blue-50 border-blue-500 shadow-lg shadow-blue-100'
                             : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'
                         }`}
                       >
                         <div className="text-3xl bg-slate-100 p-3 rounded-xl border border-slate-200 shadow-sm flex-shrink-0">
                           {item.icon}
                         </div>
                         <div className="flex-1 space-y-1.5">
                           <h3 className="font-bold text-lg text-slate-800 flex items-center justify-between">
                            <span>{item.id}</span>
                            {isSelected && <CheckCircle2 size={18} className="text-blue-500" />}
                          </h3>
                          <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
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
                className="flex-1 flex flex-col space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Select books you like</h2>
                  <p className="text-slate-500 text-sm sm:text-base mt-2">Pick at least <span className="text-blue-600 font-bold">5 books</span>. We prioritize these as content-similarity seeds.</p>
                </div>

                {booksLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5 flex-1">
                    {Array.from({ length: 10 }).map((_, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 animate-pulse">
                        <div className="bg-slate-100 w-full aspect-[2/3] rounded-xl" />
                        <div className="bg-slate-100 w-3/4 h-4 rounded-lg" />
                        <div className="bg-slate-100 w-1/2 h-3 rounded-lg" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5 flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
                    {sampleBooks.map(book => {
                      const isSelected = selectedBooks.includes(book.id);
                      return (
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          key={book.id}
                          onClick={() => setSelectedBooks(prev =>
                            prev.includes(book.id) ? prev.filter(x => x !== book.id) : [...prev, book.id]
                          )}
                         className={`p-5 rounded-2xl border-2 text-left relative transition-all duration-300 flex flex-col overflow-hidden group ${
                           isSelected
                             ? 'bg-blue-50 border-blue-500 shadow-lg shadow-blue-100'
                             : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'
                         }`}
                        >
                          <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-slate-100 mb-3 shadow-md">
                            <OnboardingBookCover coverUrl={book.cover_url} title={book.title} genres={book.genres} />

                            {isSelected && (
                              <div className="absolute inset-0 bg-blue-600/20 backdrop-blur-[1px] flex items-center justify-center">
                                <div className="bg-blue-600 text-white rounded-full p-2 shadow-lg">
                                  <Heart size={20} className="fill-white stroke-[0.5]" />
                                </div>
                              </div>
                            )}

                            {book.rating > 0 && (
                              <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm text-slate-800 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm">
                                <Star size={10} className="fill-yellow-400 text-yellow-400" />
                                <span>{book.rating.toFixed(1)}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 flex flex-col justify-between space-y-1">
                            <div className="line-clamp-2 font-bold text-sm text-slate-800 group-hover:text-blue-600 transition-all leading-tight">
                              {book.title}
                            </div>
                            <div className="text-xs text-slate-400 truncate font-medium">
                              {book.author_name}
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                <div className="text-center text-sm text-slate-500">
                  Selected: <span className="text-blue-600 font-bold">{selectedBooks.length}</span> / 5 minimum
                </div>
              </motion.div>
            )}

            {/* STEP 7: Calibration Screen */}
            {step === 6 && (
              <motion.div
                key="calibration"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex flex-col items-center justify-center text-center space-y-8 max-w-lg w-full mx-auto"
              >
                <div className="relative w-28 h-28 mx-auto">
                  <div className="absolute inset-0 border-4 border-slate-200 rounded-full" />
                  <motion.div
                    className="absolute inset-0 border-4 border-t-blue-600 border-r-blue-400 border-b-transparent border-l-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-3xl font-extrabold text-blue-600">
                    {Math.min(100, Math.round((currentTickIndex / 6) * 100))}%
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-bold tracking-tight text-slate-800">Generating recommendation profile...</h3>
                  <p className="text-slate-500 text-sm">Calibrating cold-start filters and populating relational interest indices.</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 text-left text-sm text-slate-600 space-y-3 max-h-48 overflow-y-auto">
                  {profileTicks.map((tick, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-blue-600 font-semibold">
                      <span className="text-blue-400">&#9889;</span>
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
                className="flex-1 flex flex-col items-center justify-center text-center space-y-6 max-w-lg w-full mx-auto"
              >
                <div className="inline-flex p-5 bg-blue-50 border border-blue-100 rounded-full text-blue-600 shadow-xl shadow-blue-100 animate-bounce">
                  <CheckCircle2 size={72} className="stroke-[2]" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Profile Calibrated!</h1>
                <p className="text-slate-500 text-base">
                  We have mapped your preferences. Your personalized LitRealm dashboard is ready.
                </p>

                <div className="bg-white border border-slate-200 rounded-2xl p-8 grid grid-cols-2 gap-6">
                  <div className="border-r border-slate-200 p-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Profile Strength</span>
                    <span className="text-3xl font-extrabold text-blue-600 mt-2 block">95%</span>
                    <span className="text-xs text-slate-400 block mt-1">Excellent seed mapping</span>
                  </div>
                  <div className="p-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Recommender State</span>
                    <span className="text-2xl font-extrabold text-blue-600 mt-2 block">READY</span>
                    <span className="text-xs text-slate-400 block mt-1">Hybrid formula online</span>
                  </div>
                </div>

                <div className="pt-4">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => router.replace('/')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-2xl text-base shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 transition-all cursor-pointer"
                  >
                    Enter Dashboard
                  </motion.button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        {step < 6 && (
          <div className="flex gap-4 justify-between mt-auto pt-6 border-t border-slate-200">
            <motion.button
              whileHover={{ scale: step === 0 ? 1 : 1.03 }}
              whileTap={{ scale: step === 0 ? 1 : 0.97 }}
              onClick={handleBack}
              disabled={step === 0}
              className={`px-8 py-4 rounded-2xl border-2 text-base font-bold flex items-center gap-2.5 transition-all ${
                step === 0
                  ? 'border-slate-100 text-slate-300 cursor-not-allowed'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 shadow-sm'
              }`}
            >
              <ArrowLeft size={18} /> Back
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleNext}
              className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base rounded-2xl flex items-center gap-2.5 shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 transition-all cursor-pointer"
            >
              Next <ChevronRight size={18} />
            </motion.button>
          </div>
        )}

      </div>
    </div>
  );
}
