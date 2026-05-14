import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthCallback() {
  const [params] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    if (accessToken && refreshToken) {
      login(accessToken, refreshToken);
      navigate('/servers');
    } else {
      navigate('/login?error=auth_failed');
    }
  }, []);

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-discord border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400">Authenticating...</p>
      </div>
    </div>
  );
}
