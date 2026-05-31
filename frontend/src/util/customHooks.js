import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router";
import { flattenCareers, buildCategoryMap } from "../util/helperFunctions";

/**
 * useSearchData
 *
 * Owns everything related to loading and exposing raw data.
 * Nothing here depends on user interaction — no selected career,
 * no filters, no roadmap. Pure data layer.
 *
 * Returns:
 *   allCareers       - flat list of every career object
 *   categoryMap      - { [categoryName]: Career[] }
 *   allCategories    - string[] of category names
 *   dataLoading      - true while the first fetch is in flight
 *   tiobeData        - { [langName]: rank }
 *   tiobeAwards      - { [langName]: year[] }
 *   getTiobeRank     - (langName: string) => number | null
 *   getTiobeAwards   - (langName: string) => string | null   e.g. "Best in 2023"
 *   initialCategory  - category name from ?category= URL param, or null
 *   initialPopular   - true if ?top=true was in the URL
 */
export function useSearchData() {
  const [allCareers, setAllCareers] = useState([]);
  const [categoryMap, setCategoryMap] = useState({});
  const [allCategories, setAllCategories] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [tiobeData, setTiobeData] = useState({});
  const [tiobeAwards, setTiobeAwards] = useState({});

  // We read the URL params here so the hook can signal to the caller
  // what the initial UI state should be — but we don't *set* that UI
  // state ourselves. That stays in the component or the relevant hook.
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialCategory = searchParams.get("category") || null;
  const initialPopular = searchParams.get("top") === "true";

  useEffect(() => {
    fetch("/api/careers_data")
      .then((res) => res.json())
      .then((data) => {
        const flatCareers = flattenCareers(data);
        const map = buildCategoryMap(data);

        setAllCareers(flatCareers);
        setCategoryMap(map);
        setAllCategories(Object.keys(map));
        setDataLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load careers dataset:", err);
        setDataLoading(false);
      });

    fetch("/api/tiobe")
      .then((res) => res.json())
      .then((data) => {
        if (data.rankings) setTiobeData(data.rankings);
        if (data.awards) setTiobeAwards(data.awards);
      })
      .catch((err) => console.error("Failed to load TIOBE data:", err));
  }, []);
  // ↑ Empty dep array: this data never needs to re-fetch on interaction.
  //   The original code used [location.search] which caused a re-fetch
  //   every time the URL changed. The URL params are read once above
  //   as initialCategory / initialPopular and handed back as values —
  //   no need to re-fetch careers just because the query string changed.

  // ─── TIOBE helpers ────────────────────────────────────────────────
  // Kept here because they're pure functions over tiobeData/tiobeAwards.
  // If you move those states, move these functions with them.

  const normalizeLangName = (langName) =>
    langName.split("/")[0].split("(")[0].trim().toLowerCase();

  const getTiobeRank = (langName) => {
    if (!tiobeData) return null;
    let name = normalizeLangName(langName);
    if (name === "flutter") name = "dart";
    return tiobeData[name] || null;
  };

  const getTiobeAwards = (langName) => {
    if (!tiobeAwards) return null;
    let name = normalizeLangName(langName);
    if (name === "flutter") name = "dart";
    const years = tiobeAwards[name];
    if (years && years.length > 0) {
      return `Best in ${years[0]}`;
    }
    return null;
  };

  return {
    allCareers,
    categoryMap,
    allCategories,
    dataLoading,
    tiobeData,
    tiobeAwards,
    getTiobeRank,
    getTiobeAwards,
    initialCategory,
    initialPopular,
  };
}

// ========================================================================================================
// ========================================================================================================
// ========================================================================================================
// ========================================================================================================

/**
 * useCareerFilters
 *
 * Owns two related concerns:
 *
 *   1. baseCareers — the search-and-category narrowed list.
 *      Lives here because both the filter panel AND the dropdown
 *      suggestions (in useCareerSelection) read from it, so it
 *      needs to be computed once and shared via the return value.
 *
 *   2. The filter panel controls — language, education, popular,
 *      skill chip search — and the grouped output they produce.
 *
 * Params (all come from useSearchData + useCategoryBrowser):
 *   @param {object[]} allCareers    - flat career list from useSearchData
 *   @param {string[]} allCategories - category names from useSearchData
 *   @param {string}   query         - the live search string (from useCareerSelection)
 *   @param {string|null} activeCategory - currently browsed category (from useCategoryBrowser)
 *
 * Returns:
 *   baseCareers                    - search + category filtered careers (pass to useCareerSelection)
 *   filterLanguage / setFilterLanguage
 *   filterEducation / setFilterEducation
 *   filterPopular / setFilterPopular
 *   skillSearch / setSkillSearch
 *   selectedSkills / setSelectedSkills
 *   isFilteringActive              - boolean, drives whether filter results or category grid shows
 *   filteredCareersGroupedByCategory - { [category]: Career[] } | null
 *   uniqueLanguages                - string[], for the language dropdown options
 *   uniqueEducations               - string[], for the education dropdown options
 *   topSkills                      - string[], top 20 skills across baseCareers for chip suggestions
 */
export function useCareerFilters({
  allCareers,
  allCategories,
  query,
  activeCategory,
}) {
  const [filterLanguage, setFilterLanguage] = useState("");
  const [filterEducation, setFilterEducation] = useState("");
  const [filterPopular, setFilterPopular] = useState(false);
  const [skillSearch, setSkillSearch] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);

  // ─── baseCareers ────────────────────────────────────────────────────
  // The search-narrowed list. All filter memos below derive from this,
  // and the dropdown suggestion list in useCareerSelection reads it too.
  // Scoring logic is unchanged from the original.

  const baseCareers = useMemo(() => {
    let source = activeCategory
      ? allCareers.filter((c) => c.category === activeCategory)
      : allCareers;

    if (!query.trim()) return source;

    const q = query.toLowerCase();
    const matchingCategories = allCategories.filter((cat) =>
      cat.toLowerCase().includes(q),
    );

    let results =
      matchingCategories.length > 0
        ? source.filter(
          (c) =>
            matchingCategories.includes(c.category) ||
            c.career.toLowerCase().includes(q),
        )
        : source.filter(
          (c) =>
            c.career.toLowerCase().includes(q) ||
            c.skills.some((s) => s.toLowerCase().includes(q)) ||
            c.languages.some((l) =>
              l.name.toLowerCase().includes(q),
            ),
        );

    return results
      .map((c) => {
        let score = 0;
        const careerLower = c.career.toLowerCase();
        const catLower = c.category.toLowerCase();

        if (careerLower === q) score += 100;
        else if (careerLower.startsWith(q)) score += 50;
        else if (careerLower.includes(q)) score += 20;

        if (catLower === q) score += 80;
        else if (catLower.includes(q)) score += 40;

        if (c.skills.some((s) => s.toLowerCase() === q)) score += 10;
        else if (c.skills.some((s) => s.toLowerCase().includes(q)))
          score += 2;

        if (c.languages.some((l) => l.name.toLowerCase() === q))
          score += 15;
        else if (
          c.languages.some((l) => l.name.toLowerCase().includes(q))
        )
          score += 3;

        return { ...c, __score: score };
      })
      .sort((a, b) => b.__score - a.__score);
  }, [query, allCareers, allCategories, activeCategory]);
  // ↑ activeCategory added to deps (missing in original — category switching
  //   wouldn't recompute baseCareers without it).

  // ─── Filter panel options ────────────────────────────────────────────
  // These derive from baseCareers so options shrink as the user searches.

  const { uniqueLanguages, uniqueEducations, topSkills } = useMemo(() => {
    const langs = new Set();
    const edus = new Set();
    const skillCounts = {};

    baseCareers.forEach((c) => {
      c.languages.forEach((l) => langs.add(l.name));
      c.sub_fields.forEach((sf) =>
        sf.languages?.forEach((l) => langs.add(l.name)),
      );
      edus.add(c.education_level);
      c.skills.forEach((s) => {
        const clean = s.toLowerCase().trim();
        skillCounts[clean] = (skillCounts[clean] || 0) + 1;
      });
    });

    return {
      uniqueLanguages: Array.from(langs).sort(),
      uniqueEducations: Array.from(edus)
        .filter((e) => e !== "Not Specified")
        .sort(),
      topSkills: Object.entries(skillCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([skill]) => skill),
    };
  }, [baseCareers]);

  // ─── isFilteringActive ───────────────────────────────────────────────
  // Drives whether the component shows filtered results or the default
  // category grid. Defined as a derived boolean, not state, so it's
  // always in sync without an extra setState call.

  const isFilteringActive = Boolean(
    filterLanguage ||
    filterEducation ||
    filterPopular ||
    skillSearch.trim() ||
    selectedSkills.length > 0 ||
    query.trim(),
  );

  // ─── filteredCareersGroupedByCategory ───────────────────────────────
  // The main filter panel output. Only runs when filtering is active.
  // Bug fix from original: dep array now uses baseCareers (what the memo
  // actually iterates) instead of allCareers.

  const filteredCareersGroupedByCategory = useMemo(() => {
    if (!isFilteringActive) return null;

    const grouped = {};

    baseCareers.forEach((c) => {
      let match = true;

      if (filterLanguage) {
        const hasLang =
          c.languages.some((l) => l.name === filterLanguage) ||
          c.sub_fields.some((sf) =>
            sf.languages?.some((l) => l.name === filterLanguage),
          );
        if (!hasLang) match = false;
      }

      if (match && filterEducation && c.education_level !== filterEducation) {
        match = false;
      }

      if (match && filterPopular && !c.popular_in_egypt) {
        match = false;
      }

      if (match) {
        const careerSkills = c.skills.map((s) => s.toLowerCase());

        if (selectedSkills.length > 0) {
          const hasAll = selectedSkills.every((ss) =>
            careerSkills.some((cs) => cs.includes(ss)),
          );
          if (!hasAll) match = false;
        }

        if (match && skillSearch.trim()) {
          const q = skillSearch.toLowerCase().trim();
          if (!careerSkills.some((cs) => cs.includes(q))) match = false;
        }
      }

      if (match) {
        if (!grouped[c.category]) grouped[c.category] = [];
        grouped[c.category].push(c);
      }
    });

    return grouped;
  }, [
    baseCareers,
    filterLanguage,
    filterEducation,
    filterPopular,
    skillSearch,
    selectedSkills,
    isFilteringActive,
  ]);

  return {
    // baseCareers — pass this to useCareerSelection
    baseCareers,

    // filter controls
    filterLanguage,
    setFilterLanguage,
    filterEducation,
    setFilterEducation,
    filterPopular,
    setFilterPopular,
    skillSearch,
    setSkillSearch,
    selectedSkills,
    setSelectedSkills,

    // derived values for the UI
    isFilteringActive,
    filteredCareersGroupedByCategory,
    uniqueLanguages,
    uniqueEducations,
    topSkills,
  };
}

// ========================================================================================================
// ========================================================================================================
// ========================================================================================================
// ========================================================================================================

/**
 * useCareerSelection
 *
 * Owns the "user is picking what to look at" concern:
 *   - the search input and dropdown
 *   - the selected career, sub-field, language, and experience level
 *   - difficulty/paid preference (language sorting controls)
 *   - the sorted language lists derived from those choices
 *
 * Params:
 *   @param {object[]} allCareers   - full career list from useSearchData
 *                                    (used for dropdown suggestions — intentionally
 *                                    NOT baseCareers, so the dropdown always searches
 *                                    across everything regardless of active category)
 *   @param {Function} getTiobeRank - from useSearchData, used to sort languages by popularity
 *
 * Returns:
 *   query / setQuery
 *   selected
 *   dropdownOpen / setDropdownOpen
 *   selectedSubField / setSelectedSubField
 *   selectedLanguage / setSelectedLanguage
 *   experienceLevel / setExperienceLevel
 *   difficultyFilter / setDifficultyFilter
 *   preferPaid / setPreferPaid
 *   inputRef / dropdownRef          - attach to the search input and dropdown DOM nodes
 *   filtered                        - dropdown suggestion list (max 12)
 *   hasDirectLanguages              - boolean, true when selected career has languages but no sub-fields
 *   sortedLanguages                 - selected.languages sorted by current difficultyFilter
 *   sortedSubFieldLanguages         - selectedSubField.languages sorted by current difficultyFilter
 *   handleQueryChange               - onChange handler for the search input
 *   handleSelect                    - call when user picks a career from the dropdown
 *   reset                           - resets all state in this hook; call from handleClear
 *                                     in the component to compose a full cross-hook reset
 */
export function useCareerSelection({ allCareers, getTiobeRank }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedSubField, setSelectedSubField] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [experienceLevel, setExperienceLevel] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("default");
  const [preferPaid, setPreferPaid] = useState(null);

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // ─── Dropdown suggestions ────────────────────────────────────────────
  // Searches allCareers (not baseCareers) intentionally — the dropdown
  // should always show the full universe of careers, even when the user
  // is browsing a specific category.

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allCareers
      .filter(
        (c) =>
          c.career.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q),
      )
      .slice(0, 12);
  }, [query, allCareers]);

  // ─── Language display helpers ────────────────────────────────────────

  const hasDirectLanguages =
    selected &&
    !selected.sub_fields?.length &&
    selected.languages?.length > 0;

  const sortedLanguages = useMemo(() => {
    const langs = hasDirectLanguages ? [...selected.languages] : [];
    if (difficultyFilter === "easiest")
      langs.sort((a, b) => (a.difficulty ?? 99) - (b.difficulty ?? 99));
    else if (difficultyFilter === "hardest")
      langs.sort((a, b) => (b.difficulty ?? 0) - (a.difficulty ?? 0));
    else if (difficultyFilter === "popular")
      langs.sort(
        (a, b) =>
          (getTiobeRank(a.name) ?? 999) -
          (getTiobeRank(b.name) ?? 999),
      );
    return langs;
  }, [selected, hasDirectLanguages, difficultyFilter, getTiobeRank]);

  const sortedSubFieldLanguages = useMemo(() => {
    if (!selectedSubField?.languages?.length) return [];
    const langs = [...selectedSubField.languages];
    if (difficultyFilter === "easiest")
      langs.sort((a, b) => (a.difficulty ?? 99) - (b.difficulty ?? 99));
    else if (difficultyFilter === "hardest")
      langs.sort((a, b) => (b.difficulty ?? 0) - (a.difficulty ?? 0));
    else if (difficultyFilter === "popular")
      langs.sort(
        (a, b) =>
          (getTiobeRank(a.name) ?? 999) -
          (getTiobeRank(b.name) ?? 999),
      );
    return langs;
  }, [selectedSubField, difficultyFilter, getTiobeRank]);

  // ─── Outside-click: close dropdown ──────────────────────────────────

  useEffect(() => {
    function handleClick(e) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ─── Internal reset helper ───────────────────────────────────────────
  // Resets only the state this hook owns.
  // The component composes handleClear / handleSelectFromCategory by
  // calling this alongside roadmap.reset() and refocusing the input.

  const reset = () => {
    setSelected(null);
    setSelectedSubField(null);
    setSelectedLanguage(null);
    setExperienceLevel("");
    setDifficultyFilter("default");
    setPreferPaid(null);
  };

  // ─── Handlers ───────────────────────────────────────────────────────

  const handleQueryChange = (e) => {
    setQuery(e.target.value);
    setSelected(null);
    setDropdownOpen(true);
  };
  // ↑ Removed setResult(null) and setError("") — those belong to
  //   useRoadmapGeneration. The component will call roadmap.reset()
  //   alongside this if needed.

  const handleSelect = (careerObj) => {
    setSelected(careerObj);
    setQuery(careerObj.career);
    setDropdownOpen(false);
    setSelectedSubField(null);
    setSelectedLanguage(null);
    setExperienceLevel("");
    setDifficultyFilter("default");
    setPreferPaid(null);
  };
  // ↑ Same — roadmap state resets are intentionally omitted here.
  //   The component composes the full handler:
  //
  //   const handleSelectCareer = (careerObj) => {
  //       selection.handleSelect(careerObj);
  //       roadmap.reset();
  //   };

  return {
    query,
    setQuery,
    selected,
    dropdownOpen,
    setDropdownOpen,
    selectedSubField,
    setSelectedSubField,
    selectedLanguage,
    setSelectedLanguage,
    experienceLevel,
    setExperienceLevel,
    difficultyFilter,
    setDifficultyFilter,
    preferPaid,
    setPreferPaid,
    inputRef,
    dropdownRef,
    filtered,
    hasDirectLanguages,
    sortedLanguages,
    sortedSubFieldLanguages,
    handleQueryChange,
    handleSelect,
    reset,
  };
}


// ========================================================================================================
// ========================================================================================================
// ========================================================================================================
// ========================================================================================================

import { TECH_ENG_CATEGORIES } from "../data/Data";


// ↑ Moved here from Search.jsx — it's only used by handleGenerate,
//   so it belongs in the same file as handleGenerate.

/**
 * useRoadmapGeneration
 *
 * Owns everything related to generating, displaying, and saving roadmaps:
 *   - the generate and follow-up API calls
 *   - the recommendations fetch
 *   - the save-to-account flow
 *   - all loading/error/result state
 *
 * Params (all come from useCareerSelection or useAuth):
 *   @param {object|null} selected              - the currently selected career object
 *   @param {object|null} selectedSubField      - selected sub-field, if any
 *   @param {object|null} selectedLanguage      - selected language, if any
 *   @param {string}      experienceLevel       - "beginner" | "intermediate" | "advanced" | ""
 *   @param {boolean|null} preferPaid           - user's resource preference
 *   @param {boolean}     hasDirectLanguages    - true when career has languages but no sub-fields
 *   @param {object|null} user                  - from useAuth, needed for save
 *
 * Returns:
 *   loading / result / error
 *   recommendedFields / setRecommendedFields
 *   selectedRecommendedField / setSelectedRecommendedField
 *   followUpResult / followUpLoading
 *   activeRoadmapTab / setActiveRoadmapTab
 *   saveStatus / saveError
 *   fetchRecommendations   - (careerName, langName) => void
 *   handleGenerate         - triggers the main roadmap generation
 *   handleSaveRoadmap      - saves current result to the user's account
 *   reset                  - resets all state in this hook; call from handleClear
 */
export function useRoadmapGeneration({
  selected,
  selectedSubField,
  selectedLanguage,
  experienceLevel,
  preferPaid,
  hasDirectLanguages,
  user,
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [recommendedFields, setRecommendedFields] = useState([]);
  const [selectedRecommendedField, setSelectedRecommendedField] =
    useState(null);
  const [followUpResult, setFollowUpResult] = useState(null);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [activeRoadmapTab, setActiveRoadmapTab] = useState(0);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [saveError, setSaveError] = useState("");

  function isTechOrEngineering(category) {
    return TECH_ENG_CATEGORIES.has(category);
  }

  // ─── Reset ───────────────────────────────────────────────────────────
  // Called from handleClear in the component alongside selection.reset().

  const reset = () => {
    setResult(null);
    setError("");
    setRecommendedFields([]);
    setSelectedRecommendedField(null);
    setFollowUpResult(null);
    setActiveRoadmapTab(0);
    setSaveStatus("idle");
    setSaveError("");
  };

  // ─── Recommendations ─────────────────────────────────────────────────

  const fetchRecommendations = async (careerName, langName) => {
    try {
      const res = await fetch("http://localhost:8000/recommend_fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ career: careerName, language: langName }),
      });
      if (res.ok) {
        const data = await res.json();
        setRecommendedFields(data.recommendations || []);
      }
    } catch (err) {
      console.error("Failed to fetch recommendations:", err);
    }
  };

  // ─── Generate ────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!selected) return;

    const hasSubFields = selected.sub_fields?.length > 0;
    const isTechEng = isTechOrEngineering(selected.category);
    const needsLevel = hasSubFields ? !!selectedSubField : isTechEng;
    const needsLang = hasDirectLanguages;

    if (hasSubFields && !selectedSubField) return;
    if (selectedSubField?.languages?.length > 0 && !selectedLanguage) return;
    if (needsLang && !selectedLanguage) return;
    if (needsLevel && !experienceLevel) return;
    if ((needsLang || selectedSubField?.languages?.length > 0) && preferPaid === null) return;

    setError("");
    setLoading(true);
    setResult(null);
    setFollowUpResult(null);
    setActiveRoadmapTab(0);

    try {
      const res = await fetch("http://localhost:8000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: [],
          careers: [selected.career],
          category: selected.category,
          user_summary: "",
          experience_level: experienceLevel || "",
          sub_field: selectedSubField?.name || "",
          selected_language: selectedLanguage?.name || selectedLanguage || "",
          prefer_paid: preferPaid,
        }),
      });
      if (!res.ok) throw new Error("Failed to generate roadmap");

      const data = await res.json();
      setResult(data);
      localStorage.setItem("roadmapResult", JSON.stringify(data));

      if (selectedRecommendedField) {
        setFollowUpLoading(true);
        try {
          const res2 = await fetch("http://localhost:8000/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              answers: [],
              careers: [selectedRecommendedField.field],
              category: selected.category,
              user_summary: "",
              experience_level: experienceLevel || "",
              selected_language: selectedLanguage?.name || selectedLanguage || "",
              prefer_paid: preferPaid,
            }),
          });
          if (res2.ok) {
            const data2 = await res2.json();
            setFollowUpResult(data2);
          }
        } catch (err2) {
          console.error("Follow-up roadmap error:", err2);
        } finally {
          setFollowUpLoading(false);
        }
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ─── Save ────────────────────────────────────────────────────────────

  const handleSaveRoadmap = async () => {
    if (!user?.id) {
      setSaveError("You must be logged in to save a roadmap.");
      setSaveStatus("error");
      return;
    }
    if (!result) return;

    setSaveStatus("saving");
    setSaveError("");
    try {
      const token = localStorage.getItem("token"); // or wherever you store it

      const res = await fetch("http://localhost:5000/api/auth/save-roadmap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,  // ✅ add this
        },
        body: JSON.stringify({ roadmap: result }),  // userId no longer needed in body
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 409) {
          setSaveStatus("already_saved");
          return;
        }
        throw new Error(errData.message || "Failed to save roadmap.");
      }
      setSaveStatus("saved");
    } catch (err) {
      setSaveError(err.message || "Something went wrong.");
      setSaveStatus("error");
    }
  };

  return {
    loading,
    result,
    error,
    recommendedFields,
    setRecommendedFields,
    selectedRecommendedField,
    setSelectedRecommendedField,
    followUpResult,
    followUpLoading,
    activeRoadmapTab,
    setActiveRoadmapTab,
    saveStatus,
    saveError,
    fetchRecommendations,
    handleGenerate,
    handleSaveRoadmap,
    reset,
  };
}

// ========================================================================================================
// ========================================================================================================
// ========================================================================================================
// ========================================================================================================

/**
 * useCategoryBrowser
 *
 * Owns the category sidebar browsing concern:
 *   - which category is currently open
 *   - scrolling to it when it changes
 *   - seeding the initial category from the URL param
 *   - the list of careers to show inside the open category
 *
 * Params:
 *   @param {object}      categoryMap      - { [categoryName]: Career[] } from useSearchData
 *   @param {string|null} initialCategory  - from useSearchData, seeds activeCategory on mount
 *
 * Returns:
 *   activeCategory        - string | null
 *   categoryRef           - attach to the category section DOM node for scroll targeting
 *   categoryCareers       - Career[] for the currently open category ([] if none open)
 *   handleCategoryClick   - toggles a category open/closed
 */
export function useCategoryBrowser({ categoryMap, initialCategory }) {
  const [activeCategory, setActiveCategory] = useState(null);
  const categoryRef = useRef(null);

  // ─── Seed from URL param ─────────────────────────────────────────────
  // Runs once when categoryMap finishes loading (it starts as {}).
  // Only sets activeCategory if the param actually exists in the data.

  useEffect(() => {
    if (initialCategory && categoryMap[initialCategory]) {
      setActiveCategory(initialCategory);
    }
  }, [initialCategory, categoryMap]);

  // ─── Scroll into view ────────────────────────────────────────────────

  useEffect(() => {
    if (activeCategory && categoryRef.current) {
      categoryRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [activeCategory]);

  // ─── Handlers ────────────────────────────────────────────────────────

  const handleCategoryClick = (category) => {
    setActiveCategory((prev) => (prev === category ? null : category));
  };

  const categoryCareers = activeCategory ? categoryMap[activeCategory] ?? [] : [];

  return {
    activeCategory,
    categoryRef,
    categoryCareers,
    handleCategoryClick,
  };
}