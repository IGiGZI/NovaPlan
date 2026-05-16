"""Patch Fetching.jsx: Improve summary flow per user request."""
from pathlib import Path

F = Path(__file__).parent.parent / "src" / "pages" / "Fetching.jsx"
c = F.read_text(encoding="utf-8")

# 1. Add usedSummary state after summarySubmitting
old1 = '\tconst [summarySubmitting, setSummarySubmitting] = useState(false);\r\n'
new1 = '\tconst [summarySubmitting, setSummarySubmitting] = useState(false);\r\n\tconst [usedSummary, setUsedSummary] = useState(null); // null = not decided, true = used summary, false = skipped\r\n\tconst [summaryChoice, setSummaryChoice] = useState(null); // null = not asked, true = wants summary, false = skip\r\n'
assert old1 in c, "summarySubmitting not found"
c = c.replace(old1, new1)
print("1. Added usedSummary + summaryChoice state")

# 2. Update auto-trigger: instead of directly showing summary input when pool is large,
#    show a choice prompt first
old2 = """\t// Auto-trigger results or summary\r
\tif (shouldShowResults && !reachedResult) {\r
\t\t// If pool is still large, show summary input first\r
\t\tif (pool.length > RESULT_THRESHOLD && !showSummaryInput) {\r
\t\t\tsetShowSummaryInput(true);\r
\t\t} else if (!showSummaryInput) {\r
\t\t\tsetReachedResult(true);\r
\t\t\tsetResultCareers(pool.slice(0, RESULT_THRESHOLD));\r
\t\t}\r
\t} else if (!currentQuestion && answeredCount < MIN_QUESTIONS && !showSummaryInput && !reachedResult) {\r
\t\t// Ran out of questions before reaching minimum — show summary input as fallback\r
\t\tsetShowSummaryInput(true);\r
\t}"""
new2 = """\t// Auto-trigger results or summary choice
\tif (shouldShowResults && !reachedResult) {
\t\t// If pool is still large, show summary choice prompt first
\t\tif (pool.length > RESULT_THRESHOLD && !showSummaryInput && summaryChoice === null) {
\t\t\tsetShowSummaryInput(true);
\t\t} else if (!showSummaryInput) {
\t\t\tsetReachedResult(true);
\t\t\tsetResultCareers(pool.slice(0, RESULT_THRESHOLD));
\t\t}
\t} else if (!currentQuestion && answeredCount < MIN_QUESTIONS && !showSummaryInput && !reachedResult) {
\t\t// Ran out of questions before reaching minimum — show summary choice
\t\tsetShowSummaryInput(true);
\t}"""
assert old2 in c, "Auto-trigger not found"
c = c.replace(old2, new2)
print("2. Updated auto-trigger logic")

# 3. Replace the handleSummaryContinue to track usedSummary
old3 = """\tconst handleSummaryContinue = async () => {\r
\t\tif (!userSummary.trim()) {\r
\t\t\t// If empty, just skip and show what we have\r
\t\t\tsetShowSummaryInput(false);\r
\t\t\tsetReachedResult(true);\r
\t\t\tsetResultCareers(pool.slice(0, RESULT_THRESHOLD));\r
\t\t\treturn;\r
\t\t}"""
new3 = """\tconst handleSummaryContinue = async () => {
\t\tif (!userSummary.trim()) {
\t\t\t// If empty, just skip and show what we have
\t\t\tsetUsedSummary(false);
\t\t\tsetShowSummaryInput(false);
\t\t\tsetReachedResult(true);
\t\t\tsetResultCareers(pool.slice(0, RESULT_THRESHOLD));
\t\t\treturn;
\t\t}"""
assert old3 in c, "handleSummaryContinue start not found"
c = c.replace(old3, new3)
print("3a. Updated handleSummaryContinue skip path")

# Also mark usedSummary=true when summary is submitted successfully
old3b = """\t\t\tsetShowSummaryInput(false);\r
\t\t\tsetReachedResult(true);\r
\t\t\tsetResultCareers(finalResults.slice(0, RESULT_THRESHOLD));\r
\t\t} catch (err) {\r
\t\t\tconsole.error("NLP error:", err);\r
\t\t\t// Fallback: just show the pool\r
\t\t\tsetShowSummaryInput(false);\r
\t\t\tsetReachedResult(true);\r
\t\t\tsetResultCareers(pool.slice(0, RESULT_THRESHOLD));"""
new3b = """\t\t\tsetUsedSummary(true);
\t\t\tsetShowSummaryInput(false);
\t\t\tsetReachedResult(true);
\t\t\tsetResultCareers(finalResults.slice(0, RESULT_THRESHOLD));
\t\t} catch (err) {
\t\t\tconsole.error("NLP error:", err);
\t\t\t// Fallback: just show the pool
\t\t\tsetUsedSummary(true);
\t\t\tsetShowSummaryInput(false);
\t\t\tsetReachedResult(true);
\t\t\tsetResultCareers(pool.slice(0, RESULT_THRESHOLD));"""
assert old3b in c, "handleSummaryContinue success path not found"
c = c.replace(old3b, new3b)
print("3b. Updated handleSummaryContinue success path")

# 4. Reset new state in handleRestart
old4 = '\t\tsetShowSummaryInput(false);\r\n\t\tsetShowAboutMe(false);'
new4 = '\t\tsetShowSummaryInput(false);\r\n\t\tsetUsedSummary(null);\r\n\t\tsetSummaryChoice(null);\r\n\t\tsetShowAboutMe(false);'
assert old4 in c, "handleRestart reset not found"
c = c.replace(old4, new4)
print("4. Reset new state in handleRestart")

# 5. Reset in handleBack
old5 = '\t\tsetShowSummaryInput(false);\r\n\t};'
new5 = '\t\tsetShowSummaryInput(false);\r\n\t\tsetUsedSummary(null);\r\n\t\tsetSummaryChoice(null);\r\n\t};'
assert old5 in c, "handleBack reset not found"
c = c.replace(old5, new5, 1)
print("5. Reset new state in handleBack")

# 6. Replace the NLP Summary input card with a choice-first flow
old_card = """\t\t\t\t\t) : showSummaryInput && !reachedResult ? (\r
\t\t\t\t\t\t/* NLP Summary input card */\r
\t\t\t\t\t\t<div className="bg-linear-to-br from-purple-900/20 to-transparent backdrop-blur-sm p-6 md:p-8 rounded-xl shadow-lg border border-purple-500/30 space-y-6">\r
\t\t\t\t\t\t\t<div>\r
\t\t\t\t\t\t\t\t<p className="text-sm text-purple-400 font-medium mb-1 uppercase tracking-widest">\r
\t\t\t\t\t\t\t\t\tTell Us More About Yourself\r
\t\t\t\t\t\t\t\t</p>\r
\t\t\t\t\t\t\t\t<p className="text-gray-300 mb-4">\r
\t\t\t\t\t\t\t\t\tWe still have {pool.length} potential careers for you.\r
\t\t\t\t\t\t\t\t\tTo help us narrow it down, tell us about your\r
\t\t\t\t\t\t\t\t\tinterests, skills, hobbies, or what kind of career\r
\t\t\t\t\t\t\t\t\texcites you.\r
\t\t\t\t\t\t\t\t</p>\r
\t\t\t\t\t\t\t</div>\r
\r
\t\t\t\t\t\t\t<textarea\r
\t\t\t\t\t\t\t\tvalue={userSummary}\r
\t\t\t\t\t\t\t\tonChange={(e) => setUserSummary(e.target.value)}\r
\t\t\t\t\t\t\t\tplaceholder="E.g. I love working with computers and solving problems. I'm interested in cybersecurity and enjoy learning about how hackers break into systems..."\r
\t\t\t\t\t\t\t\trows={5}\r
\t\t\t\t\t\t\t\tclassName="w-full rounded-lg px-4 py-3 bg-purple-900/30 border border-purple-500/30 text-gray-200 placeholder-gray-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all resize-none"\r
\t\t\t\t\t\t\t/>\r
\r
\t\t\t\t\t\t\t<div className="flex items-center gap-3">\r
\t\t\t\t\t\t\t\t<button\r
\t\t\t\t\t\t\t\t\tonClick={handleBack}\r
\t\t\t\t\t\t\t\t\tclassName="rounded-full px-6 py-3 border border-purple-500/40 text-gray-300 hover:border-purple-400 hover:text-white transition-all"\r
\t\t\t\t\t\t\t\t>\r
\t\t\t\t\t\t\t\t\t\u2190 Back\r
\t\t\t\t\t\t\t\t</button>\r
\t\t\t\t\t\t\t\t<button\r
\t\t\t\t\t\t\t\t\tonClick={handleSummaryContinue}\r
\t\t\t\t\t\t\t\t\tdisabled={summarySubmitting}\r
\t\t\t\t\t\t\t\t\tclassName="specialBtnGradient rounded-full px-8 py-3 text-white font-semibold shadow-lg shadow-purple-500/50 hover:scale-105 transition-transform disabled:opacity-50"\r
\t\t\t\t\t\t\t\t>\r
\t\t\t\t\t\t\t\t\t{summarySubmitting\r
\t\t\t\t\t\t\t\t\t\t? "Analyzing..."\r
\t\t\t\t\t\t\t\t\t\t: userSummary.trim()\r
\t\t\t\t\t\t\t\t\t\t\t? "Continue with Summary \u2192"\r
\t\t\t\t\t\t\t\t\t\t\t: "Skip & See Results \u2192"}\r
\t\t\t\t\t\t\t\t</button>\r
\t\t\t\t\t\t\t</div>\r
\t\t\t\t\t\t</div>"""

new_card = """\t\t\t\t\t) : showSummaryInput && !reachedResult ? (
\t\t\t\t\t\t/* Summary choice + input */
\t\t\t\t\t\t<div className="bg-linear-to-br from-purple-900/20 to-transparent backdrop-blur-sm p-6 md:p-8 rounded-xl shadow-lg border border-purple-500/30 space-y-6">
\t\t\t\t\t\t\t{summaryChoice === null ? (
\t\t\t\t\t\t\t\t<>
\t\t\t\t\t\t\t\t\t<div>
\t\t\t\t\t\t\t\t\t\t<p className="text-sm text-purple-400 font-medium mb-1 uppercase tracking-widest">
\t\t\t\t\t\t\t\t\t\t\t\u2728 One More Thing
\t\t\t\t\t\t\t\t\t\t</p>
\t\t\t\t\t\t\t\t\t\t<p className="text-gray-300 mb-2">
\t\t\t\t\t\t\t\t\t\t\tWe have {pool.length} potential careers based on your answers.
\t\t\t\t\t\t\t\t\t\t</p>
\t\t\t\t\t\t\t\t\t\t<p className="text-gray-400 text-sm">
\t\t\t\t\t\t\t\t\t\t\tWould you like to write a short summary about yourself? It'll help us
\t\t\t\t\t\t\t\t\t\t\tcombine your answers with your interests to find an even better match.
\t\t\t\t\t\t\t\t\t\t</p>
\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t<div className="flex items-center gap-3">
\t\t\t\t\t\t\t\t\t\t<button onClick={handleBack} className="rounded-full px-6 py-3 border border-purple-500/40 text-gray-300 hover:border-purple-400 hover:text-white transition-all">\u2190 Back</button>
\t\t\t\t\t\t\t\t\t\t<button onClick={() => setSummaryChoice(true)} className="specialBtnGradient rounded-full px-6 py-3 text-white font-semibold shadow-lg shadow-purple-500/50 hover:scale-105 transition-transform">\u270d\ufe0f Yes, I'll write a summary</button>
\t\t\t\t\t\t\t\t\t\t<button onClick={() => { setSummaryChoice(false); setUsedSummary(false); setShowSummaryInput(false); setReachedResult(true); setResultCareers(pool.slice(0, RESULT_THRESHOLD)); }} className="rounded-full px-6 py-3 border border-purple-500/40 text-gray-300 hover:border-purple-400 hover:text-white transition-all">No, just show results \u2192</button>
\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t</>
\t\t\t\t\t\t\t) : (
\t\t\t\t\t\t\t\t<>
\t\t\t\t\t\t\t\t\t<div>
\t\t\t\t\t\t\t\t\t\t<p className="text-sm text-purple-400 font-medium mb-1 uppercase tracking-widest">
\t\t\t\t\t\t\t\t\t\t\tTell Us About Yourself
\t\t\t\t\t\t\t\t\t\t</p>
\t\t\t\t\t\t\t\t\t\t<p className="text-gray-400 text-sm">
\t\t\t\t\t\t\t\t\t\t\tDescribe your interests, hobbies, and skills. This will be combined
\t\t\t\t\t\t\t\t\t\t\twith your quiz answers to find the best career match.
\t\t\t\t\t\t\t\t\t\t</p>
\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t<textarea
\t\t\t\t\t\t\t\t\t\tvalue={userSummary}
\t\t\t\t\t\t\t\t\t\tonChange={(e) => setUserSummary(e.target.value)}
\t\t\t\t\t\t\t\t\t\tplaceholder="E.g. I love working with computers and solving problems. I'm interested in cybersecurity and enjoy learning about how hackers break into systems..."
\t\t\t\t\t\t\t\t\t\trows={5}
\t\t\t\t\t\t\t\t\t\tclassName="w-full rounded-lg px-4 py-3 bg-purple-900/30 border border-purple-500/30 text-gray-200 placeholder-gray-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all resize-none"
\t\t\t\t\t\t\t\t\t/>
\t\t\t\t\t\t\t\t\t<div className="flex items-center gap-3">
\t\t\t\t\t\t\t\t\t\t<button onClick={() => { setSummaryChoice(null); setUserSummary(""); }} className="rounded-full px-6 py-3 border border-purple-500/40 text-gray-300 hover:border-purple-400 hover:text-white transition-all">\u2190 Back</button>
\t\t\t\t\t\t\t\t\t\t<button onClick={handleSummaryContinue} disabled={summarySubmitting || !userSummary.trim()} className="specialBtnGradient rounded-full px-8 py-3 text-white font-semibold shadow-lg shadow-purple-500/50 hover:scale-105 transition-transform disabled:opacity-50">
\t\t\t\t\t\t\t\t\t\t\t{summarySubmitting ? "Analyzing..." : "Continue with Summary \u2192"}
\t\t\t\t\t\t\t\t\t\t</button>
\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t</>
\t\t\t\t\t\t\t)}
\t\t\t\t\t\t</div>"""

assert old_card in c, "Summary input card not found"
c = c.replace(old_card, new_card)
print("6. Replaced summary card with choice-first flow")

# 7. Replace "Tell Us About Yourself" in results with opposite-action button
old_about = """\t\t\t\t\t\t\t{/* \u2500\u2500 Tell Us About Yourself \u2500\u2500 */}\r
\t\t\t\t\t\t\t<div className="mt-6 pt-6 border-t border-purple-500/20">\r
\t\t\t\t\t\t\t\t{!showAboutMe ? (\r
\t\t\t\t\t\t\t\t\t<button\r
\t\t\t\t\t\t\t\t\t\tonClick={() => setShowAboutMe(true)}\r
\t\t\t\t\t\t\t\t\t\tclassName="w-full text-left rounded-lg px-4 py-3 border border-dashed border-purple-500/40 text-gray-400 hover:border-purple-400 hover:text-gray-200 transition-all"\r
\t\t\t\t\t\t\t\t\t>\r
\t\t\t\t\t\t\t\t\t\t\u270d\ufe0f <span className="font-medium">Tell Us About Yourself</span>\r
\t\t\t\t\t\t\t\t\t\t<span className="block text-xs text-gray-500 mt-1">\r
\t\t\t\t\t\t\t\t\t\t\tDescribe your interests, hobbies, and skills \u2014 our AI will suggest a career for you\r
\t\t\t\t\t\t\t\t\t\t</span>\r
\t\t\t\t\t\t\t\t\t</button>"""

new_about = """\t\t\t\t\t\t\t{/* \u2500\u2500 Try Opposite Approach \u2500\u2500 */}
\t\t\t\t\t\t\t<div className="mt-6 pt-6 border-t border-purple-500/20">
\t\t\t\t\t\t\t\t{!showAboutMe ? (
\t\t\t\t\t\t\t\t\t<button
\t\t\t\t\t\t\t\t\t\tonClick={() => {
\t\t\t\t\t\t\t\t\t\t\tif (usedSummary) {
\t\t\t\t\t\t\t\t\t\t\t\t// They used summary before \u2192 try questions-only
\t\t\t\t\t\t\t\t\t\t\t\tsetUsedSummary(false);
\t\t\t\t\t\t\t\t\t\t\t\tsetUserSummary("");
\t\t\t\t\t\t\t\t\t\t\t\tsetSelectedCareer(null);
\t\t\t\t\t\t\t\t\t\t\t\tsetResultCareers(pool.slice(0, RESULT_THRESHOLD));
\t\t\t\t\t\t\t\t\t\t\t} else {
\t\t\t\t\t\t\t\t\t\t\t\t// They skipped summary before \u2192 offer to write one
\t\t\t\t\t\t\t\t\t\t\t\tsetShowAboutMe(true);
\t\t\t\t\t\t\t\t\t\t\t}
\t\t\t\t\t\t\t\t\t\t}}
\t\t\t\t\t\t\t\t\t\tclassName="w-full text-left rounded-lg px-4 py-3 border border-dashed border-purple-500/40 text-gray-400 hover:border-purple-400 hover:text-gray-200 transition-all"
\t\t\t\t\t\t\t\t\t>
\t\t\t\t\t\t\t\t\t\t{usedSummary ? (
\t\t\t\t\t\t\t\t\t\t\t<>
\t\t\t\t\t\t\t\t\t\t\t\t\ud83d\udcdd <span className="font-medium">Try Without Summary</span>
\t\t\t\t\t\t\t\t\t\t\t\t<span className="block text-xs text-gray-500 mt-1">
\t\t\t\t\t\t\t\t\t\t\t\t\tNot happy with the results? See careers based only on your quiz answers
\t\t\t\t\t\t\t\t\t\t\t\t</span>
\t\t\t\t\t\t\t\t\t\t\t</>
\t\t\t\t\t\t\t\t\t\t) : (
\t\t\t\t\t\t\t\t\t\t\t<>
\t\t\t\t\t\t\t\t\t\t\t\t\u270d\ufe0f <span className="font-medium">Try With a Summary</span>
\t\t\t\t\t\t\t\t\t\t\t\t<span className="block text-xs text-gray-500 mt-1">
\t\t\t\t\t\t\t\t\t\t\t\t\tNot happy? Describe your interests and our AI will refine your matches
\t\t\t\t\t\t\t\t\t\t\t\t</span>
\t\t\t\t\t\t\t\t\t\t\t</>
\t\t\t\t\t\t\t\t\t\t)}
\t\t\t\t\t\t\t\t\t</button>"""

assert old_about in c, "Tell Us About Yourself button not found"
c = c.replace(old_about, new_about)
print("7. Replaced 'Tell Us About Yourself' with opposite-action button")

F.write_text(c, encoding="utf-8")
print(f"Done! Size: {len(c)}")
