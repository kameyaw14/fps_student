//@ts-nocheck
import React, { useState, useEffect } from "react";
import COLORS from "../constants/colors";
import { useStudentAppContext } from "../context/StudentAppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { env } from "../env";

interface PaymentData {
  _id: string;
  amount: number;
  fee?: { feeType: string };
  paymentProvider: string;
  status: string;
  createdAt: string;
}

interface RefundData {
  _id: string;
  paymentId: PaymentData;
  amount: number;
  status: string;
  reason: string;
  fraudScore: number;
  createdAt: string;
}

const RefundPage: React.FC = () => {
  const { user, CURRENCY } = useStudentAppContext();
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState<string>("");
  const [refunds, setRefunds] = useState<RefundData[]>([]);
  const [refundsLoading, setRefundsLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const token = localStorage.getItem("studentToken");
        const res = await axios.get(
          `${env.VITE_SERVER_URL}/api/v1/payment/get-payments`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setPayments(res.data.payments || []);
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to fetch payments");
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  useEffect(() => {
    const fetchRefunds = async () => {
      try {
        const token = localStorage.getItem("studentToken");
        const res = await axios.get(
          `${env.VITE_SERVER_URL}/api/v1/students/get-refunds`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setRefunds(res.data.refunds || []);
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to fetch refunds");
      } finally {
        setRefundsLoading(false);
      }
    };
    fetchRefunds();
  }, []);

  const lastPayment = payments.length > 0 ? payments[payments.length - 1] : null;
  console.log("lastPayment", lastPayment);

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lastPayment) {
      toast.error("No payment found to refund");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please enter a reason for the refund");
      return;
    }
    try {
      const token = localStorage.getItem("studentToken");
      const res = await axios.post(
        `${env.VITE_SERVER_URL}/api/v1/refund/request`,
        { paymentId: lastPayment._id, amount, reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(res.data.message || "Refund request submitted");
      setAmount("");
      setReason("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Refund request failed");
    }
  };

  return (
    <div
      style={{ backgroundColor: COLORS.background }}
      className="min-h-screen py-8 px-4"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1 - Student Info */}
        <div
          style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.border }}
          className="p-6 rounded-lg shadow-md border"
        >
          <h3 style={{ color: COLORS.primary }} className="text-xl font-semibold mb-4">
            My Account
          </h3>
          <p style={{ color: COLORS.textPrimary }}><strong>Name:</strong> {user?.name}</p>
          <p style={{ color: COLORS.textPrimary }}><strong>Email:</strong> {user?.email}</p>
          <p style={{ color: COLORS.textPrimary }}><strong>Student ID:</strong> {user?.studentId}</p>
          <p style={{ color: COLORS.textPrimary }}><strong>Department:</strong> {user?.department}</p>
          <p style={{ color: COLORS.textPrimary }}><strong>Year of Study:</strong> {user?.yearOfStudy}</p>
        </div>

        {/* Column 2 - Last Transaction */}
        <div
          style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.border }}
          className="p-6 rounded-lg shadow-md border"
        >
          <h3 style={{ color: COLORS.primary }} className="text-xl font-semibold mb-4">
            Last Transaction
          </h3>
          {loading ? (
            <p style={{ color: COLORS.textSecondary }}>Loading...</p>
          ) : lastPayment ? (
            <>
              <p style={{ color: COLORS.textPrimary }}><strong>Amount:</strong> {CURRENCY}{lastPayment.amount}</p>
              <p style={{ color: COLORS.textPrimary }}><strong>Provider:</strong> {lastPayment.paymentProvider}</p>
              <p style={{ color: lastPayment.status === "confirmed" ? "#22c55e" : "#eab308" }}>
                <strong>Status:</strong> {lastPayment.status}
              </p>
              <p style={{ color: COLORS.textSecondary }} className="text-sm">
                {new Date(lastPayment.createdAt).toLocaleDateString()}
              </p>
            </>
          ) : (
            <p style={{ color: COLORS.textSecondary }}>No transactions found.</p>
          )}
        </div>

        {/* Column 3 - Refund Form */}
        <div
          style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.border }}
          className="p-6 rounded-lg shadow-md border"
        >
          <h3 style={{ color: COLORS.primary }} className="text-xl font-semibold mb-4">
            Request Refund
          </h3>
          <form onSubmit={handleRefundSubmit} className="space-y-4">
            <div>
              <label style={{ color: COLORS.textPrimary }} className="block font-bold mb-1">
                Amount (GHS)
              </label>
              <label style={{ color: COLORS.textPrimary }} className="block mb-1 font-light">
                Note: Refunds requested after 24hrs of payment may not be processed. You may contact your school admin for assistance.
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{
                  backgroundColor: COLORS.inputBackground,
                  borderColor: COLORS.border,
                  color: COLORS.textPrimary,
                }}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label style={{ color: COLORS.textPrimary }} className="block font-bold mb-1">
                Reason
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                style={{
                  backgroundColor: COLORS.inputBackground,
                  borderColor: COLORS.border,
                  color: COLORS.textPrimary,
                }}
                className="w-full p-2 border rounded-md resize-none"
                placeholder="Explain why you want a refund..."
              />
            </div>
            <button
              type="submit"
              style={{ backgroundColor: COLORS.primary, color: COLORS.white }}
              className="w-full py-2 rounded-md hover:opacity-90 transition"
            >
              Submit Request
            </button>
          </form>
        </div>
      </div>

      {/* Section: List of Refunds Requested by Student */}
      <div className="max-w-7xl mx-auto mt-12">
        <h2 className="text-2xl font-bold text-blue-600 mb-6 text-center">
          My Refund Requests
        </h2>
        {refundsLoading ? (
          <div className="text-center py-6 text-lg text-gray-500">Loading refunds...</div>
        ) : refunds.length === 0 ? (
          <div className="text-center py-6 text-lg text-gray-500">No refund requests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow-md">
              <thead>
                <tr className="bg-purple-100 text-blue-600">
                  <th className="py-3 px-4 text-left">Amount</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-left">Reason</th>
                  {/*<th className="py-3 px-4 text-left">Fraud Score</th>*/}
                  <th className="py-3 px-4 text-left">Requested At</th>
                </tr>
              </thead>
              <tbody>
                {refunds.map((refund) => (
                  <tr key={refund._id} className="border-b">
                    <td className="py-2 px-4 text-black font-bold">
                      GHS {refund.amount}
                    </td>
                    <td className="py-2 px-4">
                      <span
                        className={`px-2 py-1 rounded ${
                          refund.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : refund.status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : refund.status === "processed"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {refund.status}
                      </span>
                    </td>
                    <td className="py-2 px-4">{refund.reason}</td>
                   {/*} <td className="py-2 px-4">{refund.fraudScore}</td>*/}
                    <td className="py-2 px-4">
                      {new Date(refund.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
        </div>
    );
}
export default RefundPage;