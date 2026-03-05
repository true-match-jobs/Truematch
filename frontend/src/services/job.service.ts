import { api } from './api';

type SearchJobTitlesResponse = {
  titles: string[];
};

export const jobService = {
  async searchTitles(query: string): Promise<string[]> {
    const response = await api.get<SearchJobTitlesResponse>('/jobs/titles', {
      params: { query }
    });

    return response.data.titles;
  }
};
