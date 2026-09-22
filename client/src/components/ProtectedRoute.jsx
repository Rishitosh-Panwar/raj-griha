import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="text-center py-24 text-gray-400">Loading...</div>;

  if (!user) return <Navigate to="/login" replace />;

  if (requireAdmin && user.role !== 'admin') return <Navigate to="/" replace />;

  return children;
};

export default ProtectedRoute;