import { api } from './api';

type SearchUniversityNamesResponse = {
  names: string[];
};

export const universityService = {
  async searchNames(query: string, country?: string): Promise<string[]> {
    const response = await api.get<SearchUniversityNamesResponse>('/universities/names', {
      params: country ? { query, country } : { query }
    });

    return response.data.names;
  }
};
