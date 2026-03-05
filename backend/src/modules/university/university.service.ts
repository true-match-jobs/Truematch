const TARGET_COUNTRIES = ['United Kingdom', 'Canada', 'Australia', 'United States'] as const;
type TargetCountry = (typeof TARGET_COUNTRIES)[number];

const FALLBACK_UNIVERSITIES = [
  'University of Oxford',
  'University of Cambridge',
  'University College London',
  'Imperial College London',
  'University of Manchester',
  'University of Edinburgh',
  'King\'s College London',
  'London School of Economics and Political Science',
  'University of Warwick',
  'University of Bristol',
  'University of Glasgow',
  'University of Birmingham',
  'University of Leeds',
  'University of Toronto',
  'University of British Columbia',
  'McGill University',
  'University of Alberta',
  'University of Waterloo',
  'Western University',
  'University of Calgary',
  'Queen\'s University',
  'York University',
  'Simon Fraser University',
  'University of Melbourne',
  'University of Sydney',
  'Monash University',
  'Australian National University',
  'University of Queensland',
  'UNSW Sydney',
  'University of Adelaide',
  'University of Western Australia',
  'RMIT University',
  'Deakin University',
  'Macquarie University',
  'Harvard University',
  'Stanford University',
  'Massachusetts Institute of Technology',
  'University of California, Berkeley',
  'University of California, Los Angeles',
  'Columbia University',
  'Yale University',
  'Princeton University',
  'University of Pennsylvania',
  'Cornell University',
  'Johns Hopkins University',
  'New York University',
  'University of Chicago',
  'Duke University',
  'Northwestern University',
  'University of Michigan',
  'University of Washington',
  'Pennsylvania State University',
  'Arizona State University',
  'University of Texas at Austin',
  'University of Southern California',
  'Georgia Institute of Technology',
  'University of Amsterdam',
  'Delft University of Technology',
  'ETH Zurich',
  'University of Copenhagen',
  'Heidelberg University',
  'Technical University of Munich',
  'University of Auckland',
  'National University of Singapore',
  'Nanyang Technological University',
  'University of Hong Kong',
  'Peking University',
  'Tsinghua University',
  'University of Cape Town',
  'University of Nairobi'
];

const FALLBACK_UNIVERSITIES_BY_COUNTRY: Record<TargetCountry, string[]> = {
  'United Kingdom': [
    'University of Oxford',
    'University of Cambridge',
    'University College London',
    'Imperial College London',
    'University of Manchester',
    'University of Edinburgh',
    "King's College London",
    'London School of Economics and Political Science',
    'University of Warwick',
    'University of Bristol',
    'University of Glasgow',
    'University of Birmingham',
    'University of Leeds'
  ],
  Canada: [
    'University of Toronto',
    'University of British Columbia',
    'McGill University',
    'University of Alberta',
    'University of Waterloo',
    'Western University',
    'University of Calgary',
    "Queen's University",
    'York University',
    'Simon Fraser University'
  ],
  Australia: [
    'University of Melbourne',
    'University of Sydney',
    'Monash University',
    'Australian National University',
    'University of Queensland',
    'UNSW Sydney',
    'University of Adelaide',
    'University of Western Australia',
    'RMIT University',
    'Deakin University',
    'Macquarie University'
  ],
  'United States': [
    'Harvard University',
    'Stanford University',
    'Massachusetts Institute of Technology',
    'University of California, Berkeley',
    'University of California, Los Angeles',
    'Columbia University',
    'Yale University',
    'Princeton University',
    'University of Pennsylvania',
    'Cornell University',
    'Johns Hopkins University',
    'New York University',
    'University of Chicago',
    'Duke University',
    'Northwestern University',
    'University of Michigan',
    'University of Washington',
    'Pennsylvania State University',
    'Arizona State University',
    'University of Texas at Austin',
    'University of Southern California',
    'Georgia Institute of Technology'
  ]
};

type HipolabsUniversity = {
  name?: string;
};

const normalizeName = (value: string): string => value.trim();

const MAX_RESULTS = 40;

const toLowerTrimmed = (value: string): string => value.toLowerCase().trim();

const toTargetCountry = (country?: string): TargetCountry | null => {
  if (!country) {
    return null;
  }

  const normalizedCountry = toLowerTrimmed(country);

  return TARGET_COUNTRIES.find((targetCountry) => toLowerTrimmed(targetCountry) === normalizedCountry) ?? null;
};

const scoreMatch = (name: string, query: string): number => {
  const normalizedName = toLowerTrimmed(name);
  const normalizedQuery = toLowerTrimmed(query);

  if (!normalizedQuery || !normalizedName.includes(normalizedQuery)) {
    return 0;
  }

  if (normalizedName === normalizedQuery) {
    return 130;
  }

  if (normalizedName.startsWith(normalizedQuery)) {
    return 110;
  }

  if (normalizedName.includes(` ${normalizedQuery}`)) {
    return 90;
  }

  return 70;
};

const rankNames = (names: string[], query: string): string[] =>
  names
    .map((name) => ({ name, score: scoreMatch(name, query) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name))
    .map((entry) => entry.name);

const mergeUniqueNames = (primary: string[], secondary: string[]): string[] => {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const name of [...primary, ...secondary]) {
    const normalizedKey = toLowerTrimmed(name);

    if (!normalizedKey || seen.has(normalizedKey)) {
      continue;
    }

    seen.add(normalizedKey);
    merged.push(name);

    if (merged.length >= MAX_RESULTS) {
      break;
    }
  }

  return merged;
};

const matchesQuery = (name: string, query: string): boolean => {
  const normalizedName = toLowerTrimmed(name);
  const normalizedQuery = toLowerTrimmed(query);

  if (!normalizedQuery) {
    return false;
  }

  if (normalizedName.includes(normalizedQuery)) {
    return true;
  }

  const queryTerms = normalizedQuery.split(/\s+/).filter((term) => term.length > 1);
  if (queryTerms.length === 0) {
    return false;
  }

  return queryTerms.every((term) => normalizedName.includes(term));
};

export const searchUniversityNames = async (query: string, country?: string): Promise<string[]> => {
  const trimmedQuery = query.trim();
  const targetCountry = toTargetCountry(country);

  if (trimmedQuery.length < 1) {
    return [];
  }

  const fallbackNames = targetCountry
    ? (FALLBACK_UNIVERSITIES_BY_COUNTRY[targetCountry] ?? [])
    : FALLBACK_UNIVERSITIES;
  const fallbackRankedNames = rankNames(fallbackNames, trimmedQuery);

  try {
    const countryList = targetCountry ? [targetCountry] : TARGET_COUNTRIES;
    const [countryResponseResults, broadResponseResult] = await Promise.all([
      Promise.allSettled(
        countryList.map((countryName) =>
          fetch(
            `https://universities.hipolabs.com/search?name=${encodeURIComponent(trimmedQuery)}&country=${encodeURIComponent(countryName)}`
          )
        )
      ),
      targetCountry
        ? Promise.resolve([] as PromiseSettledResult<Response>[])
        : Promise.allSettled([fetch(`https://universities.hipolabs.com/search?name=${encodeURIComponent(trimmedQuery)}`)])
    ]);

    const countryData = await Promise.all(
      countryResponseResults.map(async (result) => {
        if (result.status !== 'fulfilled' || !result.value.ok) {
          return [] as HipolabsUniversity[];
        }

        return (await result.value.json()) as HipolabsUniversity[];
      })
    );

    const broadData =
      !targetCountry && broadResponseResult[0]?.status === 'fulfilled' && broadResponseResult[0].value.ok
        ? (((await broadResponseResult[0].value.json()) as HipolabsUniversity[]) ?? [])
        : [];

    const providerNames = [...countryData.flat(), ...broadData]
      .map((item) => normalizeName(item.name ?? ''))
      .filter((name) => name.length > 0 && matchesQuery(name, trimmedQuery));

    if (providerNames.length > 0) {
      const providerRankedNames = rankNames(providerNames, trimmedQuery);
      return mergeUniqueNames(providerRankedNames, fallbackRankedNames);
    }
  } catch (_error) {
    // fallback below
  }

  return fallbackRankedNames.slice(0, MAX_RESULTS);
};
