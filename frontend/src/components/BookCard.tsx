import Link from 'next/link';
import { Book } from '@/lib/data';

interface BookCardProps {
  book: Book;
  showScore?: boolean;
}

export default function BookCard({ book, showScore }: BookCardProps) {
  return (
    <Link href={`/catalog/${book.id}`} style={{ textDecoration: 'none' }}>
      <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
        <div style={{ position: 'relative', width: '100%', paddingBottom: '140%', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={book.cover} 
            alt={book.title} 
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
          />
          {showScore && 'score' in book && (
            <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
              {(book as any).score > 5 ? 'Highly Recommended' : 'Recommended'}
            </div>
          )}
        </div>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {book.title}
          </h3>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>{book.author}</p>
          
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: 'auto', paddingTop: '8px' }}>
            {book.genre.slice(0, 2).map(g => (
              <span key={g} className="badge">{g}</span>
            ))}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', fontSize: '0.85rem' }}>
            <span className="star">★</span>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{book.rating.toFixed(1)}</span>
            <span style={{ color: 'var(--border)', margin: '0 4px' }}>|</span>
            <span style={{ color: 'var(--text-muted)' }}>{book.year}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
