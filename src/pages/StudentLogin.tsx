//// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import validator from 'validator';
import { toast } from 'react-toastify';
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 style={{ color: COLORS.primary }} className="text-3xl font-bold mb-6 text-center">
          Student Login
        </h2>
        {isLoading ? (
          <SkeletonLoader />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label style={{ color: COLORS.textPrimary }} className="block text-sm font-medium mb-2" htmlFor="email">
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                style={{ borderColor: COLORS.border }}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#1976D2]"
                placeholder="Enter email"
                disabled={retryTimer !== null}
                maxLength={255}
                aria-label="Email"
              />
              {errors.email && (
                <p style={{ color: '#dc2626' }} className="mt-1 text-sm">{errors.email}</p>
              )}
            </div>
            <div>
              <label style={{ color: COLORS.textPrimary }} className="block text-sm font-medium mb-2" htmlFor="password">
                Password
              </label>
              <input
                type="password"
                name="password"
                id="password"
                value={formData.password}
                onChange={handleChange}
                style={{ borderColor: COLORS.border }}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#1976D2]"
                placeholder="Enter password"
                disabled={retryTimer !== null}
                maxLength={128}
                aria-label="Password"
              />
              {errors.password && (
                <p style={{ color: '#dc2626' }} className="mt-1 text-sm">{errors.password}</p>
              )}
            </div>
            <div>
              <button
                type="submit"
                style={{ backgroundColor: COLORS.primary, color: COLORS.white }}
                className="w-full py-2 rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-[#1976D2] disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={isLoading || retryTimer !== null}
                aria-label="Login"
              >
                {retryTimer !== null ? `Retry in ${retryTimer}s` : 'Login'}
              </button>
            </div>
            <div style={{ color: COLORS.textSecondary }} className="text-sm text-center space-y-2">
              <p>Contact your school admin to create an account.</p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default StudentLogin;