from fastapi import FastAPI, Request, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse, FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import json
from generator import generate_roadmaps_for_user
from generator_core import get_recommended_fields
from data_ingest import DATA_DIR
from pathlib import Path
import os
import time
import urllib.request
import re

app = FastAPI()

_tiobe_cache = None
_tiobe_cache_time = 0
_TIOBE_CACHE_TTL = 86400  # 24 hours

def fetch_tiobe_index():
    global _tiobe_cache, _tiobe_cache_time
    now = time.time()
    if _tiobe_cache and (now - _tiobe_cache_time < _TIOBE_CACHE_TTL):
        return _tiobe_cache

    try:
        req = urllib.request.Request('https://www.tiobe.com/tiobe-index/', headers={'User-Agent': 'Mozilla/5.0'})
        html = urllib.request.urlopen(req).read().decode('utf-8')

        table_match = re.search(r'<table id="top20".*?>(.*?)</table>', html, re.DOTALL)
        rankings = {}
        if table_match:
            rows = re.findall(r'<tr>(.*?)</tr>', table_match.group(1), re.DOTALL)
            for row in rows:
                cols = re.findall(r'<td>(.*?)</td>', row, re.DOTALL)
                if len(cols) >= 5:
                    rank = re.sub(r'<[^>]+>', '', cols[0]).strip()
                    name = re.sub(r'<[^>]+>', '', cols[3]).strip()
                    if rank and name and rank.isdigit():
                        rankings[name.lower()] = int(rank)
                        
        awards = {}
        tables = re.findall(r'<table.*?>(.*?)</table>', html, re.DOTALL)
        if len(tables) > 3:
            hof_table = tables[3]
            rows = re.findall(r'<tr>(.*?)</tr>', hof_table, re.DOTALL)
            if not rows:
                rows = hof_table.split('<tr>')
            for row in rows:
                cols = re.findall(r'<td>(.*?)</td>', row, re.DOTALL)
                if len(cols) >= 2:
                    year = re.sub(r'<[^>]+>', '', cols[0]).strip()
                    lang = re.sub(r'<[^>]+>', '', cols[1]).strip()
                    if year and lang and year.isdigit():
                        if lang.lower() not in awards:
                            awards[lang.lower()] = []
                        awards[lang.lower()].append(int(year))
            
        _tiobe_cache = {"rankings": rankings, "awards": awards}
        _tiobe_cache_time = now
        return _tiobe_cache
    except Exception as e:
        print(f"Error fetching TIOBE index: {e}")
    
    return _tiobe_cache or {"rankings": {}, "awards": {}}


# serve static frontend from the new Vite-based app
# We assume the build output is in ../frontend/dist relative to this file
FRONTEND_DIST = Path('../frontend/dist')

if FRONTEND_DIST.exists():
    app.mount('/assets', StaticFiles(directory=FRONTEND_DIST / 'assets'), name='assets')

# We also keep the old static for generated images
if Path('static').exists():
    app.mount('/static', StaticFiles(directory='static'), name='static')

@app.get('/')
async def read_root():
    index_file = FRONTEND_DIST / 'index.html'
    if index_file.exists():
        return FileResponse(index_file)
    return {"message": "NovaPlan Python API is running"}

# allow local dev frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get('/health')
async def health():
    return {'status':'ok'}

@app.post('/generate')
async def generate(request: Request):
    payload = await request.json()
    out = generate_roadmaps_for_user(payload)
    return JSONResponse(content=out)

@app.post('/recommend_fields')
async def recommend_fields(request: Request):
    """Given a career and a language, return recommended related fields via Gemini."""
    payload = await request.json()
    career = payload.get('career', '')
    language = payload.get('language', '')
    if not career or not language:
        return JSONResponse(content={'error': 'career and language are required'}, status_code=400)
    recommendations = get_recommended_fields(career, language)
    return JSONResponse(content={'recommendations': recommendations})

@app.post('/nlp_suggest')
async def nlp_suggest(request: Request):
    """Accept a user self-description and return top career matches using embeddings.
    Validates input for gibberish and relevance before processing."""
    import re
    from generator import suggest_career_from_summary, CAREER_DATASET

    payload = await request.json()
    user_summary = payload.get('user_summary', '').strip()

    if not user_summary:
        return JSONResponse(content={'error': 'Please provide a description about yourself.'}, status_code=400)

    # ── 1. Gibberish detection ──
    words = user_summary.split()
    if len(words) < 3:
        return JSONResponse(content={
            'error': 'too_short',
            'message': 'Please write at least a few sentences about your interests, skills, and what excites you.'
        }, status_code=400)

    # Check for consonant-heavy gibberish: words with very few vowels relative to length
    vowels = set('aeiouAEIOU')
    gibberish_count = 0
    for w in words:
        clean = re.sub(r'[^a-zA-Z]', '', w)
        if len(clean) > 3:
            vowel_ratio = sum(1 for ch in clean if ch in vowels) / len(clean)
            if vowel_ratio < 0.15:
                gibberish_count += 1
    if gibberish_count > len(words) * 0.4:
        return JSONResponse(content={
            'error': 'gibberish',
            'message': 'Your text doesn\'t seem to contain real words. Please describe yourself naturally — your interests, hobbies, and skills.'
        }, status_code=400)

    # ── 2. Relevance check ──
    # Build a set of career-adjacent keywords from the dataset
    relevance_keywords = set()
    for c in CAREER_DATASET:
        for skill in c.get('skills', []):
            for token in skill.lower().split():
                if len(token) > 3:
                    relevance_keywords.add(token)
        career_words = c.get('career', '').lower().split()
        for token in career_words:
            if len(token) > 3:
                relevance_keywords.add(token)
        cat_words = c.get('category', '').lower().split()
        for token in cat_words:
            if len(token) > 3:
                relevance_keywords.add(token)

    # Broad natural-language vocabulary: interests, personality, activities, verbs, fields
    relevance_keywords.update([
        # Interest/personality words
        'enjoy', 'love', 'like', 'hate', 'prefer', 'interested', 'passionate',
        'fascinated', 'curious', 'excited', 'motivated', 'driven', 'care',
        'skilled', 'good', 'great', 'strong', 'talent', 'gifted', 'natural',
        'experience', 'hobby', 'hobbies', 'dream', 'goal', 'aspire', 'want',
        # Activities & verbs
        'build', 'building', 'create', 'creating', 'make', 'making',
        'design', 'designing', 'draw', 'drawing', 'paint', 'painting',
        'code', 'coding', 'program', 'programming', 'develop', 'developing',
        'solve', 'solving', 'fix', 'fixing', 'tinker', 'tinkering',
        'analyze', 'analyzing', 'research', 'researching', 'study', 'studying',
        'write', 'writing', 'read', 'reading', 'learn', 'learning',
        'teach', 'teaching', 'help', 'helping', 'organize', 'organizing',
        'lead', 'leading', 'manage', 'managing', 'plan', 'planning',
        'work', 'working', 'think', 'thinking', 'explore', 'exploring',
        'play', 'playing', 'cook', 'cooking', 'photograph', 'photography',
        'edit', 'editing', 'film', 'filming', 'record', 'recording',
        'hack', 'hacking', 'debug', 'debugging', 'test', 'testing',
        # Fields & subjects
        'computer', 'computers', 'tech', 'technology', 'science', 'math',
        'mathematics', 'physics', 'chemistry', 'biology', 'medicine',
        'engineering', 'software', 'hardware', 'network', 'security',
        'cyber', 'cybersecurity', 'data', 'database', 'cloud', 'server',
        'website', 'mobile', 'game', 'games', 'gaming', 'animation',
        'robot', 'robotics', 'machine', 'artificial', 'intelligence',
        'business', 'finance', 'money', 'invest', 'investing', 'trade',
        'marketing', 'sales', 'accounting', 'economics', 'management',
        'health', 'medical', 'hospital', 'patient', 'nurse', 'doctor',
        'legal', 'justice', 'law', 'crime', 'police', 'forensic',
        'education', 'school', 'university', 'student', 'teacher',
        'art', 'arts', 'music', 'sport', 'sports', 'fitness',
        'animals', 'nature', 'environment', 'climate', 'space', 'astronomy',
        'language', 'languages', 'communication', 'media', 'journalism',
        # Personality traits
        'creative', 'logical', 'analytical', 'detail', 'detailed',
        'organized', 'patient', 'ambitious', 'focused', 'dedicated',
        'independent', 'team', 'social', 'introvert', 'extrovert',
        'leader', 'follower', 'flexible', 'adaptable', 'reliable',
        'careful', 'precise', 'fast', 'quick', 'smart', 'clever',
        'curious', 'adventurous', 'calm', 'energetic', 'hands',
        # Informal/conversational
        'stuff', 'things', 'cool', 'awesome', 'fun', 'pretty',
        'really', 'always', 'never', 'sometimes', 'often', 'kind',
        'type', 'person', 'people', 'world', 'life', 'future',
        'career', 'job', 'jobs', 'profession', 'field', 'industry',
        'problem', 'problems', 'solution', 'ideas', 'project', 'projects',
        'apps', 'tools', 'machines', 'devices', 'internet', 'online',
        'digital', 'virtual', 'real', 'physical', 'hands-on', 'practical',
        'numbers', 'patterns', 'puzzles', 'challenges', 'systems',
    ])

    user_tokens = set(re.findall(r'[a-zA-Z]{3,}', user_summary.lower()))
    overlap = user_tokens & relevance_keywords
    # Only 1 relevant word needed — the embeddings model does the heavy lifting
    if len(overlap) < 1 and len(words) > 4:
        return JSONResponse(content={
            'error': 'irrelevant',
            'message': 'Your description doesn\'t seem related to career interests. Try describing what subjects, activities, or fields excite you — like in the example.'
        }, status_code=400)

    # ── 3. Valid input — get suggestions ──
    suggestions = suggest_career_from_summary(user_summary)
    return JSONResponse(content={'suggestions': suggestions})

@app.get('/api/careers_data')
async def get_careers_data():
    file_path = DATA_DIR / 'categorized_careers_by_education.json'
    if not file_path.exists():
        raise HTTPException(status_code=404, detail='Careers data not found')
    return FileResponse(file_path, media_type='application/json')

@app.get('/api/tiobe')
def get_tiobe():
    """Fetch and return the dynamic TIOBE index rankings and awards."""
    data = fetch_tiobe_index()
    return JSONResponse(content=data)

@app.get('/download')
async def download():
    path = 'generated_roadmaps_output.json'
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail='Output not found')
    return FileResponse(path, media_type='application/json', filename='generated_roadmaps_output.json')

@app.post('/upload_onet')
async def upload_onet(file: UploadFile = File('onet_upload.zip')):
    # Accept manual O*NET zip upload and extract
    data_path = DATA_DIR / 'onet_upload.zip'
    with open(data_path, 'wb') as f:
        f.write(await file.read())
    return {'status':'uploaded', 'path': str(data_path)}

if __name__ == '__main__':
    uvicorn.run(app, host='0.0.0.0', port=8000)
