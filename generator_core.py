import random
from dataclasses import dataclass, field
from typing import List, Dict, Any

@dataclass
class RoadmapTask:
    title: str
    description: str

@dataclass
class RoadmapStep:
    title: str
    objective: str
    prerequisites: List[str]
    resources: List[str]
    tasks: List[RoadmapTask] = field(default_factory=list)
    children: List['RoadmapStep'] = field(default_factory=list)

@dataclass
class Roadmap:
    path_title: str
    focus: str
    confidence_score: float
    steps: List[RoadmapStep]

def _extract_title_from_task(task_text: str) -> str:
    """Helper to extract a short title from a long task description."""
    prefixes_to_remove = [
        "study ", "complete an ", "complete ", "learn to ", "develop skills in ", 
        "develop proficiency in ", "practice ", "apply ", "demonstrate comprehensive ", 
        "demonstrate ", "build ", "choose ", "master ", "obtain your ", "obtain ",
        "understand ", "set up ", "gain ", "secure ", "execute ", "create "
    ]
    
    title = task_text.lower().strip()
    for prefix in prefixes_to_remove:
        if title.startswith(prefix):
            title = title[len(prefix):]
            break
            
    # take the first few words of whatever is left, up to 3-4 words
    title = title.split(',')[0].strip()
    words = title.split()
    if len(words) > 3:
        title = " ".join(words[:3])
    else:
        title = " ".join(words)
        
    return f"({title.capitalize()})"

def generate_steps_for_career(career: Dict[str,Any], profile_skills: List[str], focus: str, beginner: bool = True):
    known = [s for s in [sk.lower() for sk in career.get('skills', [])] if s in profile_skills]
    missing = [s for s in [sk.lower() for sk in career.get('skills', [])] if s not in profile_skills]

    def make_step(title, objective, prereq, resources, tasks=None, children=None):
        return RoadmapStep(
            title=title,
            objective=objective,
            prerequisites=prereq,
            resources=resources,
            tasks=tasks or [],
            children=children or []
        )

    # Dynamic Step Generation Logic
    career_tasks = career.get('tasks', [])
    career_name = career.get('career', 'Career')
    
    available_tasks = list(career_tasks)
    
    def get_phase_tasks(count, fallback_prefix):
        """Pops up to `count` tasks from the available list, or generates fallbacks."""
        selected_tasks = []
        for _ in range(count):
            if available_tasks:
                selected_tasks.append(available_tasks.pop(0))
            else:
                selected_tasks.append(f"{fallback_prefix} {len(selected_tasks)+1}")
        return selected_tasks
        
    def get_tasks_with_titles(count, fallback_prefix):
        """Returns a list of RoadmapTask objects with generated titles and descriptions."""
        tasks = get_phase_tasks(count, fallback_prefix)
        task_objs = []
        for t in tasks:
            title = _extract_title_from_task(t)
            task_objs.append(RoadmapTask(title=title, description=t))
        return task_objs

    # 1. Foundations
    foundations_children = []
    if beginner:
        t1 = get_tasks_with_titles(2, 'Study fundamental concept')
        foundations_children.append(make_step(
            'Industry Fundamentals',
            f'Understand the core concepts of {career_name}',
            [],
            ['Online Courses', 'Industry Glossaries', 'Career Guides'],
            t1
        ))
        
        t2 = get_tasks_with_titles(1, 'Research standard tools')
        foundations_children.append(make_step(
            'Tools & Environment',
            'Set up your professional workspace',
            [],
            ['Official Documentation', 'Community Forums'],
            t2
        ))

    # A phase-level task
    t_f = get_tasks_with_titles(1, 'Set up workspace')
    foundations = make_step(
        'Foundations', 
        'Build essential groundwork for your career', 
        [], 
        ['Standard Industry Tools'],
        t_f,
        children=foundations_children
    )

    # 2. Core Skills
    core_children = []
    skills_to_learn = (missing[:4] if missing else career.get('skills', [])[:4])
    
    for i, sk in enumerate(skills_to_learn):
        t_sk = get_tasks_with_titles(1, f'Practice {sk}')
        core_children.append(make_step(
            f'{sk.title()} Proficiency', 
            f'Develop proficiency in {sk}', 
            known[:2] if i == 0 else [], 
            [f'{sk.title()} Resources'],
            t_sk
        ))
    
    t_c = get_tasks_with_titles(1, 'Master core skills')
    core = make_step(
        'Core Skills Development', 
        f'Master essential skills for {career_name}', 
        known, 
        ['Online Learning Platforms'],
        t_c,
        children=core_children
    )

    # 3. Practical Application (Projects/Experience)
    project_children = []
    
    t_p1 = get_tasks_with_titles(2, 'Apply core skills')
    project_children.append(make_step(
        'Applied Practice Project', 
        'Apply core skills in a realistic scenario', 
        known + missing[:2], 
        ['Project Management Tools', 'Documentation Tools'],
        t_p1
    ))

    t_p2 = get_tasks_with_titles(1, 'Demonstrate mastery')
    project_children.append(make_step(
        'Advanced Capstone', 
        'Demonstrate comprehensive mastery', 
        known + missing[:3], 
        ['Advanced Tools'],
        t_p2
    ))

    t_p = get_tasks_with_titles(1, 'Build portfolio')
    project = make_step(
        'Practical Application', 
        'Gain hands-on experience through projects or simulations', 
        known, 
        ['Portfolio Platform'],
        t_p,
        children=project_children
    )

    # 4. Specialization
    
    t_s1 = get_tasks_with_titles(1, 'Study advanced topic')
    spec_children = [
        make_step(
            'Specialization Track', 
            'Deep dive into a specific area', 
            known + missing[:2], 
            ['Specialized Training'],
            t_s1
        )
    ]
    
    t_s = get_tasks_with_titles(1, 'Choose specialization')
    spec = make_step(
        'Specialization', 
        'Develop expertise in specific areas', 
        [], 
        ['Industry Certifications'],
        t_s,
        children=spec_children
    )

    # 5. Career Launch
    t_j1 = get_tasks_with_titles(1, 'Professional Branding')
    t_j2 = get_tasks_with_titles(1, 'Job Search Strategy')
    
    job_children = [
        make_step(
            'Professional Branding', 
            'Create compelling professional presence', 
            [], 
            ['LinkedIn', 'Resume Builder'],
            t_j1
        ),
        make_step(
            'Job Search Strategy', 
            'Execute systematic job search', 
            [], 
            ['Job Boards', 'Networking Events'],
            t_j2
        )
    ]
    
    t_j = get_tasks_with_titles(1, 'Secure job offer')
    job = make_step(
        'Career Launch', 
        'Land your first role in the field', 
        [], 
        ['Job Search Platforms'],
        t_j,
        children=job_children
    )

    # Any remaining tasks can be added to the final Career Launch node to make sure they aren't lost
    if available_tasks:
        t_rem = get_tasks_with_titles(len(available_tasks), '')
        job.tasks.extend(t_rem)

    return [foundations, core, project, spec, job]


def generate_distinct_roadmaps(profile: Dict[str,Any], top_career: Dict[str,Any]):
    focuses = ['Depth','Fast-Entry','Transition']
    roadmaps = []
    for f in focuses:
        steps = generate_steps_for_career(top_career, profile.get('skills',[]), f, beginner=True)
        rm = Roadmap(path_title=top_career.get('career') or top_career.get('label', 'Career'), focus=f, confidence_score=0.8, steps=steps)
        roadmaps.append(rm)
    return roadmaps
