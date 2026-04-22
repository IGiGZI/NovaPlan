import json
from dataclasses import dataclass, field
from typing import List, Dict, Any
from google import genai
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urlparse, quote_plus
import weave
import os

os.environ["WANDB_API_KEY"] = "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"
weave.init(project_name="NovaPlan-Gemini-Tracing")

GEMINI_API_KEY = "AIzaSyDNu5VjMve4esuPlwmYOUNlOlgE9pg9jY4"
client = genai.Client(api_key=GEMINI_API_KEY)

# Simple in-memory cache to avoid duplicate gemini calls for the same resource query
_RESOURCE_CACHE = {}

# Cache for URL validation results to avoid re-checking the same URL
_URL_VALIDATION_CACHE = {}

# Domains that are always considered valid (search/listing pages that don't 404)
_TRUSTED_DOMAINS = {
    "www.coursera.org", "coursera.org",
    "www.udemy.com", "udemy.com",
    "www.edx.org", "edx.org",
    "www.youtube.com", "youtube.com",
    "www.google.com", "google.com",
    "www.linkedin.com", "linkedin.com",
    "wuzzuf.net", "www.wuzzuf.net",
    "www.forasna.com", "forasna.com",
    "www.bayt.com", "bayt.com",
    "eg.indeed.com", "indeed.com",
    "www.upwork.com", "upwork.com",
    "www.fiverr.com", "fiverr.com",
    "mostaql.com", "www.mostaql.com",
    "khamsat.com", "www.khamsat.com",
    "www.toptal.com", "toptal.com",
    "grow.google",
    "www.khanacademy.org", "khanacademy.org",
    "www.freecodecamp.org", "freecodecamp.org",
    "github.com", "www.github.com",
    "www.w3schools.com", "w3schools.com",
    "www.geeksforgeeks.org", "geeksforgeeks.org",
    "developer.mozilla.org",
    "docs.python.org",
    "www.faa.gov", "faa.gov",
}


def _validate_url(url: str) -> bool:
    """Check if a URL is reachable (2xx/3xx) via HTTP HEAD request.
    
    Trusted domains (Coursera, Udemy, YouTube, etc.) are always considered valid
    since their search/listing pages always work.
    """
    if url in _URL_VALIDATION_CACHE:
        return _URL_VALIDATION_CACHE[url]
    
    try:
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        
        # Trusted domains are always valid
        if domain in _TRUSTED_DOMAINS:
            _URL_VALIDATION_CACHE[url] = True
            return True
        
        # HEAD request with short timeout
        resp = requests.head(
            url, timeout=4, allow_redirects=True,
            headers={"User-Agent": "Mozilla/5.0 (compatible; NovaPlan/1.0)"}
        )
        is_valid = resp.status_code < 400
        _URL_VALIDATION_CACHE[url] = is_valid
        return is_valid
    except Exception:
        _URL_VALIDATION_CACHE[url] = False
        return False


def _validate_resources(resources: List[Dict[str, str]]) -> List[Dict[str, str]]:
    """Validate a list of resources in parallel, removing ones with broken URLs."""
    if not resources:
        return resources
    
    valid = []
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {
            executor.submit(_validate_url, r["url"]): r
            for r in resources
        }
        for future in as_completed(futures):
            resource = futures[future]
            try:
                if future.result():
                    valid.append(resource)
                else:
                    print(f"  ✗ Dropped broken URL: {resource['url']}")
            except Exception:
                print(f"  ✗ Dropped broken URL: {resource['url']}")
    
    # Preserve original order
    url_set = {r["url"] for r in valid}
    return [r for r in resources if r["url"] in url_set]

# ── Phase names mapped to the 7-task structure in the dataset ────────────────
# Self-study careers have these 7 phases:
#   1. Certification (optional cert/bootcamp)
#   2. Core Skill Learning (fundamentals)
#   3. Intermediate / Advanced Skills (deepening)
#   4. Hands-on Practice (real projects)
#   5. Portfolio Building (showcase work)
#   6. CV / Profile Building (prepare yourself)
#   7. Job Application / Freelancing (go get hired)
#
# University careers follow the same pattern but phase 1 is degree enrollment.

SELF_STUDY_PHASE_NAMES = [
    "Certification",
    "Core Skill Learning",
    "Intermediate / Advanced Skills",
    "Hands-on Practice",
    "Portfolio Building",
    "CV / Profile Building",
    "Job Application / Freelancing",
]

UNIVERSITY_PHASE_NAMES = [
    "Degree / Formal Education",
    "Core Skill Learning",
    "Intermediate / Advanced Skills",
    "Hands-on Practice",
    "Portfolio Building",
    "CV / Profile Building",
    "Job Application",
]


def _detect_learning_path(career: Dict[str, Any]) -> str:
    """Detect if a career is self-study or university based on its first task."""
    tasks = career.get("tasks", [])
    if not tasks:
        return "self_study"
    first_task = tasks[0].lower()
    if "enroll" in first_task or "degree" in first_task or "master" in first_task:
        return "university"
    return "self_study"


# ── Reliable resources for job application phases ────────────────────────────
# These use career-specific search URLs so users land on relevant job listings.


def _get_job_phase_resources(career_name: str, learning_path: str) -> List[Dict[str, str]]:
    """Return reliable job application resources with career-specific search URLs.
    
    University careers get Egyptian job boards only.
    Self-study careers get Egyptian job boards + freelancing platforms.
    """
    q = career_name.replace(" ", "+")
    q_url = career_name.replace(" ", "-")

    resources = [
        {"title": f"{career_name} jobs on Wuzzuf", "url": f"https://wuzzuf.net/search/jobs/?q={q}&a=hpb"},
        {"title": f"{career_name} jobs on Forasna", "url": f"https://www.forasna.com/jobs/search/{q_url}"},
        {"title": f"{career_name} jobs on LinkedIn", "url": f"https://www.linkedin.com/jobs/search/?keywords={q}&location=Egypt"},
        {"title": f"{career_name} jobs on Bayt.com", "url": f"https://www.bayt.com/en/egypt/jobs/{q_url}-jobs/"},
        {"title": f"{career_name} jobs on Indeed Egypt", "url": f"https://eg.indeed.com/jobs?q={q}"},
    ]

    if learning_path != "university":
        resources.extend([
            {"title": f"{career_name} freelance jobs on Upwork", "url": f"https://www.upwork.com/freelance-jobs/{q_url}/"},
            {"title": f"{career_name} services on Fiverr", "url": f"https://www.fiverr.com/search/gigs?query={q}"},
            {"title": f"{career_name} projects on Mostaql", "url": f"https://mostaql.com/projects?keyword={q}"},
            {"title": f"Khamsat - Arabic Micro Services", "url": "https://khamsat.com/"},
            {"title": f"{career_name} freelance on Toptal", "url": "https://www.toptal.com/"},
        ])

    return resources


def _get_egyptian_university_fallback(career_name: str) -> List[Dict[str, str]]:
    """Return real Egyptian university links for the Degree / Formal Education phase.
    
    Uses keyword matching on the career name to find the right faculties.
    All URLs point to actual Egyptian university faculty/department homepages.
    """
    name = career_name.lower()
    
    # ── Keyword → Egyptian university faculty mapping ────────────────────────
    # Each entry: (keywords_list, results_list)
    FACULTY_MAP = [
        # Law
        (["law", "lawyer", "legal", "attorney", "advocate", "judge", "prosecutor"],
         [
            {"title": "Faculty of Law — Cairo University", "url": "https://cu.edu.eg/ar/Faculty-Of-Law"},
            {"title": "Faculty of Law — Ain Shams University", "url": "https://law.asu.edu.eg/"},
            {"title": "Faculty of Law — Alexandria University", "url": "https://law.alexu.edu.eg/"},
            {"title": "Faculty of Law — Mansoura University", "url": "https://www.mans.edu.eg/en/faculties/faculty-of-law"},
            {"title": "Faculty of Law — Helwan University", "url": "https://www.helwan.edu.eg/law/"},
         ]),
        # Medicine & Healthcare
        (["doctor", "physician", "surgeon", "medical", "medicine", "clinical", "patholog", "anesthesi", "cardiolog", "neurolog", "dermatolog", "pediatr", "psychiatr", "radiolog", "oncolog"],
         [
            {"title": "Faculty of Medicine — Cairo University (Kasr Al-Ainy)", "url": "https://medicine.cu.edu.eg/"},
            {"title": "Faculty of Medicine — Ain Shams University", "url": "https://med.asu.edu.eg/"},
            {"title": "Faculty of Medicine — Alexandria University", "url": "https://med.alexu.edu.eg/"},
            {"title": "Faculty of Medicine — Mansoura University", "url": "https://www.mans.edu.eg/en/faculties/faculty-of-medicine"},
            {"title": "Faculty of Medicine — Tanta University", "url": "https://med.tanta.edu.eg/"},
         ]),
        # Dentistry
        (["dentist", "dental", "orthodont"],
         [
            {"title": "Faculty of Dentistry — Cairo University", "url": "https://dentistry.cu.edu.eg/"},
            {"title": "Faculty of Dentistry — Ain Shams University", "url": "https://dent.asu.edu.eg/"},
            {"title": "Faculty of Dentistry — Alexandria University", "url": "https://dent.alexu.edu.eg/"},
            {"title": "Faculty of Dentistry — Mansoura University", "url": "https://www.mans.edu.eg/en/faculties/faculty-of-dentistry"},
         ]),
        # Pharmacy
        (["pharma", "drug", "apothecary"],
         [
            {"title": "Faculty of Pharmacy — Cairo University", "url": "https://pharmacy.cu.edu.eg/"},
            {"title": "Faculty of Pharmacy — Ain Shams University", "url": "https://pharm.asu.edu.eg/"},
            {"title": "Faculty of Pharmacy — Alexandria University", "url": "https://pharm.alexu.edu.eg/"},
            {"title": "Faculty of Pharmacy — Mansoura University", "url": "https://www.mans.edu.eg/en/faculties/faculty-of-pharmacy"},
         ]),
        # Veterinary
        (["veterinar", "animal", "livestock"],
         [
            {"title": "Faculty of Veterinary Medicine — Cairo University", "url": "https://vet.cu.edu.eg/"},
            {"title": "Faculty of Veterinary Medicine — Alexandria University", "url": "https://vet.alexu.edu.eg/"},
            {"title": "Faculty of Veterinary Medicine — Zagazig University", "url": "https://www.zu.edu.eg/FacultyPage.aspx?fid=16"},
            {"title": "Faculty of Veterinary Medicine — Mansoura University", "url": "https://www.mans.edu.eg/en/faculties/faculty-of-veterinary-medicine"},
         ]),
        # Engineering (Mechanical, Electrical, Civil, Aerospace, etc.)
        (["engineer", "mechanic", "electrical", "civil", "structural", "construction", "aerospace", "mechatron", "automo", "welding", "solar", "renewable", "energy", "power plant", "hvac", "plumb"],
         [
            {"title": "Faculty of Engineering — Cairo University", "url": "https://eng.cu.edu.eg/en/"},
            {"title": "Faculty of Engineering — Ain Shams University", "url": "https://eng.asu.edu.eg/"},
            {"title": "Faculty of Engineering — Alexandria University", "url": "https://eng.alexu.edu.eg/"},
            {"title": "Arab Academy for Science, Technology & Maritime Transport", "url": "https://aast.edu/en/"},
            {"title": "Faculty of Engineering — Mansoura University", "url": "https://www.mans.edu.eg/en/faculties/faculty-of-engineering"},
         ]),
        # Computer Science / IT
        (["computer", "software", "IT ", "ict", "data", "cyber", "network", "system admin", "cloud", "devops", "information tech"],
         [
            {"title": "Faculty of Computers & AI — Cairo University", "url": "https://fci.cu.edu.eg/"},
            {"title": "Faculty of Computer & Information Sciences — Ain Shams University", "url": "https://cis.asu.edu.eg/"},
            {"title": "Faculty of Computers & Data Science — Alexandria University", "url": "https://cds.alexu.edu.eg/"},
            {"title": "Faculty of Computers & Information — Helwan University", "url": "https://www.helwan.edu.eg/fci/"},
            {"title": "German University in Cairo — Informatics", "url": "https://www.guc.edu.eg/"},
         ]),
        # Business / Management / HR / Finance / Accounting
        (["business", "manager", "management", "hr ", "human resource", "financ", "account", "bank", "marketing", "sales", "merchant", "wholesale", "retail", "import", "export", "distribution", "supply chain", "logistics", "trade", "commerce", "economist", "econom"],
         [
            {"title": "Faculty of Commerce — Cairo University", "url": "https://commerce.cu.edu.eg/"},
            {"title": "Faculty of Commerce — Ain Shams University", "url": "https://commerce.asu.edu.eg/"},
            {"title": "Faculty of Commerce — Alexandria University", "url": "https://commerce.alexu.edu.eg/"},
            {"title": "School of Business — American University in Cairo", "url": "https://www.aucegypt.edu/business"},
            {"title": "Faculty of Commerce — Mansoura University", "url": "https://www.mans.edu.eg/en/faculties/faculty-of-commerce"},
         ]),
        # Education / Teaching
        (["teacher", "teach", "education", "instructor", "tutor", "pedagog"],
         [
            {"title": "Faculty of Education — Ain Shams University", "url": "https://edu.asu.edu.eg/"},
            {"title": "Faculty of Education — Cairo University", "url": "https://fedu.cu.edu.eg/"},
            {"title": "Faculty of Education — Alexandria University", "url": "https://edu.alexu.edu.eg/"},
            {"title": "Faculty of Education — Helwan University", "url": "https://www.helwan.edu.eg/education/"},
         ]),
        # Architecture & Urban Planning
        (["architect", "urban plan", "interior design"],
         [
            {"title": "Faculty of Engineering — Architecture Dept, Cairo University", "url": "https://eng.cu.edu.eg/en/"},
            {"title": "Faculty of Fine Arts — Helwan University", "url": "https://www.helwan.edu.eg/fine-arts/"},
            {"title": "Faculty of Engineering — Ain Shams University", "url": "https://eng.asu.edu.eg/"},
            {"title": "Arab Academy for Science & Technology — Architecture", "url": "https://aast.edu/en/"},
         ]),
        # Arts, Media & Communication
        (["journalist", "media", "broadcast", "film", "cinema", "communic", "public relation"],
         [
            {"title": "Faculty of Mass Communication — Cairo University", "url": "https://masscom.cu.edu.eg/"},
            {"title": "Faculty of Arts — Ain Shams University", "url": "https://alsun.asu.edu.eg/"},
            {"title": "Faculty of Arts — Alexandria University", "url": "https://arts.alexu.edu.eg/"},
         ]),
        # Social Work / Psychology
        (["social work", "psycholog", "counsell", "therapist", "mental health"],
         [
            {"title": "Faculty of Social Work — Helwan University", "url": "https://www.helwan.edu.eg/socialwork/"},
            {"title": "Faculty of Arts (Psychology) — Cairo University", "url": "https://arts.cu.edu.eg/"},
            {"title": "Faculty of Arts (Psychology) — Ain Shams University", "url": "https://arts.asu.edu.eg/"},
         ]),
        # Agriculture
        (["agricultur", "agro", "farm", "crop", "horticult", "food science"],
         [
            {"title": "Faculty of Agriculture — Cairo University", "url": "https://agr.cu.edu.eg/"},
            {"title": "Faculty of Agriculture — Ain Shams University", "url": "https://agr.asu.edu.eg/"},
            {"title": "Faculty of Agriculture — Alexandria University", "url": "https://agr.alexu.edu.eg/"},
         ]),
        # Science (Physics, Chemistry, Biology, Math, etc.)
        (["scientist", "physicist", "chemist", "biologist", "geolog", "mathemat", "research", "laborator"],
         [
            {"title": "Faculty of Science — Cairo University", "url": "https://sci.cu.edu.eg/"},
            {"title": "Faculty of Science — Ain Shams University", "url": "https://sci.asu.edu.eg/"},
            {"title": "Faculty of Science — Alexandria University", "url": "https://sci.alexu.edu.eg/"},
            {"title": "Faculty of Science — Mansoura University", "url": "https://www.mans.edu.eg/en/faculties/faculty-of-science"},
         ]),
        # Nursing
        (["nurs"],
         [
            {"title": "Faculty of Nursing — Cairo University", "url": "https://nursing.cu.edu.eg/"},
            {"title": "Faculty of Nursing — Ain Shams University", "url": "https://nurs.asu.edu.eg/"},
            {"title": "Faculty of Nursing — Alexandria University", "url": "https://nurs.alexu.edu.eg/"},
         ]),
        # Aviation / Piloting
        (["pilot", "aviat", "flight", "air traffic"],
         [
            {"title": "Egyptian Aviation Academy", "url": "https://eaa.gov.eg/"},
            {"title": "Arab Academy for Science & Technology — Maritime & Transport", "url": "https://aast.edu/en/"},
            {"title": "Egyptian Civil Aviation Authority", "url": "https://www.civilaviation.gov.eg/"},
         ]),
    ]
    
    # Try to match career keywords
    for keywords, resources in FACULTY_MAP:
        for kw in keywords:
            if kw in name:
                return resources
    
    # Generic fallback: Tansik (official Egyptian admissions) + top universities
    q = career_name.replace(" ", "+")
    return [
        {"title": f"Search Egyptian university programs for {career_name} — Tansik", "url": f"https://tansik.egypt.gov.eg/"},
        {"title": "Cairo University — Faculties", "url": "https://cu.edu.eg/"},
        {"title": "Ain Shams University — Faculties", "url": "https://www.asu.edu.eg/"},
        {"title": "Alexandria University — Faculties", "url": "https://alexu.edu.eg/"},
        {"title": f"Search {career_name} programs in Egypt", "url": f"https://www.google.com/search?q={q}+degree+egypt+university"},
    ]


# ── Level-aware prompt context ───────────────────────────────────────────────

LEVEL_CONTEXT = {
    "beginner": {
        "label": "beginner",
        "focus": "introductory courses, getting started guides, fundamentals, and beginner-friendly tutorials",
        "keywords": "beginner introductory fundamentals getting started basics crash course",
    },
    "intermediate": {
        "label": "intermediate",
        "focus": "project-based courses, real-world applications, advanced concepts, and hands-on workshops",
        "keywords": "intermediate project-based advanced hands-on real-world practical",
    },
    "pro": {
        "label": "professional/expert",
        "focus": "system design, architecture patterns, expert-level optimization, open-source contribution guides, and senior-level content",
        "keywords": "expert advanced system design architecture senior professional",
    },
}


def _get_subfield_language_resources(sub_field_data: Dict[str, Any]) -> List[Dict[str, str]]:
    """Extract language course links from a sub_field definition as supplementary resources."""
    resources = []
    if not sub_field_data:
        return resources
    for lang in sub_field_data.get("languages", []):
        resources.append({
            "title": f"{lang['name']} courses — {sub_field_data.get('name', 'Specialization')}",
            "url": lang["link"],
        })
    return resources

@weave.op

def _fetch_real_resources_with_gemini(
    career_name: str,
    phase_name: str,
    learning_path: str,
    is_job_phase: bool = False,
    is_first_phase: bool = False,
    career_skills: List[str] = None,
    task_description: str = "",
    experience_level: str = "",
    sub_field_name: str = "",
    selected_language: str = "",
) -> List[Dict[str, str]]:
    """Fetch real resources from Gemini for a given career phase.
    
    Job application phases use hardcoded reliable links (no API call needed).
    
    University careers: ALL resources are Egypt-focused.
      - First phase (degree): Egyptian universities and programs
      - Other phases: Egyptian training centers, Egyptian professional resources
    
    Self-study careers:
      - Other phases: global best resources
    
    career_skills & task_description are injected into every prompt so Gemini
    knows exactly what the career requires and what the phase goal is.
    """
    # Job phases use hardcoded resources — no API call needed, always reliable
    if is_job_phase:
        return _get_job_phase_resources(career_name, learning_path)

    cache_key = f"{career_name}:::{phase_name}:::{learning_path}:::{is_job_phase}:::{is_first_phase}:::{experience_level}:::{sub_field_name}:::{selected_language}"
    if cache_key in _RESOURCE_CACHE:
        return _RESOURCE_CACHE[cache_key]

    # Build skills context for the prompt
    skills_str = ""
    if career_skills:
        skills_str = ", ".join(career_skills[:6])
    
    # Build task context for the prompt
    task_ctx = ""
    if task_description:
        task_ctx = f'\nThe goal of this phase is: "{task_description}"'

    # Build level context for the prompt
    level_ctx = ""
    level_info = LEVEL_CONTEXT.get(experience_level)
    if level_info:
        level_ctx = f"\nThe user is at a {level_info['label']} level. Focus on {level_info['focus']}."
        level_ctx += f"\nInclude {level_info['keywords']} in your search queries to find level-appropriate resources."
    
    # Build sub-field context
    subfield_ctx = ""
    if sub_field_name:
        subfield_ctx = f"\nThe user is specializing in: {sub_field_name}."
    if selected_language:
        subfield_ctx += f"\nThe user has specifically chosen to learn and use {selected_language}. You MUST prioritize resources teaching {selected_language}."

    resource_count_str = "1-3" if experience_level == 'pro' and is_first_phase else "3-5"

    if learning_path == "university":
        # University careers → ALL resources are Egypt-focused
        if is_first_phase:
            prompt = f"""
You are an expert career advisor specializing in Egypt's education system.
I need real Egyptian universities and programs for someone pursuing a career as a {career_name}.{subfield_ctx}
Key skills for this career: {skills_str or 'N/A'}{task_ctx}{level_ctx}

Provide {resource_count_str} resources that are ONLY from Egypt:
1. Egyptian universities that offer relevant degree programs (e.g., Cairo University, Ain Shams University, Alexandria University, AUC, GUC, AAST, Helwan University, Mansoura University, etc.)
2. Egyptian professional certification bodies or training institutes
3. Egyptian government or ministry portals related to this field (if applicable)

All resources MUST be Egyptian institutions with Egyptian URLs (.edu.eg, .eg, or known Egyptian institution websites).

IMPORTANT: Only provide URLs that you are confident actually exist and work.
- Use the main homepage or faculty page URL — NEVER guess a sub-page URL.
- Example good URL: "https://eng.cu.edu.eg/en/" (main faculty page)
- Example BAD URL: "https://eng.cu.edu.eg/en/departments/electrical/admissions" (guessed sub-page)

Return a JSON array of objects. Each object must have exactly two keys:
- "title": A descriptive title (e.g., "Faculty of Medicine - Cairo University", "Engineering Program - AUC")
- "url": The actual valid URL of the Egyptian institution

Return ONLY the valid JSON array, no markdown, no extra text.
"""
        else:
            prompt = f"""
You are an expert career advisor. I am generating a learning roadmap for a {career_name}.{subfield_ctx}
The key skills for this career are: {skills_str or 'N/A'}{task_ctx}{level_ctx}

For the "{phase_name}" phase, I need real resources available in Egypt.

Provide {resource_count_str} resources. ONLY use well-known platforms and institutions where you are confident the URL exists:
1. Courses on major platforms (Coursera, Udemy, edX, YouTube) relevant to {career_name} skills like {skills_str}
2. Egyptian training centers or institutes (use their main website URL, not deep links)
3. Well-known documentation sites, official tool websites, or tutorial platforms

CRITICAL RULES:
- Every URL must be a REAL, WORKING link to a specific course or resource. Do NOT invent or guess URLs.
- Resources MUST be 100% specifically relevant to {career_name} and the language/skills mentioned ({skills_str}), NOT generic or for a different career.
- Do NOT return search result pages. Provide direct links to actual courses, bootcamps, or resources.

Return a JSON array of objects. Each object must have exactly two keys:
- "title": A descriptive title for the resource
- "url": The actual valid URL

Return ONLY the valid JSON array, no markdown, no extra text.
"""
    else:
        # Self-study careers
        if is_first_phase:
            level_search_suffix = ""
            if level_info:
                level_search_suffix = f"+{level_info['keywords'].split()[0]}"

            prompt = f"""
You are an expert career advisor. I am generating a learning roadmap for a {career_name}.{subfield_ctx}
The key skills for this career are: {skills_str or 'N/A'}{task_ctx}{level_ctx}

For the "{phase_name}" phase, I need {resource_count_str} real, high-quality certification courses or bootcamps that are SPECIFICALLY for becoming a {career_name}.

ONLY suggest resources from these well-known platforms where you are confident the URL works:
- Coursera (coursera.org)
- Udemy (udemy.com)
- edX (edx.org)
- freeCodeCamp (freecodecamp.org)
- Google Certificates (grow.google)
- Khan Academy (khanacademy.org)
- YouTube channels/playlists

CRITICAL RULES:
- Every URL must be a REAL, WORKING link to a specific course, certificate, or learning material on one of these platforms.
- Resources MUST be 100% specifically relevant to {career_name} and any specified language/tool (e.g. {skills_str}), NOT for a different career.
- Focus on specific certifications or courses that teach {skills_str or career_name}.
- Do NOT return search result pages. Provide direct links to the actual course/certificate.

Return a JSON array of objects. Each object must have exactly two keys:
- "title": A descriptive title for the specific resource (e.g. "Full Stack Web Development on Coursera")
- "url": The actual valid URL pointing to the course or certificate

Return ONLY the valid JSON array, no markdown formatting, no extra text.
"""
        else:
            level_search_suffix = ""
            if level_info:
                level_search_suffix = f"+{level_info['keywords'].split()[0]}"

            prompt = f"""
You are an expert career advisor. I am generating a learning roadmap for a {career_name}.{subfield_ctx}
The key skills for this career are: {skills_str or 'N/A'}{task_ctx}{level_ctx}

For the "{phase_name}" phase, I need {resource_count_str} real, high-quality resources (courses, tutorials, documentation, tools) that help someone develop {career_name} skills.

ONLY suggest resources from well-known platforms where you are confident the URL works:
- Coursera, Udemy, edX, freeCodeCamp, Khan Academy
- Official documentation sites (e.g., docs.python.org, developer.mozilla.org)
- YouTube educational channels
- GitHub repositories or learning paths
- Well-known tutorial sites (w3schools.com, geeksforgeeks.org)

CRITICAL RULES:
- Every URL must be a REAL, WORKING link to a specific course, tutorial, or piece of documentation. Do NOT invent or guess URLs.
- Resources MUST be 100% specifically relevant to {career_name} and the skills/languages: {skills_str}.
- Do NOT return resources for a different career.
- Do NOT return search result pages. Provide direct links to the actual specific resource.

Return a JSON array of objects. Each object must have exactly two keys:
- "title": A descriptive title for the specific resource
- "url": The actual valid URL pointing to the course, certificate, or resource

Return ONLY the valid JSON array, no markdown formatting, no extra text.
"""
    
    # Build relevance keywords for validation
    relevance_keywords = {career_name.lower()}
    if career_skills:
        for s in career_skills[:4]:
            # add individual words from skill names (e.g. "python" from "programming (python, java)")
            for word in s.lower().replace("(", "").replace(")", "").replace(",", "").split():
                if len(word) > 3:
                    relevance_keywords.add(word)

    for attempt in range(3):
        try:
            if attempt > 0:
                import time
                time.sleep(min(2 ** attempt, 4))
            
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
            )
            text = response.text.strip()
            if text.startswith('```json'): text = text[7:]
            if text.startswith('```'): text = text[3:]
            if text.endswith('```'): text = text[:-3]
            text = text.strip()
            
            results = json.loads(text)
            
            valid_results = []
            for r in results:
                if isinstance(r, dict) and 'title' in r and 'url' in r:
                    valid_results.append(r)
            
            if not valid_results:
                continue
            
            # Relevance check: at least 40% of resources should mention
            # the career name or one of its key skills in the title
            relevant_count = 0
            for r in valid_results:
                title_lower = r.get('title', '').lower()
                if any(kw in title_lower for kw in relevance_keywords):
                    relevant_count += 1
            
            if relevant_count < len(valid_results) * 0.4:
                print(f"WARNING: Gemini returned mostly irrelevant resources for {career_name} - {phase_name}. Retrying...")
                continue
            
            # ── URL Validation: drop broken links ──────────────────────────
            print(f"  Validating {len(valid_results)} URLs for {career_name} — {phase_name}...")
            valid_results = _validate_resources(valid_results)
            
            if len(valid_results) < 2:
                print(f"  ⚠ Only {len(valid_results)} valid URL(s) after validation. Retrying...")
                continue
            
            _RESOURCE_CACHE[cache_key] = valid_results
            return valid_results
        except Exception as e:
            print(f"Gemini API Error for resources (attempt {attempt+1}/3): {e}")
            pass
            
    # Fallback: provide meaningful resources even when Gemini fails
    print(f"WARNING: All Gemini attempts failed for {career_name} - {phase_name}. Using fallback resources.")
    career_query = career_name.replace(" ", "+")
    # Use first skill as additional search context
    skill_query = career_skills[0].replace(" ", "+").replace("(", "").replace(")", "") if career_skills else career_query

    # ── University careers: first phase gets real Egyptian university links ───
    if learning_path == "university" and is_first_phase:
        fallback = _get_egyptian_university_fallback(career_name)
    elif learning_path == "university":
        search_query = f"{career_name}+{phase_name}".replace(" ", "+")
        fallback = [
            {"title": f"{career_name} — {phase_name} courses on Coursera", "url": f"https://www.coursera.org/search?query={search_query}"},
            {"title": f"{career_name} — {phase_name} courses on Udemy", "url": f"https://www.udemy.com/courses/search/?q={search_query}"},
            {"title": f"{career_name} — {phase_name} tutorials on YouTube", "url": f"https://www.youtube.com/results?search_query={search_query}+tutorial"},
            {"title": f"{career_name} training in Egypt", "url": f"https://www.google.com/search?q={search_query}+training+egypt"},
        ]
    elif is_first_phase:
        # Self-study first phase (Certification): career-specific certification resources
        fallback = [
            {"title": f"{career_name} certification on Coursera", "url": f"https://www.coursera.org/search?query={career_query}+certificate"},
            {"title": f"{career_name} certification on Udemy", "url": f"https://www.udemy.com/courses/search/?q={career_query}+certificate"},
            {"title": f"{career_name} courses on edX", "url": f"https://www.edx.org/search?q={career_query}"},
            {"title": f"Google Certificates related to {career_name}", "url": f"https://grow.google/certificates/"},
            {"title": f"{career_name} certification guide on YouTube", "url": f"https://www.youtube.com/results?search_query={career_query}+certification+guide"},
        ]
    else:
        # Self-study other phases: use career name + top skill for targeted searches
        fallback = [
            {"title": f"{career_name} {phase_name} on Coursera", "url": f"https://www.coursera.org/search?query={career_query}+{skill_query}"},
            {"title": f"{career_name} {phase_name} on Udemy", "url": f"https://www.udemy.com/courses/search/?q={career_query}+{skill_query}"},
            {"title": f"{career_name} {phase_name} on YouTube", "url": f"https://www.youtube.com/results?search_query={career_query}+{skill_query}+tutorial"},
        ]
    _RESOURCE_CACHE[cache_key] = fallback
    return fallback



# ── Data classes ─────────────────────────────────────────────────────────────

@dataclass
class RoadmapMilestone:
    title: str
    description: str

@dataclass
class RoadmapResource:
    title: str
    url: str

@dataclass
class RoadmapStep:
    milestones: List[RoadmapMilestone] = field(default_factory=list)
    resources: List[RoadmapResource] = field(default_factory=list)
    children: List['RoadmapStep'] = field(default_factory=list)

@dataclass
class Roadmap:
    path_title: str
    focus: str
    confidence_score: float
    steps: List[RoadmapStep]


def generate_steps_for_career(career: Dict[str, Any], profile_skills: List[str], focus: str, beginner: bool = True, experience_level: str = "", sub_field: str = "", selected_language: str = ""):
    """Generate roadmap steps for a career using the dataset's task structure.
    
    Focus modes:
    - 'Depth': Full 7-phase progressive roadmap (every phase as a separate step)
    - 'Fast-Entry': Condensed 4-phase roadmap that merges phases to get job-ready faster
    
    experience_level: beginner, intermediate, or pro — affects Gemini resource selection
    sub_field: e.g. "Backend Developer" — focuses the roadmap on a specialization
    selected_language: e.g. "Java" — further focuses on a specific language/tool
    
    Resources are fetched from Gemini, with job application resources being Egypt-focused.
    """
    career_name = career.get('career', 'Career')
    career_tasks = career.get('tasks', [])
    learning_path = _detect_learning_path(career)
    
    # If a sub_field is selected, customize the career name for resource queries
    effective_career_name = career_name
    if sub_field:
        effective_career_name = f"{sub_field} ({career_name})"
    
    # Find the sub_field data from the career's sub_fields list
    sub_field_data = None
    if sub_field:
        for sf in career.get('sub_fields', []):
            if sf.get('name', '').lower() == sub_field.lower():
                sub_field_data = sf
                break
    
    # Choose phase names based on learning path
    if learning_path == "university":
        phase_names = UNIVERSITY_PHASE_NAMES
    else:
        phase_names = SELF_STUDY_PHASE_NAMES
    
    # Build the full list of (phase_name, task_text) pairs
    phases = []
    for i, task_text in enumerate(career_tasks):
        pname = phase_names[i] if i < len(phase_names) else f"Phase {i + 1}"
        phases.append((pname, task_text))
    
    if focus == "Fast-Entry" and len(phases) >= 7:
        # Skip the basics for Pro (Fast-Entry):
        #   1. Skill Building = Intermediate/Advanced (phase 2) + Hands-on Practice (phase 3)
        #   2. Professional Profile = Portfolio (phase 4) + CV/Profile (phase 5)
        #   3. Job Application = Job Application (phase 6)
        merged_phases = [
            ("Advanced Skill Building & Practice",
             phases[2][1] + "\n\nThen: " + phases[3][1]),
            ("Portfolio & Professional Profile",
             phases[4][1] + "\n\nThen: " + phases[5][1]),
            (phases[6][0],  # Keep original job application phase name
             phases[6][1]),
        ]
        phases = merged_phases
    
    steps = []
    for i, (phase_name, task_text) in enumerate(phases):
        # Determine if this is the job application phase
        is_job_phase = (i == len(phases) - 1) or "apply for" in task_text.lower() or "job" in phase_name.lower()
        is_first_phase = (i == 0)
        
        # Fetch resources from Gemini with career context + level + sub_field
        career_skills = career.get('skills', [])
        real_resources = _fetch_real_resources_with_gemini(
            effective_career_name, phase_name, learning_path,
            is_job_phase, is_first_phase,
            career_skills=career_skills,
            task_description=task_text,
            experience_level=experience_level,
            sub_field_name=sub_field,
            selected_language=selected_language,
        )
        
        # If this is the first phase and we have sub_field language links, add them as supplementary resources
        if is_first_phase and sub_field_data and focus != "Fast-Entry":
            lang_resources = _get_subfield_language_resources(sub_field_data)
            # Prepend language course links before Gemini resources
            real_resources = lang_resources + real_resources
        
        resources = [RoadmapResource(title=r['title'], url=r['url']) for r in real_resources]
        
        milestone = RoadmapMilestone(
            title=phase_name,
            description=task_text
        )
        
        step = RoadmapStep(
            milestones=[milestone],
            resources=resources,
            children=[]
        )
        steps.append(step)
    
    return steps


def generate_distinct_roadmaps(profile: Dict[str, Any], top_career: Dict[str, Any]):
    """Generate a single roadmap whose style depends on the user's experience level.
    
    - Beginner: Full 7-phase Depth roadmap (comprehensive, step-by-step)
    - Intermediate: Full 7-phase Depth roadmap (with intermediate-level resources)
    - Pro: Condensed 4-phase Fast-Entry roadmap (gets job-ready faster)
    - No level specified: defaults to full Depth roadmap
    """
    experience_level = profile.get('experience_level', '')
    sub_field = profile.get('sub_field', '')
    selected_language = profile.get('selected_language', '')
    
    # Choose focus based on experience level
    if experience_level == 'pro':
        focus = 'Fast-Entry'
    else:
        focus = 'Depth'
    
    # Build the roadmap title with sub-field hierarchy
    career_name = top_career.get('career') or top_career.get('label', 'Career')
    if sub_field:
        path_title = f"{sub_field} — {career_name}"
    else:
        path_title = career_name
    
    steps = generate_steps_for_career(
        top_career, profile.get('skills', []), focus, beginner=(experience_level == 'beginner'),
        experience_level=experience_level,
        sub_field=sub_field,
        selected_language=selected_language,
    )
    
    # Map level to human-readable focus label
    level_labels = {
        'beginner': 'Beginner — Full Roadmap',
        'intermediate': 'Intermediate — Full Roadmap',
        'pro': 'Pro — Accelerated Roadmap',
    }
    focus_label = level_labels.get(experience_level, focus)
    
    rm = Roadmap(
        path_title=path_title,
        focus=focus_label,
        confidence_score=0.8,
        steps=steps
    )
    return [rm]

