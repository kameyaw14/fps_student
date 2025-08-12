//// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  ArrowLeftOnRectangleIcon,
  ChartPieIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  HomeIcon,
  UserIcon,
  BookOpenIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { MenuIcon, X } from 'lucide-react';
import COLORS from '../constants/colors';

interface SidebarProps {
  onLogout: () => void;
}

const StudentSidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    return localStorage.getItem('studentSidebarOpen') === 'true' || false;
  });
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('studentSidebarCollapsed') === 'true' || false;
  });

  useEffect(() => {
    localStorage.setItem('studentSidebarOpen', isSidebarOpen.toString());
  }, [isSidebarOpen]);

  useEffect(() => {
    localStorage.setItem('studentSidebarCollapsed', isCollapsed.toString());
  }, [isCollapsed]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: HomeIcon },
    { path: '/payments', label: 'Payments', icon: CurrencyDollarIcon },
    { path: '/receipts', label: 'Receipts', icon: DocumentTextIcon },
    { path: '/refunds', label: 'Refunds', icon: ArrowPathIcon },
    { path: '/profile', label: 'Profile', icon: UserIcon },
    { path: '/courses', label: 'Courses', icon: BookOpenIcon },
    { label: 'Logout', icon: ArrowLeftOnRectangleIcon, onClick: onLogout },
  ];

  return (
    <>
      <button
        onClick={toggleSidebar}
        style={{ backgroundColor: '#1e40af', color: COLORS.white }}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-600"
        aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {isSidebarOpen ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
      </button>

      <div
        style={{ color: COLORS.white }}
        className={`fixed inset-y-0 left-0 bg-indigo-800 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-300 ease-in-out z-40 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
        aria-expanded={isSidebarOpen}
        id="student-sidebar"
      >
        <div className="flex justify-between items-center p-4">
          {!isCollapsed && (
            <h2 style={{ color: COLORS.white }} className="text-xl font-bold">
              FPS Student
            </h2>
          )}
          <button
            onClick={toggleCollapse}
            className="hidden md:block p-2 hover:bg-indigo-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-600"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRightIcon className="h-6 w-6" /> : <ChevronLeftIcon className="h-6 w-6" />}
          </button>
        </div>
        <nav className="mt-4">
          {menuItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path || '#'}
              onClick={item.onClick ? item.onClick : undefined}
              className={({ isActive }) =>
                `flex items-center px-4 py-2 hover:bg-indigo-700 ${
                  isActive && item.path ? 'bg-indigo-600 border-l-4' : ''
                } ${isCollapsed ? 'justify-center' : ''}`
              }
              style={({ isActive }) => ({ borderLeftColor: isActive && item.path ? COLORS.primary : 'transparent' })}
              aria-label={`Navigate to ${item.label}`}
            >
              <item.icon className="h-6 w-6" />
              {!isCollapsed && <span className="ml-3">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      {isSidebarOpen && (
        <div
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          className="md:hidden fixed inset-0 z-30"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default StudentSidebar;