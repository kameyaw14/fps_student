//@ts-nocheck
import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
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
  const { user, isAuthenticated, CURRENCY, paymentInitiated, setPaymentInitiated } = useStudentAppContext();
  const navigate = useNavigate();
  const [feeAssignments, setFeeAssignments] = useState<FeeAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    feeType: '',
    status: '',
  });

  // CHANGE: Polling logic for fee assignments
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
      // CHANGE: Reset paymentInitiated after successful fetch
      if (paymentInitiated) {
        setPaymentInitiated(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load fee assignments');
      toast.error(err.response?.data?.message || 'Failed to load fee assignments');
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // CHANGE: Polling when paymentInitiated is true
  useEffect(() => {
    fetchFeeAssignments();
    let pollingInterval: NodeJS.Timeout;
    if (paymentInitiated) {
      pollingInterval = setInterval(() => {
        fetchFeeAssignments();
      }, 5000); // Poll every 5 seconds
      // Stop polling after 30 seconds
      setTimeout(() => {
        clearInterval(pollingInterval);
        setPaymentInitiated(false);
      }, 30000);
    }
    return () => clearInterval(pollingInterval);
  }, [paymentInitiated, filters]);

  // CHANGE: Trigger payment and set paymentInitiated
  const handlePayNow = async (feeId: string, amountDue: number) => {
    try {
      const accessToken = localStorage.getItem('studentToken');
      const response = await axios.post(
        `${env.VITE_SERVER_URL}/api/v1/payment/initialize`,
        { feeId, amount: amountDue },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setPaymentInitiated(true); // Set to trigger polling
      window.location.href = response.data.paymentUrl; // Redirect to Paystack
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initialize payment');
    }
  };

  const statusColors = {
    assigned: '#1976D2', // COLORS.primary
    partially_paid: '#0288D1',
    fully_paid: '#2e7d32',
    overdue: '#dc2626',
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{ backgroundColor: COLORS.background }} className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <h1 style={{ color: COLORS.textPrimary }} className="text-2xl font-bold mb-6">
          Your Fee Assignments
        </h1>
        <div className="mb-6">
          <div className="flex space-x-4">
            <input
              type="text"
              placeholder="Filter by fee type"
              style={{ backgroundColor: COLORS.inputBackground, borderColor: COLORS.border, color: COLORS.textPrimary }}
              className="p-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.feeType}
              onChange={(e) => setFilters({ ...filters, feeType: e.target.value })}
            />
            <select
              style={{ backgroundColor: COLORS.inputBackground, borderColor: COLORS.border, color: COLORS.textPrimary }}
              className="p-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Statuses</option>
              <option value="assigned">Assigned</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="fully_paid">Fully Paid</option>
              <option value="overdue">Overdue</option>
            </select>
            <button
              onClick={fetchFeeAssignments}
              style={{ backgroundColor: COLORS.primary, color: COLORS.white }}
              className="px-4 py-2 rounded-md hover:bg-blue-800"
            >
              Apply Filters
            </button>
          </div>
        </div>
        {error && (
          <div style={{ backgroundColor: '#fee2e2', borderColor: '#dc2626' }} className="p-4 mb-6 rounded-md border flex items-center">
            <ExclamationCircleIcon className="h-6 w-6 text-red-600 mr-2" />
            <p style={{ color: '#dc2626' }}>{error}</p>
          </div>
        )}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeeAssignmentSkeleton />
            <FeeAssignmentSkeleton />
            <FeeAssignmentSkeleton />
          </div>
        ) : feeAssignments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {feeAssignments.map((assignment) => (
              <div
                key={assignment._id}
                style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.border }}
                className="p-6 rounded-lg shadow-md border"
              >
                <div className="flex items-center mb-2">
                  <DocumentTextIcon className="h-5 w-5 mr-2" style={{ color: COLORS.primary }} />
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
                      onClick={() => handlePayNow(assignment.feeId._id, assignment.amountDue)}
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