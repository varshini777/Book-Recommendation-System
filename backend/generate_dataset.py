import requests
import pandas as pd
import time
import os

ALLOWED_GENRES = [
    "technology", "artificial_intelligence", "computer_science", "cybersecurity", "data_science", 
    "business", "finance", "psychology", "productivity", "biography", "history", "philosophy", 
    "science", "physics", "space", "mystery", "thriller", "adventure", "fantasy", "education", 
    "self_help", "leadership", "innovation"
]

def fetch_books():
    books = []
    seen_titles = set()
    
    for genre in ALLOWED_GENRES:
        print(f"Fetching {genre} from OpenLibrary...")
        try:
            url = f"https://openlibrary.org/subjects/{genre}.json?limit=60"
            response = requests.get(url, timeout=15)
            if response.status_code == 200:
                data = response.json()
                for item in data.get("works", []):
                    title = item.get("title")
                    if not title or title.lower() in seen_titles:
                        continue
                        
                    title_lower = title.lower()
                    unwanted = ["romance", "adult", "erotica", "explicit", "mature", "nsfw", "sex"]
                    if any(bad in title_lower for bad in unwanted):
                        continue
                        
                    authors = ", ".join([a.get("name", "Unknown") for a in item.get("authors", [])])
                    
                    cover_id = item.get("cover_id")
                    cover_url = f"https://covers.openlibrary.org/b/id/{cover_id}-L.jpg" if cover_id else ""
                    
                    books.append({
                        "title": title,
                        "author": authors,
                        "genre": genre.replace("_", " ").title(),
                        "description": f"A notable book in the genre of {genre.replace('_', ' ')}.",
                        "published_date": str(item.get("first_publish_year", "2000")),
                        "page_count": 300,
                        "cover_url": cover_url
                    })
                    seen_titles.add(title_lower)
            time.sleep(1) # respect rate limit
        except Exception as e:
            print(f"Error fetching {genre}: {e}")

    # Convert to dataframe and save
    df = pd.DataFrame(books)
    df = df.drop_duplicates(subset=["title"])
    
    os.makedirs("../dataset", exist_ok=True)
    df.to_csv("../dataset/books_dataset.csv", index=False)
    df.to_excel("../dataset/books_dataset.xlsx", index=False)
    print(f"Saved {len(df)} books to dataset/books_dataset.csv and dataset/books_dataset.xlsx")

if __name__ == "__main__":
    fetch_books()
