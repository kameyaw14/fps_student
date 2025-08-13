import { useNavigate } from "react-router-dom";
import { HomeIcon } from "@heroicons/react/24/outline";
import COLORS from "../constants/colors";

function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{ backgroundColor: COLORS.background }} className="min-h-screen flex items-center justify-center py-12">
      <div className="text-center">
        <h2 style={{ color: COLORS.primary }} className="text-3xl font-bold mb-4">404 - Page Not Found</h2>
        <p style={{ color: COLORS.textSecondary }} className="mb-6">The page you are looking for does not exist.</p>
        <button
          onClick={() => navigate("/dashboard")}
          style={{ backgroundColor: COLORS.primary, color: COLORS.white }}
          className="flex items-center justify-center mx-auto px-4 py-2 rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-[${COLORS.primary}]"
          aria-label="Return to dashboard"
        >
          <HomeIcon className="h-5 w-5 mr-2" />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export default NotFound;