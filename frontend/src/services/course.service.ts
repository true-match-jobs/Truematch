import { api } from './api';

type SearchCourseTypesResponse = {
  types: string[];
};

export const courseService = {
  async searchTypes(query: string): Promise<string[]> {
    const response = await api.get<SearchCourseTypesResponse>('/courses/types', {
      params: { query }
    });

    return response.data.types;
  }
};
