// @ts-nocheck
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';
import { env } from '../env';

interface User {
  _id: string;
  name: string;
  email: string;
  studentId: string;
  department: string;
  yearOfStudy: string;
  courses: string[];
}

interface AppContextType {
  user: User | null;
  isAuthenticated: boolean;
  error: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  paymentInitiated: boolean; // CHANGE: Added to track payment initiation
  setPaymentInitiated: (value: boolean) => void; // CHANGE: Setter for paymentInitiated
}

const StudentAppContext = createContext<AppContextType | undefined>(undefined);

export const StudentAppProvider = ({ children }: { children: ReactNode }) => {
  const BASE_URL = `${env.VITE_SERVER_URL}/api/v1`;
  const CURRENCY = 'GH₵';

  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('studentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); 
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const sanitizeInput = (input: string): string => {
    return input ? input.replace(/[<>"'%;()&]/g, '') : '';
  };

  const checkAuth = async () => {
    setError(null);
    setLoading(true);
    try {
      const accessToken = localStorage.getItem('studentToken');
      const refreshToken = localStorage.getItem('studentRefreshToken');
      if (!accessToken || !refreshToken) {
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('studentUser');
        localStorage.removeItem('studentToken');
        localStorage.removeItem('studentRefreshToken');
        navigate('/login', { state: { from: location.pathname }, replace: true });
        return;
      }
      const response = await axios.get(`${BASE_URL}/students/check-auth`, {
        headers: { Authorization: `Bearer ${sanitizeInput(accessToken)}` },
      });
      const { user, accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;
      if (!user._id || !user.email) {
        throw new Error('Invalid auth response');
      }
      setUser({
        _id: user._id,
        email: user.email,
        name: user.name,
        studentId: user.studentId,
        department: user.department,
        yearOfStudy: user.yearOfStudy,
        courses: user.courses || [],
      });
      localStorage.setItem('studentToken', sanitizeInput(newAccessToken));
      localStorage.setItem('studentRefreshToken', sanitizeInput(newRefreshToken));
      localStorage.setItem('studentUser', JSON.stringify(user));
      setIsAuthenticated(true);
      const redirectTo = location.state?.from || '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      console.log({
        event: 'student_check_auth_error',
        error: err.message,
        response: err.response?.data,
        timestamp: new Date().toISOString(),
      });
      setError(err.response?.data?.message || 'Authorization failed');
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('studentUser');
      localStorage.removeItem('studentToken');
      localStorage.removeItem('studentRefreshToken');
      navigate('/login', { state: { from: location.pathname }, replace: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    const toastId = toast.loading('Logging in...');
    try {
      const response = await axios.post(`${BASE_URL}/students/login`, { email, password });
      const { success, token, refreshToken, data } = response.data;
      if (!success || !token || !refreshToken || !data) {
        throw new Error(response.data.message || 'Invalid login response');
      }
      localStorage.setItem('studentToken', sanitizeInput(token));
      localStorage.setItem('studentRefreshToken', sanitizeInput(refreshToken));
      localStorage.setItem('studentUser', JSON.stringify(data));
      setUser(data);
      setIsAuthenticated(true);
      toast.update(toastId, {
        render: 'Login successful',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
      const redirectTo = location.state?.from || '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      console.log({
        event: 'student_login_error',
        error: err.message,
        response: err.response?.data,
        status: err.response?.status,
        timestamp: new Date().toISOString(),
      });
      let message = 'Login failed';
      if (err.response?.status === 401) {
        message = err.response?.data?.message || 'Invalid credentials';
      } else if (err.response?.status === 429) {
        message = err.response?.data?.message || 'Too many login attempts';
        navigate('/login-failed');
      } else {
        message = err.response?.data?.message || 'An error occurred during login';
      }
      setError(message);
      toast.update(toastId, {
        render: message,
        type: 'error',
        isLoading: false,
        autoClose: 3000,
      });
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setError(null);
    setLoading(true);
    const toastId = toast.loading('Logging out...');
    try {
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('studentUser');
      localStorage.removeItem('studentToken');
      localStorage.removeItem('studentRefreshToken');
      toast.update(toastId, {
        render: 'Logged out successfully',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
      navigate('/login', { replace: true });
    } catch (err) {
      console.log({
        event: 'student_logout_error',
        error: err.message,
        timestamp: new Date().toISOString(),
      });
      const message = 'Logout failed';
      setError(message);
      toast.update(toastId, {
        render: message,
        type: 'error',
        isLoading: false,
        autoClose: 3000,
      });
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const value: AppContextType = {
    user,
    setUser,
    isAuthenticated,
    setIsAuthenticated,
    error,
    loading,
    login,
    logout,
    checkAuth,
    CURRENCY,
    paymentInitiated,
    setPaymentInitiated
  };

  return <StudentAppContext.Provider value={value}>{children}</StudentAppContext.Provider>;
};

export const useStudentAppContext = () => {
  const context = useContext(StudentAppContext);
  if (!context) {
    throw new Error('useStudentAppContext must be used within a StudentAppProvider');
  }
  return context;
};