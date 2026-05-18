import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "../lib/store";
import NavBar from "../components/NavBar";

export const metadata: Metadata = {
  title: "LitRealm — Personalized Book Recommendation System",
  description: "Discover your next favourite book with AI-powered personalized recommendations. Build your library, track reading progress, and explore thousands of titles.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          <NavBar />
          <main style={{ minHeight: "calc(100vh - 68px)" }}>
            {children}
          </main>
          <footer style={{ background: "var(--navy)", color: "white", textAlign: "center", padding: "24px", fontSize: "0.85rem", opacity: 0.9 }}>
            <span style={{ fontFamily: "Playfair Display, serif", fontSize: "1.1rem", color: "#C9963A" }}>LitRealm</span>
            {"  "}· Intelligent Book Recommendation System · MCA Final Year Project 2025–26
          </footer>
        </AppProvider>
      </body>
    </html>
  );
}
