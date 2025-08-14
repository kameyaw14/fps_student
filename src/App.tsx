//@ts-nocheck
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useStudentAppContext } from "./context/StudentAppContext";
import StudentLogin from "./pages/StudentLogin";
import StudentDashboard from "./pages/StudentDashboard";
import StudentFeeAssignments from "./pages/StudentFeeAssignments";
import StudentFeeAssignmentDetails from "./pages/StudentFeeAssignmentDetails";
import StudentMainLayout from "./components/StudentMainLayout";
import NotFound from "./pages/NotFound";
import  Payment from "./pages/payment";
import LoadingScreen from "./components/LoadingScreen";
import COLORS from "./constants/colors";
import RefundForm from "./pages/refund";
//import ThreeColumnRefund from "./pages/refund";
import StudentNotifications from "./pages/StudentNotifications";


function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useStudentAppContext();
  const location = useLocation();
  return isAuthenticated ? (
    <>{children}</>
  ) : (
    <Navigate to="/login" state={{ from: location.pathname }} replace />
  );
}

function App() {
  const { loading } = useStudentAppContext();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div style={{ backgroundColor: COLORS.background }}>
      <Routes>
        <Route path="/login" element={<StudentLogin />} />
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
          path="/fee-assignments"
          element={
            <ProtectedRoute>
              <StudentMainLayout>
                <StudentFeeAssignments />
              </StudentMainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/fee-assignments/:id"
          element={
            <ProtectedRoute>
              <StudentMainLayout>
                <StudentFeeAssignmentDetails />
              </StudentMainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <StudentMainLayout>
                <Payment/>
              </StudentMainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/refunds"
          element={
            <ProtectedRoute>
              <StudentMainLayout>
                <RefundForm/>
              </StudentMainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses"
          element={
            <ProtectedRoute>
              <StudentMainLayout>
                <NotFound />
              </StudentMainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <StudentMainLayout>
                <NotFound />
              </StudentMainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <StudentMainLayout>
                <StudentNotifications />
              </StudentMainLayout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </div>
  );
}

export default App;