import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import {
  UserIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import { useStudentAppContext } from '../context/StudentAppContext';
import { env } from '../env';
import SkeletonLoader from '../components/SkeletonLoader';
import COLORS from '../constants/colors';
import { ChartPieIcon } from 'lucide-react';
import { io } from 'socket.io-client'; // CHANGE: Added socket.io-client

ChartJS.register(ArcElement, Tooltip, Legend);

interface StudentData {
  _id: string;
  name: string;
  email: string;
  studentId: string;
  department: string;
  yearOfStudy: string;
  courses: string[];
}

interface Payment {
  _id: string;
  amount: number;
  feeId: string;
  feeDetails: {
    feeType: string;
    academicSession: string;
    dueDate: string;
  };
  paymentProvider: string;
  status: string;
  receiptUrl?: string;
  createdAt: string;
}

interface Receipt {
  _id: string;
  receiptNumber: string;
  amount: number;
  date: string;
  pdfUrl: string;
  branding: { logoUrl?: string; primaryColor?: string };
}

interface DashboardData {
  student: StudentData;
  payments: Payment[];
  receipts: Receipt[];
  message?: string;
}

const isValidHexColor = (color: string) => /^#[0-9A-F]{6}$/i.test(color);

function StudentDashboard() {
  const { user, isAuthenticated, logout, CURRENCY } = useStudentAppContext();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // CHANGE: Added unreadCount state
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const accessToken = localStorage.getItem('studentToken');
      // CHANGE: Fetch dashboard data and unread notification count
      const [dashboardResponse, notificationsResponse] = await Promise.all([
        axios.get(`${env.VITE_SERVER_URL}/api/v1/students/dashboard`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        axios.get(`${env.VITE_SERVER_URL}/api/v1/students/notifications`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { limit: 0 }, // Only need unread count
        }),
      ]);
      setDashboardData(dashboardResponse.data.data);
      setUnreadCount(notificationsResponse.data.unreadCount);
    } catch (err) {
      console.log({
        event: 'student_dashboard_fetch_error',
        error: err.response?.data?.message || err.message,
        timestamp: new Date().toISOString(),
      });
      setError(err.response?.data?.message || 'Failed to load dashboard data');
      if (err.response?.status === 401) navigate('/login');
      else if (err.response?.status === 429) {
        toast.error(err.response?.data?.message || 'Rate exceeded. Please try again after some time');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // CHANGE: Added WebSocket setup for real-time notifications
  useEffect(() => {
    if (!isAuthenticated || !user?._id) {
      navigate('/login');
      return;
    }

    fetchDashboardData();

    const socket = io(env.VITE_SERVER_URL, {
      auth: { token: `Bearer ${localStorage.getItem('studentToken')}` },
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    socket.on('new_notification', () => {
      // Fetch updated unread count
      axios
        .get(`${env.VITE_SERVER_URL}/api/v1/students/notifications`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('studentToken')}` },
          params: { limit: 0 },
        })
        .then((response) => {
          setUnreadCount(response.data.unreadCount);
          toast.info('New notification received!');
        });
    });

    socket.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err);
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, user, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      setIsModalOpen(false);
    } catch (error) {
      console.log({
        event: 'student_logout_error',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      toast.error('Logout failed');
    }
  };

  const handleModalConfirm = () => {
    setIsModalOpen(false);
    handleLogout();
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
  };

  // CHANGE: Removed handleActionClick, made BellIcon navigate to notifications
  const paymentStatusData = {
    labels: ['Pending', 'Confirmed', 'Rejected', `Total Amount ${CURRENCY}`],
    datasets: [
      {
        data: [
          dashboardData?.payments.filter((p) => p.status === 'pending').length || 0,
          dashboardData?.payments.filter((p) => p.status === 'confirmed').length || 0,
          dashboardData?.payments.filter((p) => p.status === 'rejected').length || 0,
          dashboardData?.payments.reduce((sum, p) => sum + p.amount, 0) || 0,
        ],
        backgroundColor: ['#eab308', '#22c55e', '#ef4444', '#3b82f6'],
        borderColor: ['#ca8a04', '#16a34a', '#dc2626', '#2563eb'],
        borderWidth: 1,
      },
    ],
  };

  const primaryColor = isValidHexColor(dashboardData?.receipts[0]?.branding.primaryColor || '')
    ? dashboardData?.receipts[0]?.branding.primaryColor
    : COLORS.primary;

  if (isLoading && !dashboardData) {
    return (
      <div style={{ backgroundColor: COLORS.background }} className="min-h-screen flex items-center justify-center py-12">
        <div style={{ backgroundColor: COLORS.white }} className="p-8 rounded-lg shadow-xl w-full max-w-4xl">
          <h2 style={{ color: COLORS.primary }} className="text-3xl font-bold mb-6 text-center">
            Loading...
          </h2>
          <SkeletonLoader />
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: COLORS.background }} className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto relative">
        {/* CHANGE: Made BellIcon navigate to notifications with unread count */}
        <button
          onClick={() => navigate('/notifications')}
          className="absolute top-0 right-0 p-2 rounded-full hover:bg-gray-200 relative"
          style={{ color: COLORS.primary }}
          aria-label="View notifications"
        >
          <BellIcon className="h-6 w-6" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full px-2 py-1 text-xs"
              style={{ backgroundColor: '#ef4444' }}
            >
              {unreadCount}
            </span>
          )}
        </button>
        <h2 style={{ color: COLORS.primary }} className="text-3xl font-bold mb-8 text-center">
          FPS Student Dashboard - {dashboardData?.student.name || user?.name || 'Student'}
        </h2>

        {error && (
          <div className="mb-6 text-center">
            <p style={{ color: '#dc2626' }} className="mb-2">
              {error}
            </p>
            <button
              onClick={fetchDashboardData}
              style={{ backgroundColor: COLORS.primary, color: COLORS.white }}
              className="px-4 py-2 rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-[${primaryColor}]"
              aria-label="Retry loading dashboard data"
            >
              Retry
            </button>
          </div>
        )}

        {dashboardData?.message && (
          <p style={{ color: COLORS.textSecondary }} className="text-center mb-6">
            {dashboardData.message}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.border }} className="p-6 rounded-lg shadow-md border">
            <h3 style={{ color: COLORS.primary }} className="text-xl font-semibold mb-4 flex items-center">
              <UserIcon className="h-6 w-6 mr-2" />
              Student Information
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <p>
                <strong>Name:</strong> {dashboardData?.student.name || 'N/A'}
              </p>
              <p>
                <strong>Email:</strong> {dashboardData?.student.email || 'N/A'}
              </p>
              <p>
                <strong>Student ID:</strong> {dashboardData?.student.studentId || 'N/A'}
              </p>
              <p>
                <strong>Department:</strong> {dashboardData?.student.department || 'N/A'}
              </p>
              <p>
                <strong>Year of Study:</strong> {dashboardData?.student.yearOfStudy || 'N/A'}
              </p>
              <p className="relative">
                <strong>Courses:</strong>{' '}
                <span className="truncate">{dashboardData?.student.courses.join(', ') || 'None'}</span>
                <span
                  style={{ backgroundColor: COLORS.white }}
                  className="absolute left-0 top-6 hidden group-hover:block shadow-md p-2 rounded-md z-50 max-w-full"
                >
                  {dashboardData?.student.courses.join(', ') || 'None'}
                </span>
              </p>
            </div>
          </div>

          <div
            style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.border }}
            className="p-6 rounded-lg shadow-md border sm:col-span-2 lg:col-span-2"
          >
            <h3 style={{ color: COLORS.primary }} className="text-xl font-semibold mb-4 flex items-center">
              <ChartPieIcon className="h-6 w-6 mr-2" />
              Payment Overview
            </h3>
            <div className="mt-6 h-64">
              <Pie
                data={paymentStatusData}
                options={{
                  responsive: true,
                  plugins: { legend: { position: 'top' }, tooltip: { enabled: true } },
                }}
              />
            </div>
          </div>

          <div style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.border }} className="p-6 rounded-lg shadow-md border">
            <h3 style={{ color: COLORS.primary }} className="text-xl font-semibold mb-4 flex items-center">
              <CurrencyDollarIcon className="h-6 w-6 mr-2" />
              Payments
            </h3>
            {dashboardData?.payments.length ? (
              <div className="grid grid-cols-1 gap-4">
                {dashboardData.payments.slice(0, 4).map((payment) => (
                  <div
                    key={payment._id}
                    style={{ backgroundColor: COLORS.white }}
                    className="p-4 rounded-md shadow-sm hover:shadow-lg transition-transform group"
                  >
                    <p style={{ color: COLORS.textPrimary }} className="font-semibold">{payment?.feeDetails.feeType}</p>
                    <p style={{ color: COLORS.textPrimary }}>{CURRENCY}{payment.amount}</p>
                    <p style={{ color: COLORS.textSecondary }} className="text-sm">
                      {payment.feeDetails.academicSession}
                    </p>
                    <p style={{ color: COLORS.textSecondary }} className="text-sm">
                      Due: {new Date(payment.feeDetails.dueDate).toLocaleDateString()}
                    </p>
                    <p style={{ color: COLORS.textSecondary }} className="text-sm">
                      {payment.paymentProvider}
                    </p>
                    <p
                      className={`text-sm ${
                        payment.status === 'confirmed'
                          ? 'text-green-500'
                          : payment.status === 'pending'
                          ? 'text-yellow-500'
                          : 'text-green-500'
                      }`}
                    >
                      {payment.status === "initiated" ? "confirmed":payment.status }
                    </p>
                    <div className="flex space-x-2 mt-2">
                      {payment.receiptUrl && (
                        <a
                          href={payment.receiptUrl}
                          target="_blank"
                          style={{ backgroundColor: COLORS.primary, color: COLORS.white }}
                          className="px-3 py-1 rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-[${primaryColor}]"
                          aria-label={`View receipt for payment ${payment.feeDetails.feeType}`}
                        >
                          View Receipt
                        </a>
                      )}
                    </div>
                    <p style={{ color: COLORS.textSecondary }} className="text-sm mt-2">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
                <button
                  onClick={() => navigate('/payments')}
                  style={{ backgroundColor: COLORS.primary, color: COLORS.white }}
                  className="mt-4 px-4 py-2 rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-[${primaryColor}]"
                  aria-label="View full list of payments"
                >
                  View Full List
                </button>
              </div>
            ) : (
              <p style={{ color: COLORS.textSecondary }} className="text-sm">
                No payments found.
              </p>
            )}
          </div>

          <div style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.border }} className="p-6 rounded-lg shadow-md border">
            <h3 style={{ color: COLORS.primary }} className="text-xl font-semibold mb-4 flex items-center">
              <DocumentTextIcon className="h-6 w-6 mr-2" />
              Recent Receipts
            </h3>
            {dashboardData?.receipts.length ? (
              <div className="grid grid-cols-1 gap-4">
                {dashboardData.receipts.slice(0, 4).map((receipt) => (
                  <div
                    key={receipt._id}
                    style={{ backgroundColor: COLORS.white }}
                    className="p-4 rounded-md shadow-sm hover:shadow-lg transition-transform"
                  >
                    <p style={{ color: COLORS.textPrimary }} className="font-semibold">
                      {receipt.receiptNumber}
                    </p>
                    <p style={{ color: COLORS.textPrimary }}>{CURRENCY}{receipt.amount}</p>
                    <p style={{ color: COLORS.textSecondary }} className="text-sm">
                      {new Date(receipt.date).toLocaleDateString()}
                    </p>
                    {/* <a
                      href={receipt.pdfUrl}
                      target="_blank"
                      style={{ backgroundColor: COLORS.primary, color: COLORS.white }}
                      className="mt-2 px-3 py-1 rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-[${primaryColor}]"
                      aria-label={`View receipt ${receipt.receiptNumber}`}
                    >
                      View PDF
                    </a> */}
                  </div>
                ))}
                <button
                  onClick={() => navigate('/receipts')}
                  style={{ backgroundColor: COLORS.primary, color: COLORS.white }}
                  className="mt-4 px-4 py-2 rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-[${primaryColor}]"
                  aria-label="View full list of receipts"
                >
                  View Full List
                </button>
              </div>
            ) : (
              <p style={{ color: COLORS.textSecondary }} className="text-sm">
                No receipts found.
              </p>
            )}
          </div>
        </div>

        {isModalOpen && (
          <div
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            className="fixed inset-0 flex items-center justify-center z-50"
            onClick={handleModalCancel}
          >
            <div
              style={{ backgroundColor: COLORS.white }}
              className="p-6 rounded-lg shadow-xl w-full max-w-md transform transition-transform duration-300 translate-y-0"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ color: COLORS.textPrimary }} className="text-xl font-semibold mb-4">
                Confirm Logout
              </h3>
              <p style={{ color: COLORS.textSecondary }} className="mb-6">
                Are you sure you want to log out?
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={handleModalCancel}
                  style={{ backgroundColor: '#d1d5db', color: COLORS.black }}
                  className="px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  aria-label="Cancel logout"
                >
                  Cancel
                </button>
                <button
                  onClick={handleModalConfirm}
                  style={{ backgroundColor: COLORS.primary, color: COLORS.white }}
                  className="px-4 py-2 rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-[${primaryColor}]"
                  aria-label="Confirm logout"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentDashboard;