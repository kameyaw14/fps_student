//// @ts-nocheck
import React from 'react';
import StudentSidebar from './StudentSidebar';
import { useStudentAppContext } from '../context/StudentAppContext';
import COLORS from '../constants/colors';

interface MainLayoutProps {
  children: React.ReactNode;
}

const StudentMainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { isAuthenticated, logout } = useStudentAppContext();

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen">
      <StudentSidebar onLogout={() => logout()} />
      <main style={{ backgroundColor: COLORS.background }} className="flex-1 md:ml-64">
        {children}
      </main>
    </div>
  );
};

export default StudentMainLayout;