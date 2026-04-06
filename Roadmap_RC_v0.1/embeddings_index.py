import os
import json
from pathlib import Path
from sentence_transformers import SentenceTransformer
import numpy as np
import faiss

MODEL_NAME = 'all-mpnet-base-v2'
EMBED_DIR = Path('embeddings')
EMBED_DIR.mkdir(exist_ok=True)

# Lazy-load model to avoid blocking app startup
_model = None


def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    return _model


def build_skill_index(skill_texts: list[str], index_path: Path = EMBED_DIR / 'skill_index.faiss') -> dict:
    model = get_model()
    embeddings = model.encode(skill_texts, convert_to_numpy=True, show_progress_bar=True)
    dim = embeddings.shape[1]
    index = faiss.IndexFlatIP(dim)
    faiss.normalize_L2(embeddings)
    index.add(embeddings)
    faiss.write_index(index, str(index_path))
    # save mapping
    mapping = {'skills': skill_texts}
    with open(EMBED_DIR / 'skill_mapping.json','w',encoding='utf-8') as f:
        json.dump(mapping,f)
    return mapping


def load_skill_index(index_path: Path = EMBED_DIR / 'skill_index.faiss') -> tuple:
    index = faiss.read_index(str(index_path))
    with open(EMBED_DIR / 'skill_mapping.json','r',encoding='utf-8') as f:
        mapping = json.load(f)
    return index, mapping


def query_skill(skill_query: str, k=5):
    model = get_model()
    q_emb = model.encode([skill_query], convert_to_numpy=True)
    faiss.normalize_L2(q_emb)
    index, mapping = load_skill_index()
    D, I = index.search(q_emb, k)
    results = [mapping['skills'][i] for i in I[0]]
    return results, D[0]


# ── Career-level embedding index ─────────────────────────────────────────────
# Maps user self-descriptions to matching careers via semantic similarity.

def build_career_index(careers: list[dict], index_path: Path = EMBED_DIR / 'career_index.faiss') -> dict:
    """Build a FAISS index from career descriptions.
    Includes name, category, skills, AND tasks for richer semantic matching."""
    model = get_model()
    texts = []
    career_ids = []
    for c in careers:
        name = c.get('career', '')
        category = c.get('category', '')
        skills = c.get('skills', [])
        tasks = c.get('tasks', [])
        # Build a rich description: name + category + skills + tasks
        parts = [f"{name} in {category}"]
        if skills:
            parts.append("Skills: " + ', '.join(skills[:8]))
        if tasks:
            parts.append("Tasks: " + '; '.join(tasks[:5]))
        text = '. '.join(parts)
        texts.append(text)
        career_ids.append(c.get('id', len(career_ids)))

    embeddings = model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
    dim = embeddings.shape[1]
    index = faiss.IndexFlatIP(dim)
    faiss.normalize_L2(embeddings)
    index.add(embeddings)
    faiss.write_index(index, str(index_path))
    mapping = {'career_ids': career_ids, 'texts': texts}
    with open(EMBED_DIR / 'career_mapping.json', 'w', encoding='utf-8') as f:
        json.dump(mapping, f)
    return mapping


def load_career_index(index_path: Path = EMBED_DIR / 'career_index.faiss') -> tuple:
    """Load the career FAISS index and mapping."""
    index = faiss.read_index(str(index_path))
    with open(EMBED_DIR / 'career_mapping.json', 'r', encoding='utf-8') as f:
        mapping = json.load(f)
    return index, mapping


def query_career(user_text: str, k=5):
    """Find the top-k careers matching a user's self-description.
    Scores are normalized to a meaningful 0-100% range."""
    model = get_model()
    q_emb = model.encode([user_text], convert_to_numpy=True)
    faiss.normalize_L2(q_emb)
    index, mapping = load_career_index()
    D, I = index.search(q_emb, k)
    raw = D[0]
    # Normalize: cosine similarity typically 0.05-0.55 for text.
    # Map to 30%-95% range so scores are meaningful.
    top = float(raw[0]) if len(raw) > 0 else 0.5
    bot = float(raw[-1]) if len(raw) > 1 else top - 0.1
    span = max(top - bot, 0.01)
    results = []
    for idx, s in zip(I[0], raw):
        if idx < len(mapping['career_ids']):
            pct = 0.30 + 0.65 * ((float(s) - bot) / span)
            pct = max(0.10, min(0.95, pct))
            results.append({
                'career_id': mapping['career_ids'][idx],
                'text': mapping['texts'][idx],
                'score': round(pct, 3),
            })
    return results

