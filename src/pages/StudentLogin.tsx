//@ts-nocheck
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import validator from 'validator';
import { toast } from 'react-toastify';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import SkeletonLoader from '../components/SkeletonLoader';
import { useStudentAppContext } from '../context/StudentAppContext';
import { env } from '../env';
import COLORS from '../constants/colors';

interface FormData {
  email: string;
  password: string;
}

interface Errors {
  email?: string;
  password?: string;
}

function StudentLogin() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [retryTimer, setRetryTimer] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { setUser, setIsAuthenticated } = useStudentAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (retryTimer !== null && retryTimer > 0) {
      const timer = setInterval(() => {
        setRetryTimer((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
      return () => clearInterval(timer);
    } else if (retryTimer === 0) {
      setRetryTimer(null);
    }
  }, [retryTimer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = (): Errors => {
    const newErrors: Errors = {};
    if (!validator.isEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!validator.isLength(formData.email, { max: 255 })) {
      newErrors.email = 'Email must not exceed 255 characters';
    }
    if (!validator.isLength(formData.password, { min: 8, max: 128 })) {
      newErrors.password = 'Password must be between 8 and 128 characters';
    }
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fix the errors before submitting', {
        autoClose: 3000,
      });
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Logging in...');
    try {
      const response = await axios.post(`${env.VITE_SERVER_URL}/api/v1/students/login`, {
        email: formData.email,
        password: formData.password,
      });

      const { success, token, refreshToken, data, message } = response.data;
      if (!success || !token || !refreshToken || !data) {
        throw new Error(message || 'Invalid login response');
      }

      localStorage.setItem('studentToken', token);
      localStorage.setItem('studentRefreshToken', refreshToken);
      localStorage.setItem('studentUser', JSON.stringify(data));
      setUser(data);
      setIsAuthenticated(true);
      toast.update(toastId, {
        render: 'Logged in successfully',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
      navigate('/dashboard');
    } catch (err) {
      console.log({
        event: 'student_login_error',
        error: err.message,
        response: err.response?.data,
        status: err.response?.status,
        timestamp: new Date().toISOString(),
      });
      let message = 'Login failed';
      let retryAfter = null;
      if (err.response?.status === 401) {
        message = err.response?.data?.message || 'Invalid credentials';
      } else if (err.response?.status === 429) {
        message = err.response?.data?.message || 'Too many login attempts';
        retryAfter = err.response?.data?.retryAfter || 60;
        setRetryTimer(retryAfter);
        navigate('/login-failed');
      } else {
        message = err.response?.data?.message || 'An error occurred during login';
      }
      setErrors({ email: message });
      toast.update(toastId, {
        render: message,
        type: 'error',
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: COLORS.background }}>
      {/* Gradient Overlay for Busy Look */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-transparent to-blue-200/50 z-0" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 transform transition-all duration-500 ease-in-out hover:scale-[1.02] z-10">
        {/* Logo Placeholder */}
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 rounded-full bg-gradient-to-r from-[#1976D2] to-blue-800 flex items-center justify-center text-white font-bold text-2xl">
            FPS
          </div>
        </div>
        <h2
          style={{ color: COLORS.primary }}
          className="text-4xl font-extrabold mb-4 text-center animate-fade-in"
        >
          Student Login
        </h2>
        <p
          style={{ color: COLORS.textSecondary }}
          className="text-center mb-8 text-sm font-medium"
        >
          Access your Fee Payment System account
        </p>
        {isLoading ? (
          <SkeletonLoader />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                style={{ color: COLORS.textPrimary }}
                className="block text-sm font-semibold mb-2"
                htmlFor="email"
              >
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  style={{
                    borderColor: COLORS.border,
                    backgroundColor: COLORS.inputBackground,
                  }}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1976D2] transition-all duration-300 placeholder:text-[#767676]"
                  placeholder="Enter your email"
                  disabled={retryTimer !== null}
                  maxLength={255}
                  aria-label="Email"
                />
              </div>
              {errors.email && (
                <p style={{ color: '#dc2626' }} className="mt-2 text-sm animate-pulse">
                  {errors.email}
                </p>
              )}
            </div>
            <div>
              <label
                style={{ color: COLORS.textPrimary }}
                className="block text-sm font-semibold mb-2"
                htmlFor="password"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  id="password"
                  value={formData.password}
                  onChange={handleChange}
                  style={{
                    borderColor: COLORS.border,
                    backgroundColor: COLORS.inputBackground,
                  }}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1976D2] transition-all duration-300 placeholder:text-[#767676]"
                  placeholder="Enter your password"
                  disabled={retryTimer !== null}
                  maxLength={128}
                  aria-label="Password"
                />
                <button
                  type="button"
                  onClick={toggleShowPassword}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-[#1976D2] focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-checked={showPassword}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p style={{ color: '#dc2626' }} className="mt-2 text-sm animate-pulse">
                  {errors.password}
                </p>
              )}
            </div>
            <div>
              <button
                type="submit"
                style={{ backgroundColor: COLORS.primary, color: COLORS.white }}
                className="w-full py-3 rounded-lg hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-[#1976D2] disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                disabled={isLoading || retryTimer !== null}
                aria-label={retryTimer !== null ? `Retry in ${retryTimer}s` : 'Login'}
              >
                {retryTimer !== null ? `Retry in ${retryTimer}s` : 'Login'}
              </button>
            </div>
            <div
              style={{ color: COLORS.textSecondary }}
              className="text-sm text-center space-y-2"
            >
              <p>Contact your school admin to create an account.</p>
              <p className="text-xs italic">
                Powered by Fee Payment System &copy; {new Date().getFullYear()}
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default StudentLogin;