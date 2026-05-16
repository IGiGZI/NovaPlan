"""Patch Fetching.jsx Part 1: Add state variables and update handlers."""
from pathlib import Path

F = Path(__file__).parent.parent / "src" / "pages" / "Fetching.jsx"
c = F.read_text(encoding="utf-8")

# 1. Add new state after experienceLevel
old = '\tconst [experienceLevel, setExperienceLevel] = useState(""); // beginner | intermediate | pro'
new = old + """

\t// New feature state
\tconst [difficultyFilter, setDifficultyFilter] = useState("default");
\tconst [preferPaid, setPreferPaid] = useState(null);
\tconst [recommendedFields, setRecommendedFields] = useState([]);
\tconst [selectedRecommendedField, setSelectedRecommendedField] = useState(null);
\tconst [wantsFollowUpRoadmap, setWantsFollowUpRoadmap] = useState(null);
\tconst [followUpResult, setFollowUpResult] = useState(null);
\tconst [followUpLoading, setFollowUpLoading] = useState(false);
\tconst [activeRoadmapTab, setActiveRoadmapTab] = useState(0);

\t// Check if career has direct languages (no sub_fields but has languages array)
\tconst hasDirectLanguages = selectedCareer && !selectedCareer.sub_fields?.length && selectedCareer.languages?.length > 0;

\t// Sort languages by difficulty filter
\tconst sortedLanguages = useMemo(() => {
\t\tconst langs = hasDirectLanguages ? [...selectedCareer.languages] : [];
\t\tif (difficultyFilter === "easiest") langs.sort((a, b) => (a.difficulty ?? 99) - (b.difficulty ?? 99));
\t\telse if (difficultyFilter === "hardest") langs.sort((a, b) => (b.difficulty ?? 0) - (a.difficulty ?? 0));
\t\treturn langs;
\t}, [selectedCareer, hasDirectLanguages, difficultyFilter]);

\tconst fetchRecommendations = async (careerName, langName) => {
\t\ttry {
\t\t\tconst res = await fetch("http://localhost:8000/recommend_fields", {
\t\t\t\tmethod: "POST", headers: { "Content-Type": "application/json" },
\t\t\t\tbody: JSON.stringify({ career: careerName, language: langName }),
\t\t\t});
\t\t\tif (res.ok) { const data = await res.json(); setRecommendedFields(data.recommendations || []); }
\t\t} catch (err) { console.error("Failed to fetch recommendations:", err); }
\t};"""
assert old in c, "State insertion point not found"
c = c.replace(old, new)
print("1. State variables added")

# 2. Update handleBack to reset new state
old2 = """\t\tsetSelectedLanguage(null);
\t\tsetExperienceLevel("");
\t\tsetResult(null);
\t\tsetError("");
\t\tsetShowSummaryInput(false);
\t};"""
new2 = """\t\tsetSelectedLanguage(null);
\t\tsetExperienceLevel("");
\t\tsetDifficultyFilter("default");
\t\tsetPreferPaid(null);
\t\tsetRecommendedFields([]);
\t\tsetSelectedRecommendedField(null);
\t\tsetWantsFollowUpRoadmap(null);
\t\tsetFollowUpResult(null);
\t\tsetActiveRoadmapTab(0);
\t\tsetResult(null);
\t\tsetError("");
\t\tsetShowSummaryInput(false);
\t};"""
assert old2 in c, "handleBack not found"
c = c.replace(old2, new2)
print("2. handleBack updated")

# 3. Update handleSubmit
old3 = """\tconst handleSubmit = async () => {
\t\tif (!selectedCareer) return;
\t\tconst hasSubFields = selectedCareer.sub_fields && selectedCareer.sub_fields.length > 0;
\t\tconst isTechEng = isTechOrEngineering(selectedCareer.category);
\t\tconst needsLevel = hasSubFields ? !!selectedSubField : isTechEng;

\t\tif (hasSubFields && !selectedSubField) return;
\t\tif (selectedSubField?.languages?.length > 0 && !selectedLanguage) return;
\t\tif (needsLevel && !experienceLevel) return;

\t\tsetError("");
\t\tsetLoading(true);
\t\tsetResult(null);

\t\ttry {
\t\t\tconst res = await fetch("http://localhost:8000/generate", {
\t\t\t\tmethod: "POST",
\t\t\t\theaders: { "Content-Type": "application/json" },
\t\t\t\tbody: JSON.stringify({
\t\t\t\t\tanswers: answers.map((a) => ({
\t\t\t\t\t\tquestionId: a.questionId,
\t\t\t\t\t\tlabel: a.label,
\t\t\t\t\t})),
\t\t\t\t\tcareers: [selectedCareer.career],
\t\t\t\t\tcategory: selectedCareer.category,
\t\t\t\t\tuser_summary: userSummary || "",
\t\t\t\t\texperience_level: experienceLevel || "",
\t\t\t\t\tsub_field: selectedSubField?.name || "",
\t\t\t\t\tselected_language: selectedLanguage?.name || "",
\t\t\t\t}),
\t\t\t});
\t\t\tif (!res.ok) throw new Error("Failed to generate roadmaps");
\t\t\tconst data = await res.json();
\t\t\tsetResult(data);
\t\t\tlocalStorage.setItem("roadmapResult", JSON.stringify(data));
\t\t} catch (err) {
\t\t\tsetError(err.message || "Something went wrong");
\t\t} finally {
\t\t\tsetLoading(false);
\t\t}
\t};"""

new3 = """\tconst handleSubmit = async () => {
\t\tif (!selectedCareer) return;
\t\tconst hasSubFields = selectedCareer.sub_fields && selectedCareer.sub_fields.length > 0;
\t\tconst isTechEng = isTechOrEngineering(selectedCareer.category);
\t\tconst needsLevel = hasSubFields ? !!selectedSubField : isTechEng;
\t\tconst needsLang = hasDirectLanguages;

\t\tif (hasSubFields && !selectedSubField) return;
\t\tif (selectedSubField?.languages?.length > 0 && !selectedLanguage) return;
\t\tif (needsLang && !selectedLanguage) return;
\t\tif (needsLevel && !experienceLevel) return;
\t\tif ((needsLang || (selectedSubField?.languages?.length > 0)) && preferPaid === null) return;

\t\tsetError("");
\t\tsetLoading(true);
\t\tsetResult(null);
\t\tsetFollowUpResult(null);
\t\tsetActiveRoadmapTab(0);

\t\ttry {
\t\t\tconst res = await fetch("http://localhost:8000/generate", {
\t\t\t\tmethod: "POST",
\t\t\t\theaders: { "Content-Type": "application/json" },
\t\t\t\tbody: JSON.stringify({
\t\t\t\t\tanswers: answers.map((a) => ({ questionId: a.questionId, label: a.label })),
\t\t\t\t\tcareers: [selectedCareer.career],
\t\t\t\t\tcategory: selectedCareer.category,
\t\t\t\t\tuser_summary: userSummary || "",
\t\t\t\t\texperience_level: experienceLevel || "",
\t\t\t\t\tsub_field: selectedSubField?.name || "",
\t\t\t\t\tselected_language: selectedLanguage?.name || selectedLanguage || "",
\t\t\t\t\tprefer_paid: preferPaid,
\t\t\t\t}),
\t\t\t});
\t\t\tif (!res.ok) throw new Error("Failed to generate roadmaps");
\t\t\tconst data = await res.json();
\t\t\tsetResult(data);
\t\t\tlocalStorage.setItem("roadmapResult", JSON.stringify(data));

\t\t\tif (wantsFollowUpRoadmap && selectedRecommendedField) {
\t\t\t\tsetFollowUpLoading(true);
\t\t\t\ttry {
\t\t\t\t\tconst res2 = await fetch("http://localhost:8000/generate", {
\t\t\t\t\t\tmethod: "POST",
\t\t\t\t\t\theaders: { "Content-Type": "application/json" },
\t\t\t\t\t\tbody: JSON.stringify({
\t\t\t\t\t\t\tanswers: [], careers: [selectedRecommendedField.field],
\t\t\t\t\t\t\tcategory: selectedCareer.category, user_summary: "",
\t\t\t\t\t\t\texperience_level: experienceLevel || "",
\t\t\t\t\t\t\tselected_language: selectedLanguage?.name || selectedLanguage || "",
\t\t\t\t\t\t\tprefer_paid: preferPaid,
\t\t\t\t\t\t}),
\t\t\t\t\t});
\t\t\t\t\tif (res2.ok) { const data2 = await res2.json(); setFollowUpResult(data2); }
\t\t\t\t} catch (err2) { console.error("Follow-up error:", err2); }
\t\t\t\tfinally { setFollowUpLoading(false); }
\t\t\t}
\t\t} catch (err) {
\t\t\tsetError(err.message || "Something went wrong");
\t\t} finally {
\t\t\tsetLoading(false);
\t\t}
\t};"""
assert old3 in c, "handleSubmit not found"
c = c.replace(old3, new3)
print("3. handleSubmit updated")

# 4. Update handleRestart to reset new state
old4 = """\t\tsetExperienceLevel("");
\t\tsetResult(null);
\t\tsetError("");
\t\tsetUserSummary("");"""
new4 = """\t\tsetExperienceLevel("");
\t\tsetDifficultyFilter("default");
\t\tsetPreferPaid(null);
\t\tsetRecommendedFields([]);
\t\tsetSelectedRecommendedField(null);
\t\tsetWantsFollowUpRoadmap(null);
\t\tsetFollowUpResult(null);
\t\tsetActiveRoadmapTab(0);
\t\tsetResult(null);
\t\tsetError("");
\t\tsetUserSummary("");"""
assert old4 in c, "handleRestart not found"
c = c.replace(old4, new4)
print("4. handleRestart updated")

F.write_text(c, encoding="utf-8")
print(f"Done! Part 1 complete. Size: {len(c)} bytes")
