"""Fix Search.jsx handleGenerate to include follow-up roadmap generation and prefer_paid."""
from pathlib import Path

F = Path(__file__).parent.parent / "src" / "pages" / "Search.jsx"
c = F.read_text(encoding="utf-8")

old = """\tconst handleGenerate = async () => {
\t\tif (!selected) return;
\t\tconst hasSubFields = selected.sub_fields && selected.sub_fields.length > 0;
\t\tconst isTechEng = isTechOrEngineering(selected.category);
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
\t\t\t\t\tanswers: [],
\t\t\t\t\tcareers: [selected.career],
\t\t\t\t\tcategory: selected.category,
\t\t\t\t\tuser_summary: "",
\t\t\t\t\texperience_level: experienceLevel || "",
\t\t\t\t\tsub_field: selectedSubField?.name || "",
\t\t\t\t\tselected_language: selectedLanguage?.name || "",
\t\t\t\t}),
\t\t\t});
\t\t\tif (!res.ok) throw new Error("Failed to generate roadmap");
\t\t\tconst data = await res.json();
\t\t\tsetResult(data);
\t\t\tlocalStorage.setItem("roadmapResult", JSON.stringify(data));
\t\t} catch (err) {
\t\t\tsetError(err.message || "Something went wrong");
\t\t} finally {
\t\t\tsetLoading(false);
\t\t}
\t};"""

new = """\tconst handleGenerate = async () => {
\t\tif (!selected) return;
\t\tconst hasSubFields = selected.sub_fields && selected.sub_fields.length > 0;
\t\tconst isTechEng = isTechOrEngineering(selected.category);
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
\t\t\t\t\tanswers: [],
\t\t\t\t\tcareers: [selected.career],
\t\t\t\t\tcategory: selected.category,
\t\t\t\t\tuser_summary: "",
\t\t\t\t\texperience_level: experienceLevel || "",
\t\t\t\t\tsub_field: selectedSubField?.name || "",
\t\t\t\t\tselected_language: selectedLanguage?.name || selectedLanguage || "",
\t\t\t\t\tprefer_paid: preferPaid,
\t\t\t\t}),
\t\t\t});
\t\t\tif (!res.ok) throw new Error("Failed to generate roadmap");
\t\t\tconst data = await res.json();
\t\t\tsetResult(data);
\t\t\tlocalStorage.setItem("roadmapResult", JSON.stringify(data));

\t\t\t// Generate follow-up roadmap if user requested one
\t\t\tif (wantsFollowUpRoadmap && selectedRecommendedField) {
\t\t\t\tsetFollowUpLoading(true);
\t\t\t\ttry {
\t\t\t\t\tconst res2 = await fetch("http://localhost:8000/generate", {
\t\t\t\t\t\tmethod: "POST",
\t\t\t\t\t\theaders: { "Content-Type": "application/json" },
\t\t\t\t\t\tbody: JSON.stringify({
\t\t\t\t\t\t\tanswers: [],
\t\t\t\t\t\t\tcareers: [selectedRecommendedField.field],
\t\t\t\t\t\t\tcategory: selected.category,
\t\t\t\t\t\t\tuser_summary: "",
\t\t\t\t\t\t\texperience_level: experienceLevel || "",
\t\t\t\t\t\t\tselected_language: selectedLanguage?.name || selectedLanguage || "",
\t\t\t\t\t\t\tprefer_paid: preferPaid,
\t\t\t\t\t\t}),
\t\t\t\t\t});
\t\t\t\t\tif (res2.ok) {
\t\t\t\t\t\tconst data2 = await res2.json();
\t\t\t\t\t\tsetFollowUpResult(data2);
\t\t\t\t\t}
\t\t\t\t} catch (err2) {
\t\t\t\t\tconsole.error("Follow-up roadmap error:", err2);
\t\t\t\t} finally {
\t\t\t\t\tsetFollowUpLoading(false);
\t\t\t\t}
\t\t\t}
\t\t} catch (err) {
\t\t\tsetError(err.message || "Something went wrong");
\t\t} finally {
\t\t\tsetLoading(false);
\t\t}
\t};"""

assert old in c, "Old handleGenerate not found!"
c = c.replace(old, new)

F.write_text(c, encoding="utf-8")
print("Fixed handleGenerate with follow-up roadmap logic!")
