import { AppError } from '../../utils/app-error';

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
  'Product Manager'
];

const normalizeTitle = (value: string): string => value.trim();

export const searchJobTitles = async (query: string): Promise<string[]> => {
  const trimmedQuery = query.trim();

  if (trimmedQuery.length < 2) {
    return [];
  }

  try {
    const response = await fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(trimmedQuery)}`);

    if (!response.ok) {
      throw new AppError(502, 'Unable to fetch job titles from provider');
    }

    const data = (await response.json()) as RemotiveResponse;
    const uniqueTitles = new Set<string>();

    for (const job of data.jobs ?? []) {
      const title = normalizeTitle(job.title ?? job.job_title ?? '');
      if (title.length > 0 && title.toLowerCase().includes(trimmedQuery.toLowerCase())) {
        uniqueTitles.add(title);
      }

      if (uniqueTitles.size >= 10) {
        break;
      }
    }

    if (uniqueTitles.size > 0) {
      return Array.from(uniqueTitles);
    }
  } catch (_error) {
    // fallback below
  }

  return FALLBACK_TITLES.filter((title) => title.toLowerCase().includes(trimmedQuery.toLowerCase())).slice(0, 10);
};
