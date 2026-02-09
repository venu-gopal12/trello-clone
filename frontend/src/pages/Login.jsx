import React, { useState } from 'react';
import { useOrganization } from '../context/OrganizationContext';
import { login } from '../services/authService';
import { setAuth } from '../lib/auth';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { fetchOrganizations } = useOrganization();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    if (loading) return;
    e.preventDefault();

    try {
        setLoading(true);
      const { token, user } = await login(email, password);
      setAuth(token, user);
      await fetchOrganizations(); // Fetch data before navigating
      navigate('/');
    } catch (error) {
      console.error("Login error:", error); // Log actual error
      alert('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-slate-200 p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-900">Welcome back</h2>
          <p className="text-slate-500 mt-2">Sign in to your account to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
             <input
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all placeholder:text-slate-400"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
             <input
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all placeholder:text-slate-400"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition-colors shadow-sm ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            type="submit"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Sign in'}
          </button>

          <div className="relative my-6">
             <div className="absolute inset-0 flex items-center">
                 <div className="w-full border-t border-slate-200"></div>
             </div>
             <div className="relative flex justify-center text-sm">
                 <span className="px-2 bg-white text-slate-500">Or continue with</span>
             </div>
          </div>

          <div className="flex justify-center">
            <GoogleLogin
                onSuccess={async (credentialResponse) => {
                    const { credential } = credentialResponse;
                    const decoded = jwtDecode(credential);
                    try {
                        const { token, user } = await api.post('/users/auth/google', {
                            email: decoded.email,
                            googleId: decoded.sub,
                            name: decoded.name,
                            avatar: decoded.picture
                        }).then(res => res.data);
                        
                        setAuth(token, user);
                        await fetchOrganizations();
                        navigate('/');
                    } catch (error) {
                        console.error(error);
                        alert('Google Login Failed');
                    }
                }}
                onError={() => {
                    alert('Login Failed');
                }}
                theme="outline"
                shape="rectangular"
                width="350"
            />
          </div>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-600 font-semibold hover:text-indigo-700 hover:underline transition-colors">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
