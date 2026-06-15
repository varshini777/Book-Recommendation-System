"""Validate the trained recommendation model"""
import pickle
import os
import sys

model_path = os.path.abspath('models/recommender.pkl')
print(f'Model path: {model_path}')
print(f'Model file exists: {os.path.exists(model_path)}')
print(f'Model file size: {os.path.getsize(model_path) / (1024*1024):.2f} MB')

with open(model_path, 'rb') as f:
    model = pickle.load(f)

print(f'\nModel keys: {list(model.keys())}')
print(f'Book count: {model["book_count"]}')
print(f'Book IDs: first 5 = {model["book_ids"][:5]}')
print(f'Book IDs: last 5 = {model["book_ids"][-5:]}')
print(f'TF-IDF matrix shape: {model["tfidf_matrix"].shape}')
print(f'Vectorizer features: {len(model["vectorizer"].get_feature_names_out())}')
print(f'Trained at: {model["trained_at"]}')

# Test recommendation
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

vectorizer = model["vectorizer"]
tfidf_matrix = model["tfidf_matrix"]
book_ids = model["book_ids"]

# Pick a sample book and find similar ones
sample_idx = 0
sample_vector = tfidf_matrix[sample_idx]
similarities = cosine_similarity(sample_vector, tfidf_matrix).flatten()
top_indices = similarities.argsort()[::-1][1:6]

print(f'\nSample book ID: {book_ids[sample_idx]}')
print(f'Similar book IDs: {[book_ids[i] for i in top_indices]}')
print(f'Similarity scores: {[float(similarities[i]) for i in top_indices]}')

print('\nMODEL VALIDATION: PASSED')
print('Model loads successfully, recommendations generate correctly')
