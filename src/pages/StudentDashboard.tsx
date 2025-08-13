
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
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { useStudentAppContext } from '../context/StudentAppContext';
import { env } from '../env';
import COLORS from '../constants/colors';
import SkeletonLoader from '../components/SkeletonLoader';

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
  fee: { _id: string; feeType: string; academicSession: string; dueDate: string };
  amount: number;
  paymentProvider: string;
  status: string;
  receiptUrl?: string;
  createdAt: string;
}

interface FeeAssignment {
  _id: string;
  feeId: { feeType: string; amount: number; dueDate: string; academicSession: string };
  status: string;
  amountDue: number;
  amountPaid: number;
}

interface DashboardData {
  student: StudentData;
  payments: Payment[];
  feeAssignments: FeeAssignment[];
  reports: {
    totalPayments: number;
    pendingPayments: number;
    confirmedPayments: number;
    overdueFees: number;
  };
}

const StudentDashboardSkeleton = () => (
  <div style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.border }} className="p-6 rounded-lg shadow-md border animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
  </div>
);

function StudentDashboard() {
  const { user, isAuthenticated, logout } = useStudentAppContext();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const accessToken = localStorage.getItem('studentToken');
      const response = await axios.get(`${env.VITE_SERVER_URL}/api/v1/students/dashboard`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setDashboardData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
      toast.error(err.response?.data?.message || 'Failed to load dashboard data');
      if (err.response?.status === 401) navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user?._id) {
      navigate('/login');
    } else {
      fetchDashboardData();
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      setIsModalOpen(false);
    } catch (err) {
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

  const paymentStatusData = {
    labels: ['Pending', 'Confirmed'],
    datasets: [
      {
        data: [
          dashboardData?.reports?.pendingPayments || 0,
          dashboardData?.reports?.confirmedPayments || 0,
        ],
        backgroundColor: ['#eab308', '#22c55e'],
        borderColor: ['#ca8a04', '#16a34a'],
        borderWidth: 1,
      },
    ],
  };

  const statusColors: { [key: string]: string } = {
    assigned: '#eab308',
    partially_paid: '#f59e0b',
    fully_paid: '#22c55e',
    overdue: '#ef4444',
  };

  return (
    <div style={{ backgroundColor: COLORS.background }} className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h2 style={{ color: COLORS.primary }} className="text-3xl font-bold mb-8 text-center">
          FPS Student Dashboard - {dashboardData?.student.name || user?.name || 'Student'}
        </h2>

        {dashboardData?.reports?.overdueFees > 0 && (
          <div style={{ backgroundColor: '#fef2f2', borderColor: '#f87171' }} className="mb-6 p-4 rounded-md border flex items-center">
            <ExclamationCircleIcon className="h-6 w-6 text-red-500 mr-2" />
            <p style={{ color: '#dc2626' }}>
              You have {dashboardData?.reports?.overdueFees} overdue fee{dashboardData?.reports?.overdueFees > 1 ? 's' : ''}. Please pay promptly.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 text-center">
            <p style={{ color: '#dc2626' }} className="mb-2">{error}</p>
            <button
              onClick={fetchDashboardData}
              style={{ backgroundColor: COLORS.primary, color: COLORS.white }}
              className="px-4 py-2 rounded-md hover:bg-blue-800"
              aria-label="Retry loading dashboard data"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.border }} className="p-6 rounded-lg shadow-md border">
            <h3 style={{ color: COLORS.primary }} className="text-xl font-semibold mb-4 flex items-center">
              <UserIcon className="h-6 w-6 mr-2" />
              Student Information
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <p style={{ color: COLORS.textPrimary }}><strong>Name:</strong> {dashboardData?.student.name || 'N/A'}</p>
              <p style={{ color: COLORS.textPrimary }}><strong>Email:</strong> {dashboardData?.student.email || 'N/A'}</p>
              <p style={{ color: COLORS.textPrimary }}><strong>Student ID:</strong> {dashboardData?.student.studentId || 'N/A'}</p>
              <p style={{ color: COLORS.textPrimary }}><strong>Department:</strong> {dashboardData?.student.department || 'N/A'}</p>
              <p style={{ color: COLORS.textPrimary }}><strong>Year of Study:</strong> {dashboardData?.student.yearOfStudy || 'N/A'}</p>
              <p style={{ color: COLORS.textPrimary }}><strong>Courses:</strong> {dashboardData?.student.courses.join(', ') || 'None'}</p>
            </div>
          </div>

          <div style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.border }} className="p-6 rounded-lg shadow-md border sm:col-span-2">
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
                    className="p-4 rounded-md shadow-sm hover:shadow-lg transition-transform"
                  >
                    <p style={{ color: COLORS.textPrimary }} className="font-semibold">{payment?.fee?.feeType}</p>
                    <p style={{ color: COLORS.textPrimary }}>${payment.amount}</p>
                    <p style={{ color: COLORS.textSecondary }} className="text-sm">{payment.paymentProvider}</p>
                    <p
                      className={`text-sm ${
                        payment.status === 'confirmed' ? 'text-green-500' : 'text-yellow-500'
                      }`}
                    >
                      {payment.status}
                    </p>
                    <div className="flex space-x-2 mt-2">
                      {payment.receiptUrl && (
                        <a
                          href={payment.receiptUrl}
                          target="_blank"
                          style={{ backgroundColor: COLORS.primary, color: COLORS.white }}
                          className="px-3 py-1 rounded-md hover:bg-blue-800"
                          aria-label={`View receipt for ${payment.fee.feeType}`}
                        >
                          View Receipt
                        </a>
                      )}
                      <button
                        onClick={() => toast.info('Refund feature coming soon')}
                        style={{
                          backgroundColor: payment.status === 'confirmed' ? COLORS.primary : '#9ca3af',
                          color: COLORS.white,
                        }}
                        className={`px-3 py-1 rounded-md ${payment.status === 'confirmed' ? 'hover:bg-blue-800' : 'cursor-not-allowed'}`}
                        disabled={payment.status !== 'confirmed'}
                        aria-label={`Initiate refund for ${payment?.fee?.feeType}`}
                      >
                        Request Refund
                      </button>
                    </div>
                    <p style={{ color: COLORS.textSecondary }} className="text-sm mt-2">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
                <button
                  onClick={() => navigate('/payments')}
                  style={{ backgroundColor: COLORS.primary, color: COLORS.white }}
                  className="mt-4 px-4 py-2 rounded-md hover:bg-blue-800"
                  aria-label="View full list of payments"
                >
                  View Full List
                </button>
              </div>
            ) : (
              <p style={{ color: COLORS.textSecondary }} className="text-sm">No payments found.</p>
            )}
          </div>

          <div style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.border }} className="p-6 rounded-lg shadow-md border sm:col-span-2">
            <h3 style={{ color: COLORS.primary }} className="text-xl font-semibold mb-4 flex items-center">
              <DocumentTextIcon className="h-6 w-6 mr-2" />
              Fee Assignments
            </h3>
            {dashboardData?.feeAssignments?.length ? (
              <div className="grid grid-cols-1 gap-4">
                {dashboardData.feeAssignments.slice(0, 4).map((assignment) => (
                  <div
                    key={assignment._id}
                    style={{ backgroundColor: COLORS.white }}
                    className="p-4 rounded-md shadow-sm hover:shadow-lg transition-transform"
                  >
                    <p style={{ color: COLORS.textPrimary }} className="font-semibold">{assignment.feeId.feeType}</p>
                    <p style={{ color: COLORS.textPrimary }}>${assignment.amountDue}</p>
                    <p style={{ color: COLORS.textPrimary }}>${assignment.amountPaid} Paid</p>
                    <p style={{ color: COLORS.textSecondary }} className="text-sm">
                      {new Date(assignment.feeId.dueDate).toLocaleDateString()}
                    </p>
                    <p style={{ color: COLORS.textSecondary }} className="text-sm">{assignment.feeId.academicSession}</p>
                    <p
                      style={{ backgroundColor: statusColors[assignment.status], color: COLORS.white }}
                      className="text-sm px-2 py-1 rounded-full inline-block mt-2"
                    >
                      {assignment.status}
                    </p>
                    <div className="flex space-x-2 mt-2">
                      <button
                        onClick={() => navigate(`/fee-assignments/${assignment._id}`)}
                        style={{ backgroundColor: COLORS.primary, color: COLORS.white }}
                        className="px-3 py-1 rounded-md hover:bg-blue-800"
                        aria-label={`View details for ${assignment.feeId.feeType}`}
                      >
                        View Details
                      </button>
                      {(assignment.status === 'assigned' || assignment.status === 'partially_paid') && (
                        <button
                          onClick={() => navigate('/payments')}
                          style={{ backgroundColor: COLORS.primary, color: COLORS.white }}
                          className="px-3 py-1 rounded-md hover:bg-blue-800"
                          aria-label={`Pay for ${assignment.feeId.feeType}`}
                        >
                          Pay Now
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => navigate('/fee-assignments')}
                  style={{ backgroundColor: COLORS.primary, color: COLORS.white }}
                  className="mt-4 px-4 py-2 rounded-md hover:bg-blue-800"
                  aria-label="View full list of fee assignments"
                >
                  View Full List
                </button>
              </div>
            ) : (
              <p style={{ color: COLORS.textSecondary }} className="text-sm">No fee assignments found.</p>
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
              <h3 style={{ color: COLORS.textPrimary }} className="text-xl font-semibold mb-4">Confirm Logout</h3>
              <p style={{ color: COLORS.textSecondary }} className="mb-6">Are you sure you want to log out?</p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={handleModalCancel}
                  style={{ backgroundColor: '#d1d5db', color: COLORS.black }}
                  className="px-4 py-2 rounded-md hover:bg-gray-400"
                  aria-label="Cancel logout"
                >
                  Cancel
                </button>
                <button
                  onClick={handleModalConfirm}
                  style={{ backgroundColor: COLORS.primary, color: COLORS.white }}
                  className="px-4 py-2 rounded-md hover:bg-blue-800"
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