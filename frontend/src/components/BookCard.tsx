import Link from 'next/link';
import { Star, Calendar, Info } from 'lucide-react';
import { isValidCoverUrl } from '@/lib/utils';
import { useState } from 'react';

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
    rating_count?: number;
    year?: number;
    score?: number;
    description?: string;
    explanation?: string;
  };
  showScore?: boolean;
  showExplanation?: boolean;
}

const PLACEHOLDER_GRADIENT = 'linear-gradient(135deg, #6A1B29 0%, #4A101A 50%, #2D0A12 100%)';

function CoverPlaceholder({ title, author, genre }: { title: string; author: string; genre?: string }) {
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0,
      width: '100%', height: '100%',
      background: PLACEHOLDER_GRADIENT,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '8px',
      padding: '16px',
    }}>
      <span style={{
        fontFamily: 'Playfair Display, serif',
        fontSize: '1.1rem',
        color: '#D4AF37',
        textAlign: 'center',
        lineHeight: 1.3,
        fontWeight: 700,
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {title}
      </span>
      <span style={{
        fontSize: '0.8rem',
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
      }}>
        {author}
      </span>
      {genre && (
        <span style={{
          fontSize: '0.68rem',
          color: '#D4AF37',
          border: '1px solid rgba(212, 175, 55, 0.4)',
          padding: '2px 8px',
          borderRadius: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          {genre}
        </span>
      )}
    </div>
  );
}

export default function BookCard({ book, showScore, showExplanation }: BookCardProps) {
  const genres = book.genres || book.genre || [];
  const rating = book.rating || 0;
  const year = book.year || null;
  const cover = book.cover || book.cover_url || '';
  const author = book.author || book.author_name || 'Unknown Author';
  const [imgFailed, setImgFailed] = useState(false);

  const showImage = isValidCoverUrl(cover) && !imgFailed;

  return (
    <Link href={`/catalog/${book.id}`} style={{ textDecoration: 'none', height: '100%' }}>
      <div className="card" style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        height: '100%',
        cursor: 'pointer',
      }}>
        <div style={{
          position: 'relative',
          width: '100%',
          paddingBottom: '145%',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: '0 8px 24px -8px rgba(0,0,0,0.15)',
        }}>
          {showImage ? (
            <img
              src={cover}
              alt={book.title}
              className="book-cover"
              style={{
                position: 'absolute', top: 0, left: 0,
                width: '100%', height: '100%',
                objectFit: 'cover',
                background: '#F5EFEB',
              }}
              loading="lazy"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <CoverPlaceholder title={book.title} author={author} genre={genres[0]} />
          )}

          {rating > 0 && (
            <div style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(8px)',
              color: 'white',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.72rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <Star size={11} fill="#D4AF37" color="#D4AF37" />
              {rating.toFixed(1)}
            </div>
          )}

          {showScore && 'score' in book && (
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'rgba(106, 27, 41, 0.95)',
              backdropFilter: 'blur(8px)',
              color: 'white',
              padding: '5px 12px',
              borderRadius: '20px',
              fontSize: '0.68rem',
              fontWeight: 700,
              boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
              border: '1px solid rgba(255,255,255,0.15)',
              letterSpacing: '0.02em',
            }}>
              {(book.score ?? 0) > 5 ? 'Top Match' : 'For You'}
            </div>
          )}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: 700,
            margin: 0,
            color: 'var(--text-primary)',
            lineHeight: 1.35,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            fontFamily: 'Playfair Display, serif',
          }}>
            {book.title}
          </h3>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 500 }}>
            {author}
          </p>

          {showExplanation && book.explanation && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '6px',
              background: 'rgba(106,27,41,0.04)', borderRadius: '8px',
              padding: '8px 10px', marginTop: '4px',
            }}>
              <Info size={12} style={{ color: 'var(--burgundy)', marginTop: '2px', flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4, fontWeight: 500 }}>
                {book.explanation}
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: 'auto', paddingTop: '8px' }}>
            {genres.slice(0, 2).map((g: string) => (
              <span key={g} className="badge" style={{ fontSize: '0.68rem', padding: '3px 10px' }}>{g}</span>
            ))}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '8px',
            fontSize: '0.8rem',
            borderTop: '1px solid var(--border)',
            paddingTop: '8px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Star size={13} className="star" fill="#D4AF37" color="#D4AF37" />
              <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{rating.toFixed(1)}</span>
              {book.rating_count !== undefined && book.rating_count > 0 && (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                  ({book.rating_count.toLocaleString()})
                </span>
              )}
            </div>

            {year && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                <Calendar size={11} />
                <span>{year}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
