const TARGET_COUNTRIES = ['United Kingdom', 'Canada', 'Australia', 'United States'] as const;

const FALLBACK_UNIVERSITIES = [
  'University of Oxford',
  'University of Cambridge',
  'University College London',
  'Imperial College London',
  'University of Manchester',
  'University of Edinburgh',
  'University of Toronto',
  'University of British Columbia',
  'McGill University',
  'University of Alberta',
  'University of Melbourne',
  'University of Sydney',
  'Monash University',
  'Australian National University',
  'Harvard University',
  'Stanford University',
  'Massachusetts Institute of Technology',
  'University of California, Berkeley',
  'University of California, Los Angeles',
  'Columbia University'
];

type HipolabsUniversity = {
  name?: string;
};

const normalizeName = (value: string): string => value.trim();

const matchesQuery = (name: string, query: string): boolean => {
  const normalizedName = name.toLowerCase();
  const normalizedQuery = query.toLowerCase().trim();

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

export const searchUniversityNames = async (query: string): Promise<string[]> => {
  const trimmedQuery = query.trim();

  if (trimmedQuery.length < 2) {
    return [];
  }

  try {
    const countryRequests = TARGET_COUNTRIES.map((country) =>
      fetch(
        `https://universities.hipolabs.com/search?name=${encodeURIComponent(trimmedQuery)}&country=${encodeURIComponent(country)}`
      )
    );

    const broadRequest = fetch(`https://universities.hipolabs.com/search?name=${encodeURIComponent(trimmedQuery)}`);
    const countryResponses = await Promise.all(countryRequests);
    const broadResponse = await broadRequest;

    const countryData = await Promise.all(
      countryResponses.map(async (response) => {
        if (!response.ok) {
          return [] as HipolabsUniversity[];
        }

        return (await response.json()) as HipolabsUniversity[];
      })
    );

    const broadData = broadResponse.ok ? ((await broadResponse.json()) as HipolabsUniversity[]) : [];

    const countryQueues = countryData.map((items) =>
      items
        .map((item) => normalizeName(item.name ?? ''))
        .filter((name) => name.length > 0 && matchesQuery(name, trimmedQuery))
    );

    const broadQueue = broadData
      .map((item) => normalizeName(item.name ?? ''))
      .filter((name) => name.length > 0 && matchesQuery(name, trimmedQuery));

    const uniqueNames = new Set<string>();

    let queueHasItems = true;
    while (queueHasItems && uniqueNames.size < 25) {
      queueHasItems = false;

      for (const queue of countryQueues) {
        const next = queue.shift();

        if (next) {
          uniqueNames.add(next);
          queueHasItems = true;
        }

        if (uniqueNames.size >= 25) {
          break;
        }
      }
    }

    for (const name of broadQueue) {
      uniqueNames.add(name);
      if (uniqueNames.size >= 25) {
        break;
      }
    }

    if (uniqueNames.size > 0) {
      return Array.from(uniqueNames);
    }
  } catch (_error) {
    // fallback below
  }

  return FALLBACK_UNIVERSITIES.filter((name) => matchesQuery(name, trimmedQuery)).slice(0, 25);
};
