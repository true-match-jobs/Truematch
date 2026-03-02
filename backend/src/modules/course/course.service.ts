type OpenAlexConcept = {
  display_name?: string;
};

type OpenAlexResponse = {
  results?: OpenAlexConcept[];
};

const FALLBACK_COURSE_TYPES = [
  'Computer Science',
  'Data Science',
  'Business Administration',
  'Cyber Security',
  'Artificial Intelligence',
  'Software Engineering',
  'Information Technology',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Public Health',
  'Nursing',
  'Economics',
  'Accounting',
  'Finance',
  'Marketing',
  'Law',
  'Psychology',
  'International Relations',
  'Project Management'
];

const normalizeValue = (value: string): string => value.trim();

const matchesQuery = (value: string, query: string): boolean => {
  const normalizedValue = value.toLowerCase();
  const normalizedQuery = query.toLowerCase().trim();

  if (!normalizedQuery) {
    return false;
  }

  if (normalizedValue.includes(normalizedQuery)) {
    return true;
  }

  const queryTerms = normalizedQuery.split(/\s+/).filter((term) => term.length > 1);
  if (queryTerms.length === 0) {
    return false;
  }

  return queryTerms.every((term) => normalizedValue.includes(term));
};

export const searchCourseTypes = async (query: string): Promise<string[]> => {
  const trimmedQuery = query.trim();

  if (trimmedQuery.length < 1) {
    return [];
  }

  const fallbackTypes = FALLBACK_COURSE_TYPES.filter((courseType) => matchesQuery(courseType, trimmedQuery)).slice(0, 20);

  try {
    const responseResult = await Promise.allSettled([
      fetch(`https://api.openalex.org/concepts?search=${encodeURIComponent(trimmedQuery)}&per-page=30`)
    ]);

    if (responseResult[0]?.status !== 'fulfilled' || !responseResult[0].value.ok) {
      return fallbackTypes;
    }

    const data = (await responseResult[0].value.json()) as OpenAlexResponse;
    const uniqueCourseTypes = new Set<string>();

    for (const concept of data.results ?? []) {
      const conceptName = normalizeValue(concept.display_name ?? '');

      if (conceptName.length > 0 && matchesQuery(conceptName, trimmedQuery)) {
        uniqueCourseTypes.add(conceptName);
      }

      if (uniqueCourseTypes.size >= 20) {
        break;
      }
    }

    if (uniqueCourseTypes.size > 0) {
      return Array.from(uniqueCourseTypes);
    }
  } catch (_error) {
    // fallback below
  }

  return fallbackTypes;
};
