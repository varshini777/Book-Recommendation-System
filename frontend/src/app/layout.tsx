import type { Metadata } from "next";
import "./globals.css";
import NavBar from "../components/NavBar";
import Toast from "../components/Toast";

export const metadata: Metadata = {
  title: "LitRealm - Intelligent Book Recommendation System",
  description: "Discover your next favorite book with AI-powered personalized recommendations. Build your library, track reading progress, and explore thousands of curated titles.",
  keywords: "book recommendations, reading, library, AI, machine learning, TF-IDF",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <NavBar />
        <Toast />
        <main style={{ minHeight: "calc(100vh - 72px)" }}>
          {children}
        </main>
        <footer style={{
          background: "linear-gradient(135deg, #0E172A 0%, #1A1035 100%)",
          color: "white",
          textAlign: "center",
          padding: "32px 24px",
          fontSize: "0.85rem",
        }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
            <div style={{
              fontFamily: "Cinzel, serif",
              fontSize: "1.3rem",
              color: "#D4AF37",
              marginBottom: "8px",
              letterSpacing: "0.08em"
            }}>
              LitRealm
            </div>
            <p style={{ color: "#9CA3AF", margin: "0 0 4px 0", fontSize: "0.82rem" }}>
              Intelligent Book Recommendation System
            </p>
            <p style={{ color: "#6B7280", margin: 0, fontSize: "0.75rem" }}>
              MCA Final Year Project 2025-26 &middot; Powered by TF-IDF &amp; Cosine Similarity
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
