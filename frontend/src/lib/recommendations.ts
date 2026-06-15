import { Book, BOOKS } from './data';

// Simple cosine-similarity-based recommendation using genre + author + rating
export function getRecommendations(preferences: {
  genres: string[];
  languages: string[];
  authors?: string[];
}, excludeIds: number[] = [], limit = 12): Book[] {
  const preferredAuthors = preferences.authors || [];
  return BOOKS
    .filter(b => !excludeIds.includes(b.id))
    .map(b => {
      // Calculate scores
      const genreScore = b.genre.filter(g => preferences.genres.includes(g)).length;
      const langScore = preferences.languages.includes(b.language) ? 2 : 0;
      const authorScore = preferredAuthors.some(a => b.author.toLowerCase().includes(a.toLowerCase())) ? 4 : 0;
      
      // Calculate a combined score
      const score = (genreScore * 3.5) + langScore + authorScore + b.rating;
      return { ...b, score };
    })
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, limit);
}

// Get similar books based on shared genres and author
export function getSimilarBooks(book: Book, limit = 6): Book[] {
  return BOOKS
    .filter(b => b.id !== book.id)
    .map(b => {
      const sharedGenres = b.genre.filter(g => book.genre.includes(g)).length;
      const sameAuthor = b.author === book.author ? 5 : 0;
      return { ...b, score: (sharedGenres * 2.5) + sameAuthor + b.rating };
    })
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, limit);
}

// Get trending books (highest rated)
export function getTrending(limit = 8): Book[] {
  return [...BOOKS].sort((a, b) => b.rating - a.rating).slice(0, limit);
}

// Search books with enhanced query and filters
export function searchBooks(query: string, filters: {
  genre?: string; language?: string; year?: number
} = {}): Book[] {
  const q = query.toLowerCase().trim();
  return BOOKS.filter(b => {
    const matchQuery = !q ||
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.description.toLowerCase().includes(q) ||
      b.tags.some(t => t.toLowerCase().includes(q));
    const matchGenre = !filters.genre || b.genre.includes(filters.genre);
    const matchLang = !filters.language || b.language === filters.language;
    const matchYear = !filters.year || b.year === filters.year;
    return matchQuery && matchGenre && matchLang && matchYear;
  });
}

