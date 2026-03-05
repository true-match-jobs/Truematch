import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppRoutes } from './routes';
import { SeoHead } from './seo/SeoHead';
import { useAuthStore } from './store/auth.store';

const App = () => {
  const navigate = useNavigate();

  useEffect(() => {
    void useAuthStore.getState().bootstrapSession();
  }, []);

  useEffect(() => {
    const handleSessionExpired = () => {
      const { isAuthenticated } = useAuthStore.getState();
      useAuthStore.getState().clearSession();
      if (isAuthenticated) {
        navigate('/login', { replace: true });
      }
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);

    return () => {
      window.removeEventListener('auth:session-expired', handleSessionExpired);
    };
  }, [navigate]);

  return (
    <>
      <SeoHead />
      <AppRoutes />
    </>
  );
};

export default App;
