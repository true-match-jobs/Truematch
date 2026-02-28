import { useCallback, useEffect } from 'react';
import { useDashboardStore } from '../store/dashboard.store';

export const useDashboardData = () => {
  const profile = useDashboardStore((state) => state.profile);
  const isLoading = useDashboardStore((state) => state.isLoading);
  const errorMessage = useDashboardStore((state) => state.errorMessage);
  const loadDashboardData = useDashboardStore((state) => state.loadDashboardData);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  const refreshDashboardData = useCallback(async () => {
    await loadDashboardData(true, false);
  }, [loadDashboardData]);

  return {
    profile,
    isLoading,
    errorMessage,
    refreshDashboardData
  };
};
