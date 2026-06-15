import Link from 'next/link';
import { Star, Calendar } from 'lucide-react';

interface BookCardProps {
  book: {
    id: number;
    title: string;
    author?: string;
    author_name?: string;
    cover?: string;
    cover_url?: string;
    genres?: string[];
    genre?: string[];
    rating?: number;
    year?: number;
    score?: number;
  };
  showScore?: boolean;
}

export default function BookCard({ book, showScore }: BookCardProps) {
  const genres = book.genres || book.genre || [];
  const rating = book.rating || 0;
  const year = book.year || 'N/A';
  const cover = book.cover || book.cover_url || '/placeholder-cover.png';
  const author = book.author || book.author_name || 'Unknown Author';

  return (
    <Link href={`/catalog/${book.id}`} style={{ textDecoration: 'none' }}>
      <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', height: '100%' }}>
        <div style={{ 
          position: 'relative', 
          width: '100%', 
          paddingBottom: '145%', 
          borderRadius: '14px', 
          overflow: 'hidden', 
          boxShadow: '0 8px 24px -8px rgba(0,0,0,0.15)' 
        }}>
          <img 
            src={cover} 
            alt={book.title} 
            className="book-cover"
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', background: '#F5EFEB' }}
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = '/placeholder-cover.png';
            }}
          />
          {showScore && 'score' in book && (
            <div style={{ 
              position: 'absolute', 
              top: '12px', 
              right: '12px', 
              background: 'rgba(106, 27, 41, 0.95)', 
              backdropFilter: 'blur(8px)',
              color: 'white', 
              padding: '6px 12px', 
              borderRadius: '20px', 
              fontSize: '0.7rem', 
              fontWeight: 700,
              boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
              border: '1px solid rgba(255,255,255,0.15)',
              letterSpacing: '0.02em'
            }}>
              {(book.score ?? 0) > 5 ? 'Top Match' : 'Recommended'}
            </div>
          )}
        </div>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h3 style={{ 
            fontSize: '1.05rem', 
            fontWeight: 700,
            margin: 0, 
            color: '#1E1B18', 
            lineHeight: 1.35, 
            display: '-webkit-box', 
            WebkitLineClamp: 2, 
            WebkitBoxOrient: 'vertical', 
            overflow: 'hidden',
            fontFamily: 'Playfair Display, serif'
          }}>
            {book.title}
          </h3>
          <p style={{ margin: 0, color: '#8A827A', fontSize: '0.85rem', fontWeight: 500 }}>{author}</p>
          
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: 'auto', paddingTop: '10px' }}>
            {genres.slice(0, 2).map((g: string) => (
              <span key={g} className="badge">{g}</span>
            ))}
          </div>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginTop: '8px', 
            fontSize: '0.82rem',
            borderTop: '1px solid #E8E2D9',
            paddingTop: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Star size={14} className="star" fill="#D4AF37" color="#D4AF37" />
              <span style={{ color: '#4A4540', fontWeight: 700 }}>{rating.toFixed(1)}</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#8A827A' }}>
              <Calendar size={12} />
              <span>{year}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
