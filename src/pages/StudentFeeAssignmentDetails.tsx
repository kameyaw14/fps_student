import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
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

const FeeAssignmentDetailsSkeleton = () => (
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

function StudentFeeAssignmentDetails() {
  const { id } = useParams();
  const { isAuthenticated, user, CURRENCY, paymentInitiated, setPaymentInitiated } = useStudentAppContext();
  const navigate = useNavigate();
  const [feeAssignment, setFeeAssignment] = useState<FeeAssignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // CHANGE: Polling logic for fee assignment
  const fetchFeeAssignment = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const accessToken = localStorage.getItem('studentToken');
      const response = await axios.get(`${env.VITE_SERVER_URL}/api/v1/students/fee-assignments?_id=${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setFeeAssignment(response.data.feeAssignments[0]);
      // CHANGE: Reset paymentInitiated after successful fetch
      if (paymentInitiated) {
        setPaymentInitiated(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load fee assignment');
      toast.error(err.response?.data?.message || 'Failed to load fee assignment');
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // CHANGE: Polling when paymentInitiated is true
  useEffect(() => {
    fetchFeeAssignment();
    let pollingInterval: NodeJS.Timeout;
    if (paymentInitiated) {
      pollingInterval = setInterval(() => {
        fetchFeeAssignment();
      }, 5000); // Poll every 5 seconds
      // Stop polling after 30 seconds
      setTimeout(() => {
        clearInterval(pollingInterval);
        setPaymentInitiated(false);
      }, 30000);
    }
    return () => clearInterval(pollingInterval);
  }, [id, paymentInitiated]);

  // CHANGE: Trigger payment and set paymentInitiated
  const handlePayNow = async () => {
    if (!feeAssignment) return;
    try {
      const accessToken = localStorage.getItem('studentToken');
      const response = await axios.post(
        `${env.VITE_SERVER_URL}/api/v1/payment/initialize`,
        { feeId: feeAssignment.feeId._id, amount: feeAssignment.amountDue },
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
          Fee Assignment Details
        </h1>
        {error && (
          <div style={{ backgroundColor: '#fee2e2', borderColor: '#dc2626' }} className="p-4 mb-6 rounded-md border flex items-center">
            <ExclamationCircleIcon className="h-6 w-6 text-red-600 mr-2" />
            <p style={{ color: '#dc2626' }}>{error}</p>
          </div>
        )}
        {isLoading ? (
          <FeeAssignmentDetailsSkeleton />
        ) : feeAssignment ? (
          <div style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.border }} className="p-6 rounded-lg shadow-md border">
            <div className="flex items-center mb-4">
              <DocumentTextIcon className="h-6 w-6 mr-2" style={{ color: COLORS.primary }} />
              <h3 style={{ color: COLORS.textPrimary }} className="text-xl font-semibold">
                {feeAssignment.feeId.feeType}
              </h3>
            </div>
            <p style={{ color: COLORS.textPrimary }} className="mb-2">
              <strong>Amount Due:</strong> {CURRENCY}{feeAssignment.amountDue}
            </p>
            <p style={{ color: COLORS.textPrimary }} className="mb-2">
              <strong>Amount Paid:</strong> {CURRENCY}{feeAssignment.amountPaid}
            </p>
            <p style={{ color: COLORS.textPrimary }} className="mb-2">
              <strong>Status:</strong>{' '}
              <span style={{ backgroundColor: statusColors[feeAssignment.status], color: COLORS.white }} className="px-2 py-1 rounded-full">
                {feeAssignment.status}
              </span>
            </p>
            <p
              style={{
                color:
                  getDaysRemaining(feeAssignment.feeId.dueDate) === 'Due today'
                    ? COLORS.primary
                    : getDaysRemaining(feeAssignment.feeId.dueDate).startsWith('Overdue')
                    ? '#dc2626'
                    : COLORS.textPrimary,
              }}
              className="mb-2"
            >
              <strong>Due:</strong> {getDaysRemaining(feeAssignment.feeId.dueDate)}
            </p>
            <p style={{ color: COLORS.textPrimary }} className="mb-2">
              <strong>Due Date:</strong> {new Date(feeAssignment.feeId.dueDate).toLocaleDateString()}
            </p>
            <p style={{ color: COLORS.textPrimary }} className="mb-2">
              <strong>Academic Session:</strong> {feeAssignment.feeId.academicSession}
            </p>
            {(feeAssignment.status === 'assigned' || feeAssignment.status === 'partially_paid') && (
              <button
                onClick={handlePayNow}
                style={{ backgroundColor: COLORS.primary, color: COLORS.white }}
                className="mt-4 px-4 py-2 rounded-md hover:bg-blue-800"
                aria-label={`Pay for ${feeAssignment.feeId.feeType}`}
              >
                Pay Now
              </button>
            )}
          </div>
        ) : (
          <p style={{ color: COLORS.textSecondary }} className="text-sm text-center">Fee assignment not found.</p>
        )}
      </div>
    </div>
  );
}

export default StudentFeeAssignmentDetails;