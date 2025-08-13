import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
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
  const { isAuthenticated, user,CURRENCY } = useStudentAppContext();
  const navigate = useNavigate();
  const [feeAssignment, setFeeAssignment] = useState<FeeAssignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeeAssignment = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const accessToken = localStorage.getItem('studentToken');
      const response = await axios.get(`${env.VITE_SERVER_URL}/api/v1/students/fee-assignments?_id=${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setFeeAssignment(response.data.feeAssignments[0]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load fee assignment');
      toast.error(err.response?.data?.message || 'Failed to load fee assignment');
      if (err.response?.status === 401) navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user?._id) {
      navigate('/login');
    } else {
      fetchFeeAssignment();
    }
  }, [isAuthenticated, user, id, navigate]);

  const statusColors: { [key: string]: string } = {
    assigned: '#eab308',
    partially_paid: '#f59e0b',
    fully_paid: '#22c55e',
    overdue: '#ef4444',
  };

  return (
    <div style={{ backgroundColor: COLORS.background }} className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 style={{ color: COLORS.primary }} className="text-3xl font-bold mb-8 text-center">
          Fee Assignment Details
        </h2>

        {isLoading ? (
          <FeeAssignmentDetailsSkeleton />
        ) : error ? (
          <div className="text-center">
            <p style={{ color: '#dc2626' }} className="mb-2">{error}</p>
            <button
              onClick={fetchFeeAssignment}
              style={{ backgroundColor: COLORS.primary, color: COLORS.white }}
              className="px-4 py-2 rounded-md hover:bg-blue-800"
              aria-label="Retry loading fee assignment"
            >
              Retry
            </button>
          </div>
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
                onClick={() => navigate('/payments')}
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