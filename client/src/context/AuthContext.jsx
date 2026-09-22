import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUser(); }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setUser(data);
    return data;
  };

  const signup = async (formData) => {
    // returns { message, email } — account isn't logged in until OTP is verified
    const { data } = await api.post('/auth/signup', formData);
    return data;
  };

  const verifyOtp = async (email, otp) => {
    const { data } = await api.post('/auth/verify-otp', { email, otp });
    setUser(data);
    return data;
  };

  const resendOtp = async (email) => {
    return api.post('/auth/resend-otp', { email });
  };

  const googleLogin = async (credential) => {
    const { data } = await api.post('/auth/google', { credential });
    setUser(data);
    return data;
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
  };

  const refreshUser = fetchUser;

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, verifyOtp, resendOtp, googleLogin, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};