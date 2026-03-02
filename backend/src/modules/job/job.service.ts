type RemotiveJob = {
  title?: string;
  job_title?: string;
};

type RemotiveResponse = {
  jobs?: RemotiveJob[];
};

const FALLBACK_TITLES = [
  'Web Developer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Software Engineer',
  'DevOps Engineer',
  'Data Analyst',
  'Data Scientist',
  'UI/UX Designer',
  'Product Manager',
  'Project Manager',
  'Business Analyst',
  'Account Manager',
  'Sales Manager',
  'Sales Executive',
  'Customer Support Specialist',
  'Customer Success Manager',
  'Marketing Manager',
  'Digital Marketing Specialist',
  'Content Writer',
  'Graphic Designer',
  'Video Editor',
  'Social Media Manager',
  'HR Specialist',
  'Recruiter',
  'Operations Manager',
  'Administrative Assistant',
  'Virtual Assistant',
  'Finance Manager',
  'Accountant',
  'Financial Analyst',
  'Teacher',
  'Tutor',
  'Research Assistant',
  'Nurse',
  'Caregiver',
  'Pharmacist',
  'Chef',
  'Sous Chef',
  'Pastry Chef',
  'Line Cook',
  'Cook',
  'Baker',
  'Barista',
  'Restaurant Manager',
  'Waiter',
  'Bartender',
  'Housekeeper',
  'Driver',
  'Delivery Driver',
  'Warehouse Associate',
  'Logistics Coordinator',
  'Electrician',
  'Plumber',
  'Civil Engineer',
  'Mechanical Engineer',
  'Electrical Engineer',
  'Architect',
  'Cyber Security Analyst',
  'Cloud Engineer',
  'Mobile Developer',
  'QA Engineer',
  'Scrum Master',
  'JavaScript Developer',
  'Python Developer',
  'Java Developer',
  'Machine Learning Engineer',
  'AI Engineer',
  'Data Engineer',
  'SEO Specialist',
  'Copywriter',
  'Translator',
  'Interpreter'
];

const normalizeTitle = (value: string): string => value.trim();

const MAX_RESULTS = 20;

const toLowerTrimmed = (value: string): string => value.toLowerCase().trim();

const scoreMatch = (title: string, query: string): number => {
  const normalizedTitle = toLowerTrimmed(title);
  const normalizedQuery = toLowerTrimmed(query);

  if (!normalizedQuery || !normalizedTitle.includes(normalizedQuery)) {
    return 0;
  }

  if (normalizedTitle === normalizedQuery) {
    return 120;
  }

  if (normalizedTitle.startsWith(normalizedQuery)) {
    return 100;
  }

  if (normalizedTitle.includes(` ${normalizedQuery}`)) {
    return 80;
  }

  return 60;
};

const rankTitles = (titles: string[], query: string): string[] =>
  titles
    .map((title) => ({ title, score: scoreMatch(title, query) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title))
    .map((entry) => entry.title);

const mergeUniqueTitles = (primary: string[], secondary: string[]): string[] => {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const title of [...primary, ...secondary]) {
    const normalizedKey = toLowerTrimmed(title);

    if (!normalizedKey || seen.has(normalizedKey)) {
      continue;
    }

    seen.add(normalizedKey);
    merged.push(title);

    if (merged.length >= MAX_RESULTS) {
      break;
    }
  }

  return merged;
};

export const searchJobTitles = async (query: string): Promise<string[]> => {
  const trimmedQuery = query.trim();

  if (trimmedQuery.length < 1) {
    return [];
  }

  const fallbackRankedTitles = rankTitles(FALLBACK_TITLES, trimmedQuery);

  try {
    const responseResult = await Promise.allSettled([
      fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(trimmedQuery)}`)
    ]);

    if (responseResult[0]?.status !== 'fulfilled' || !responseResult[0].value.ok) {
      return fallbackRankedTitles.slice(0, MAX_RESULTS);
    }

    const data = (await responseResult[0].value.json()) as RemotiveResponse;
    const uniqueTitles = new Set<string>();

    for (const job of data.jobs ?? []) {
      const title = normalizeTitle(job.title ?? job.job_title ?? '');

      if (scoreMatch(title, trimmedQuery) > 0) {
        uniqueTitles.add(title);
      }

      if (uniqueTitles.size >= MAX_RESULTS) {
        break;
      }
    }

    if (uniqueTitles.size > 0) {
      const providerRankedTitles = rankTitles(Array.from(uniqueTitles), trimmedQuery);
      return mergeUniqueTitles(providerRankedTitles, fallbackRankedTitles);
    }
  } catch (_error) {
    // fallback below
  }

  return fallbackRankedTitles.slice(0, MAX_RESULTS);
};
