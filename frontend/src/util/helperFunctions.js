import {DOC_LINKS} from "../data/Data"

// Flatten all careers from the JSON into a searchable list
export function flattenCareers(data) {
  const flat = [];
  for (const categoryObj of data) {
    const { category, careers_by_learning_path } = categoryObj;
    for (const [, careers] of Object.entries(careers_by_learning_path)) {
      for (const careerObj of careers) {
        flat.push({
          career: careerObj.career,
          category,
          skills: careerObj.skills ?? [],
          sub_fields: careerObj.sub_fields ?? [],
          languages: careerObj.languages ?? [],
          education_level:
            careerObj.education_level ?? "Not Specified",
          popular_in_egypt: careerObj.popular_in_egypt ?? false,
        });
      }
    }
  }
  const seen = new Set();
  return flat.filter((c) => {
    if (seen.has(c.career)) return false;
    seen.add(c.career);
    return true;
  });
}

// Build a map of category -> careers (deduplicated)
export function buildCategoryMap(data) {
  const map = {};
  for (const categoryObj of data) {
    const { category, careers_by_learning_path } = categoryObj;
    const seen = new Set();
    const careers = [];
    for (const [, careerList] of Object.entries(careers_by_learning_path)) {
      for (const careerObj of careerList) {
        if (!seen.has(careerObj.career)) {
          seen.add(careerObj.career);
          careers.push({
            career: careerObj.career,
            skills: careerObj.skills ?? [],
            sub_fields: careerObj.sub_fields ?? [],
            languages: careerObj.languages ?? [],
            education_level:
              careerObj.education_level ?? "Not Specified",
            popular_in_egypt: careerObj.popular_in_egypt ?? false,
          });
        }
      }
    }
    map[category] = careers;
  }
  return map;
}

export const getDocLink = (langName) => {
  const name = langName.split("/")[0].split("(")[0].trim().toLowerCase();
  return (
    DOC_LINKS[name] ||
    `https://devdocs.io/#q=${encodeURIComponent(name)}`
  );
};