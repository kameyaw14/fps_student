import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { DocumentTextIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { useStudentAppContext } from '../context/StudentAppContext';
import { env } from '../env';
import COLORS from '../constants/colors';

interface FeeAssignment {
  _id: string;
  feeId: { feeType: string; amount: number; dueDate: string; academicSession: string };
  status: string;
  amountDue: number;
  amountPaid: number;
}

const FeeAssignmentSkeleton = () => (
  <div style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.border }} className="p-6 rounded-lg shadow-md border animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
  </div>
);

const getDaysRemaining = (dueDate: string): string => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} more`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else {
      return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`;
    }
  } catch (error) {
    return 'Invalid date';
  }
};

function StudentFeeAssignments() {
  const { user, isAuthenticated,CURRENCY } = useStudentAppContext();
  const navigate = useNavigate();
  const [feeAssignments, setFeeAssignments] = useState<FeeAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    feeType: '',
    status: '',
  });

  const fetchFeeAssignments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const accessToken = localStorage.getItem('studentToken');
      const response = await axios.get(`${env.VITE_SERVER_URL}/api/v1/students/fee-assignments`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: filters,
      });
      setFeeAssignments(response.data.feeAssignments);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load fee assignments');
      // toast.error(err.response?.data?.message || 'Failed to load fee assignments');
      if (err.response?.status === 401) navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user?._id) {
      navigate('/login');
    } else {
      fetchFeeAssignments();
    }
  }, [isAuthenticated, user, filters, navigate]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
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
          My Fee Assignments
        </h2>

        {feeAssignments.some((a) => a.status === 'overdue') && (
          <div style={{ backgroundColor: '#fef2f2', borderColor: '#f87171' }} className="mb-6 p-4 rounded-md border flex items-center">
            <ExclamationCircleIcon className="h-6 w-6 text-red-500 mr-2" />
            <p style={{ color: '#dc2626' }}>
              You have overdue fees. Please pay promptly to avoid penalties.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 text-center">
            <p style={{ color: '#dc2626' }} className="mb-2">{error}</p>
            <button
              onClick={fetchFeeAssignments}
              style={{ backgroundColor: COLORS.primary, color: COLORS.white }}
              className="px-4 py-2 rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-[${COLORS.primary}]"
              aria-label="Retry loading fee assignments"
            >
              Retry
            </button>
          </div>
        )}

        <div className="mb-6 flex flex-wrap gap-4">
          <input
            type="text"
            name="feeType"
            placeholder="Filter by Fee Type"
            value={filters.feeType}
            onChange={handleFilterChange}
            style={{ backgroundColor: COLORS.inputBackground, borderColor: COLORS.border }}
            className="px-4 py-2 rounded-md"
          />
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            style={{ backgroundColor: COLORS.inputBackground, borderColor: COLORS.border }}
            className="px-4 py-2 rounded-md"
          >
            <option value="">All Statuses</option>
            <option value="assigned">Assigned</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="fully_paid">Fully Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <FeeAssignmentSkeleton key={i} />
            ))}
          </div>
        ) : feeAssignments.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {feeAssignments.map((assignment) => (
              <div
                key={assignment._id}
                style={{ backgroundColor: COLORS.white, borderColor: COLORS.border }}
                className="p-6 rounded-lg shadow-md border hover:shadow-lg transition-transform"
              >
                <div className="flex items-center mb-2">
                  <DocumentTextIcon className="h-6 w-6 mr-2" style={{ color: COLORS.primary }} />
                  <p style={{ color: COLORS.textPrimary }} className="font-semibold">
                    {assignment.feeId.feeType}
                  </p>
                </div>
                <p style={{ color: COLORS.textPrimary }}>{CURRENCY}{assignment.amountDue}</p>
                <p style={{ color: COLORS.textPrimary }}>{CURRENCY}{assignment.amountPaid} Paid</p>
                <p
                  style={{
                    color:
                      getDaysRemaining(assignment.feeId.dueDate) === 'Due today'
                        ? COLORS.primary
                        : getDaysRemaining(assignment.feeId.dueDate).startsWith('Overdue')
                        ? '#dc2626'
                        : COLORS.textSecondary,
                  }}
                  className="text-sm"
                >
                  <strong>Due:</strong> {getDaysRemaining(assignment.feeId.dueDate)}
                </p>
                <p style={{ color: COLORS.textSecondary }} className="text-sm">
                  <strong>Due Date:</strong> {new Date(assignment.feeId.dueDate).toLocaleDateString()}
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
          </div>
        ) : (
          <p style={{ color: COLORS.textSecondary }} className="text-sm text-center">No fee assignments found.</p>
        )}
      </div>
    </div>
  );
}

export default StudentFeeAssignments;