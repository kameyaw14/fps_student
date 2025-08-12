//// @ts-nocheck
import { Routes, Route, Navigate } from 'react-router-dom';
import { useStudentAppContext } from './context/StudentAppContext';
import StudentLogin from './pages/StudentLogin';
import StudentDashboard from './pages/StudentDashboard';
import StudentMainLayout from './components/StudentMainLayout';
import COLORS from './constants/colors';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useStudentAppContext();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <div style={{ backgroundColor: COLORS.background }} className="font-montserrat">
      <Routes>
        <Route path="/login" element={<StudentLogin />} />
        <Route path="/login-failed" element={<div>Too many login attempts. Please try again later.</div>} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <StudentMainLayout>
                <StudentDashboard />
              </StudentMainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <StudentMainLayout>
                <div>Payments Page (Coming Soon)</div>
              </StudentMainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/receipts"
          element={
            <ProtectedRoute>
              <StudentMainLayout>
                <div>Receipts Page (Coming Soon)</div>
              </StudentMainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/refunds"
          element={
            <ProtectedRoute>
              <StudentMainLayout>
                <div>Refunds Page (Coming Soon)</div>
              </StudentMainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <StudentMainLayout>
                <div>Profile Page (Coming Soon)</div>
              </StudentMainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses"
          element={
            <ProtectedRoute>
              <StudentMainLayout>
                <div>Courses Page (Coming Soon)</div>
              </StudentMainLayout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<div>Not Found</div>} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </div>
  );
}

export default App;