import { api } from './api';

type SearchUniversityNamesResponse = {
  names: string[];
};

export const universityService = {
  async searchNames(query: string): Promise<string[]> {
    const response = await api.get<SearchUniversityNamesResponse>('/universities/names', {
      params: { query }
    });

    return response.data.names;
  }
};
