import { useAuthStore, type AuthState } from '../store/auth.store';

type UseAuthResult = Pick<
  AuthState,
  'user' | 'isAuthenticated' | 'isBootstrapping' | 'setSessionUser' | 'login' | 'register' | 'logout'
>;

export const useAuth = (): UseAuthResult => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping);
  const setSessionUser = useAuthStore((state) => state.setSessionUser);
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const logout = useAuthStore((state) => state.logout);

  return { user, isAuthenticated, isBootstrapping, setSessionUser, login, register, logout };
};
