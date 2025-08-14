//@ts-nocheck
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Papa from 'papaparse'; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { io } from 'socket.io-client';
import { BellIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Tooltip } from 'react-tooltip';
import COLORS from '../constants/colors';
import { useStudentAppContext } from '../context/StudentAppContext';
import SkeletonLoader from '../components/SkeletonLoader';
import { env } from '../env';

interface Notification {
  _id: string;
  message: string;
  type: string;
  status: string;
  createdAt: string;
  read: boolean;
}

const StudentNotifications: React.FC = () => {
  const { user, isAuthenticated, CURRENCY } = useStudentAppContext();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<string>('desc');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const socket = io(env.VITE_SERVER_URL, {
      auth: { token: `Bearer ${localStorage.getItem('studentToken')}` },
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    socket.on('new_notification', (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev.slice(0, limit - 1)]);
      setUnreadCount((prev) => prev + (notification.read ? 0 : 1));
      setTotal((prev) => prev + 1);
      toast.info('New notification received!');
    });

    socket.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err);
    //   toast.error('Failed to connect to notifications server');
    });

    fetchNotifications();

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, navigate, page, filterType, filterStatus, sortBy, sortOrder]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${env.VITE_SERVER_URL}/api/v1/students/notifications`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('studentToken')}` },
        params: { page, limit, type: filterType, status: filterStatus, sortBy, sortOrder },
      });
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
      setTotal(response.data.total);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch notifications');
      toast.error(err.response?.data?.message || 'Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await axios.delete(`${env.VITE_SERVER_URL}/api/v1/students/notifications/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('studentToken')}` },
      });
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setTotal((prev) => prev - 1);
      setUnreadCount((prev) => prev - (notifications.find((n) => n._id === id)?.read ? 0 : 1));
      toast.success('Notification deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete notification');
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      await axios.delete(`${env.VITE_SERVER_URL}/api/v1/students/notifications`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('studentToken')}` },
      });
      setNotifications([]);
      setUnreadCount(0);
      setTotal(0);
      setIsModalOpen(false);
      toast.success('All notifications cleared');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to clear notifications');
    }
  };

  const handleMarkRead = async (id?: string) => {
    try {
      const notificationIds = id ? [id] : notifications.map((n) => n._id);
      await axios.post(
        `${env.VITE_SERVER_URL}/api/v1/students/notifications/mark-read`,
        { notificationIds },
        { headers: { Authorization: `Bearer ${localStorage.getItem('studentToken')}` } }
      );
      setNotifications((prev) =>
        prev.map((n) => (notificationIds.includes(n._id) ? { ...n, read: true, status: 'sent' } : n))
      );
      setUnreadCount((prev) => prev - notificationIds.filter((id) => !notifications.find((n) => n._id === id)?.read).length);
      toast.success('Notifications marked as read');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark notifications as read');
    }
  };

  const handleExportCSV = () => {
    const data = notifications.map((n) => ({
      message: n.message,
      type: n.type,
      status: n.status,
      createdAt: new Date(n.createdAt).toLocaleDateString(),
      read: n.read ? 'Yes' : 'No',
    }));
    const csv = Papa.unparse(data); // CHANGE: Use PapaParse to generate CSV
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'notifications.csv');
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text('Notifications', 20, 20);
    autoTable(doc, {
      head: [['Message', 'Type', 'Status', 'Date', 'Read']],
      body: notifications.map((n) => [
        n.message,
        n.type,
        n.status,
        new Date(n.createdAt).toLocaleDateString(),
        n.read ? 'Yes' : 'No',
      ]),
      startY: 30,
      theme: 'striped',
      headStyles: { fillColor: COLORS.primary },
    });
    doc.save('notifications.pdf');
  };

  const customSkeleton = (
    <div className="p-4 border-b" style={{ borderColor: COLORS.border }}>
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="h-6 w-6 bg-gray-200 rounded-full animate-pulse"></div>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto" style={{ backgroundColor: COLORS.background }}>
      <h2 className="text-2xl font-bold mb-6 flex items-center" style={{ color: COLORS.textPrimary }}>
        <BellIcon className="h-6 w-6 mr-2" />
        Notifications
        {unreadCount > 0 && (
          <span
            className="ml-2 bg-red-500 text-white rounded-full px-2 py-1 text-sm"
            style={{ backgroundColor: '#ef4444' }}
          >
            {unreadCount}
          </span>
        )}
      </h2>

      <div className="mb-4 flex space-x-4">
        <div>
          <label className="block text-sm" style={{ color: COLORS.textSecondary }}>
            Filter by Type
          </label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="mt-1 p-2 rounded"
            style={{ backgroundColor: COLORS.inputBackground, borderColor: COLORS.border }}
          >
            <option value="">All Types</option>
            <option value="payment_success">Payment Success</option>
            <option value="payment_failure">Payment Failure</option>
            <option value="refund_approved">Refund Approved</option>
            <option value="refund_rejected">Refund Rejected</option>
            <option value="fee_assigned">Fee Assigned</option> {/* CHANGE: Added fee_assigned */}
            <option value="dashboard_accessed">Dashboard Accessed</option> {/* CHANGE: Added dashboard_accessed */}
          </select>
        </div>
        <div>
          <label className="block text-sm" style={{ color: COLORS.textSecondary }}>
            Filter by Status
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="mt-1 p-2 rounded"
            style={{ backgroundColor: COLORS.inputBackground, borderColor: COLORS.border }}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div>
          <label className="block text-sm" style={{ color: COLORS.textSecondary }}>
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="mt-1 p-2 rounded"
            style={{ backgroundColor: COLORS.inputBackground, borderColor: COLORS.border }}
          >
            <option value="createdAt">Date</option>
            <option value="type">Type</option>
          </select>
        </div>
        <div>
          <label className="block text-sm" style={{ color: COLORS.textSecondary }}>
            Order
          </label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="mt-1 p-2 rounded"
            style={{ backgroundColor: COLORS.inputBackground, borderColor: COLORS.border }}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      <div className="mb-4 flex space-x-2">
        <button
          onClick={() => handleMarkRead()}
          className="px-4 py-2 rounded"
          style={{ backgroundColor: COLORS.primary, color: COLORS.white }}
        >
          Mark All as Read
        </button>
        <button
          onClick={() => setIsModalOpen(true)}
          data-tooltip-id="clear-all-tooltip"
          className="px-4 py-2 rounded flex items-center"
          style={{ backgroundColor: '#ef4444', color: COLORS.white }}
        >
          <TrashIcon className="h-5 w-5 mr-2" />
          Clear All
        </button>
        <Tooltip id="clear-all-tooltip" place="top" content="Clear all notifications" />
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 rounded"
          style={{ backgroundColor: COLORS.primary, color: COLORS.white }}
        >
          Export CSV
        </button>
        <button
          onClick={handleExportPDF}
          className="px-4 py-2 rounded"
          style={{ backgroundColor: COLORS.primary, color: COLORS.white }}
        >
          Export PDF
        </button>
      </div>

      {isLoading ? (
        <div>
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div key={i}>{customSkeleton}</div>
            ))}
        </div>
      ) : error ? (
        <p style={{ color: COLORS.textSecondary }} className="text-sm">
          {error}
        </p>
      ) : notifications.length === 0 ? (
        <p style={{ color: COLORS.textSecondary }} className="text-sm">
          No notifications found.
        </p>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className="p-4 rounded shadow"
              style={{
                backgroundColor: notification.read ? COLORS.cardBackground : '#dbeafe',
                borderColor: COLORS.border,
              }}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p style={{ color: COLORS.textPrimary }} className="font-medium">
                    {notification.message}
                  </p>
                  <p style={{ color: COLORS.textSecondary }} className="text-sm">
                    Type: {notification.type} | Status: {notification.status} |{' '}
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  {!notification.read && (
                    <button
                      onClick={() => handleMarkRead(notification._id)}
                      className="px-2 py-1 rounded text-sm"
                      style={{ backgroundColor: COLORS.primary, color: COLORS.white }}
                    >
                      Mark as Read
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteNotification(notification._id)}
                    className="px-2 py-1 rounded text-sm"
                    style={{ backgroundColor: '#ef4444', color: COLORS.white }}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {total > limit && (
        <div className="mt-4 flex justify-center space-x-2">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded"
            style={{
              backgroundColor: page === 1 ? '#d1d5db' : COLORS.primary,
              color: COLORS.white,
            }}
          >
            Previous
          </button>
          <span style={{ color: COLORS.textPrimary }}>
            Page {page} of {Math.ceil(total / limit)}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(total / limit)}
            className="px-4 py-2 rounded"
            style={{
              backgroundColor: page >= Math.ceil(total / limit) ? '#d1d5db' : COLORS.primary,
              color: COLORS.white,
            }}
          >
            Next
          </button>
        </div>
      )}

      {isModalOpen && (
        <div
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          className="fixed inset-0 flex items-center justify-center z-50"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{ backgroundColor: COLORS.white }}
            className="p-6 rounded-lg shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: COLORS.textPrimary }} className="text-xl font-semibold mb-4">
              Confirm Clear All Notifications
            </h3>
            <p style={{ color: COLORS.textSecondary }} className="mb-6">
              Are you sure you want to clear all notifications? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ backgroundColor: '#d1d5db', color: COLORS.black }}
                className="px-4 py-2 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAllNotifications}
                style={{ backgroundColor: '#ef4444', color: COLORS.white }}
                className="px-4 py-2 rounded-md"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentNotifications;