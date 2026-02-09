import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../lib/auth';
import { useOrganization } from '../context/OrganizationContext';
import { Loader } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { loading } = useOrganization();

  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }

  // If authenticated but data is still loading, show spinner
  if (loading) {
    return (
        <div className="h-screen w-full flex items-center justify-center bg-slate-50">
            <Loader className="h-8 w-8 animate-spin text-blue-600" />
        </div>
    );
  }

  return children;
}
