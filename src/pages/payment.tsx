//@ts-nocheck
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { useStudentAppContext } from '../context/StudentAppContext';
import { env } from '../env';
import COLORS from '../constants/colors';

interface FeeAssignment {
  _id: string;
  feeId: {
    _id: string;
    feeType: string;
    amount: number;
    dueDate: string;
    academicSession: string;
    allowPartialPayment: boolean;
  };
  status: string;
  amountDue: number;
  amountPaid: number;
}

interface PaymentResponse {
  message: string;
  paymentUrl: string;
  payment: {
    _id: string;
    feeId: string;
    amount: number;
    paymentProvider: string;
    status: string;
  };
}

const Payment: React.FC = () => {
  const { user, isAuthenticated, CURRENCY } = useStudentAppContext();
  const navigate = useNavigate();
  const [feeAssignments, setFeeAssignments] = useState<FeeAssignment[]>([]);
  const [selectedFeeId, setSelectedFeeId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Fetch fee assignments
  const fetchFeeAssignments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const accessToken = localStorage.getItem('studentToken');
      const response = await axios.get(`${env.VITE_SERVER_URL}/api/v1/students/fee-assignments`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const { feeAssignments } = response.data;
      // Filter for fees that can be paid
      const payableFees = feeAssignments.filter(
        (assignment: FeeAssignment) => 
          assignment.status === 'assigned' || assignment.status === 'partially_paid'
      );
      setFeeAssignments(payableFees);
      if (payableFees.length > 0) {
        setSelectedFeeId(payableFees[0].feeId._id);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load fee assignments');
      toast.error(err.response?.data?.message || 'Failed to load fee assignments');
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
  }, [isAuthenticated, user, navigate]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const selectedFee = feeAssignments.find(f => f.feeId._id === selectedFeeId);
    if (!selectedFee) {
      setError('Please select a valid fee');
      toast.error('Please select a valid fee');
      setIsSubmitting(false);
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Amount must be greater than 0');
      toast.error('Amount must be greater than 0');
      setIsSubmitting(false);
      return;
    }

   /* if (!selectedFee.feeId.allowPartialPayment && amountNum < selectedFee.amountDue) {
      setError('Partial payments are not allowed for this fee');
      toast.error('Partial payments are not allowed for this fee');
      setIsSubmitting(false);
      return;
    }*/

    if (amountNum > selectedFee.amountDue) {
      setError(`Amount cannot exceed remaining balance of ${CURRENCY}${selectedFee.amountDue}`);
      toast.error(`Amount cannot exceed remaining balance of ${CURRENCY}${selectedFee.amountDue}`);
      setIsSubmitting(false);
      return;
    }

    try {
      const accessToken = localStorage.getItem('studentToken');
      const response = await axios.post<PaymentResponse>(
        `${env.VITE_SERVER_URL}/api/v1/payment/initialize`,
        { feeId: selectedFeeId, amount: amountNum },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const { paymentUrl } = response.data;
      toast.success('Payment initialized');
      window.location.href = paymentUrl; // Redirect to Paystack
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to initialize payment';
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get selected fee details for display
  const selectedFee = feeAssignments.find(f => f.feeId._id === selectedFeeId);

  return (
    <div style={{ backgroundColor: COLORS.background }} className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h2 style={{ color: COLORS.primary }} className="text-3xl font-bold mb-8 text-center">
          Make a Payment
        </h2>

        {isLoading ? (
          <div style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.border }} 
               className="p-6 rounded-lg shadow-md border animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ) : error ? (
          <div className="mb-6 text-center">
            <p style={{ color: '#dc2626' }} className="mb-2">{error}</p>
            <button
              onClick={fetchFeeAssignments}
              style={{ backgroundColor: COLORS.primary, color: COLORS.white }}
              className="px-4 py-2 rounded-md hover:bg-blue-800"
              aria-label="Retry loading fee assignments"
            >
              Retry
            </button>
          </div>
        ) : feeAssignments.length === 0 ? (
          <div style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.border }} 
               className="p-6 rounded-lg shadow-md border text-center">
            <p style={{ color: COLORS.textSecondary }} className="text-lg">
              No payable fees found. Please check your fee assignments.
            </p>
            <button
              onClick={() => navigate('/fee-assignments')}
              style={{ backgroundColor: COLORS.primary, color: COLORS.white }}
              className="mt-4 px-4 py-2 rounded-md hover:bg-blue-800"
              aria-label="View fee assignments"
            >
              View Fee Assignments
            </button>
          </div>
        ) : (
          <div style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.border }} 
               className="p-6 rounded-lg shadow-md border">
            <h3 style={{ color: COLORS.primary }} className="text-xl font-semibold mb-4 flex items-center">
              <CurrencyDollarIcon className="h-6 w-6 mr-2" />
              Payment Details
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label 
                  htmlFor="feeId" 
                  style={{ color: COLORS.textPrimary }} 
                  className="block text-sm font-medium mb-1"
                >
                  Select Fee
                </label>
                <select
                  id="feeId"
                  value={selectedFeeId}
                  onChange={(e) => setSelectedFeeId(e.target.value)}
                  style={{ backgroundColor: COLORS.inputBackground, borderColor: COLORS.border }}
                  className="w-full p-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Select fee to pay"
                >
                  {feeAssignments.map((assignment) => (
                    <option key={assignment._id} value={assignment.feeId._id}>
                      {assignment?.feeId?.feeType} - {CURRENCY}{assignment.amountDue} (Due: {new Date(assignment.feeId.dueDate).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              {selectedFee && (
                <div style={{ backgroundColor: COLORS.white }} className="p-4 rounded-md shadow-sm">
                  <p style={{ color: COLORS.textPrimary }}><strong>Fee Type:</strong> {selectedFee?.feeId?.feeType}</p>
                  <p style={{ color: COLORS.textPrimary }}><strong>Amount Due:</strong> {CURRENCY}{selectedFee.amountDue}</p>
                  <p style={{ color: COLORS.textPrimary }}><strong>Amount Paid:</strong> {CURRENCY}{selectedFee.amountPaid}</p>
                  <p style={{ color: COLORS.textSecondary }}><strong>Due Date:</strong> {new Date(selectedFee.feeId.dueDate).toLocaleDateString()}</p>
                  <p style={{ color: COLORS.textSecondary }}><strong>Session:</strong> {selectedFee.feeId.academicSession}</p>
                  <p style={{ color: COLORS.textSecondary }}><strong>Partial Payment:</strong> {selectedFee.feeId.allowPartialPayment ? 'Allowed' : 'Not Allowed'}</p>
                </div>
              )}

              <div>
                <label 
                  htmlFor="amount" 
                  style={{ color: COLORS.textPrimary }} 
                  className="block text-sm font-medium mb-1"
                >
                  Amount to Pay ({CURRENCY})
                </label>
                <input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  style={{ 
                    backgroundColor: COLORS.inputBackground, 
                    borderColor: COLORS.border,
                    color: COLORS.textPrimary,
                    '::placeholder': { color: COLORS.placeholderText }
                  }}
                  className="w-full p-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0.01"
                  step="0.01"
                  aria-label="Amount to pay"
                  disabled={isSubmitting}
                />
              </div>

              {error && (
                <p style={{ color: '#dc2626' }} className="text-sm">{error}</p>
              )}

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  style={{ backgroundColor: '#d1d5db', color: COLORS.black }}
                  className="px-4 py-2 rounded-md hover:bg-gray-400"
                  aria-label="Back to dashboard"
                  disabled={isSubmitting}
                >
                  Back
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: COLORS.primary, color: COLORS.white }}
                  className={`px-4 py-2 rounded-md hover:bg-blue-800 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  aria-label="Proceed to payment"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Processing...' : 'Proceed to Paystack'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payment;