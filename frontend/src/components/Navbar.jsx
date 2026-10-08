import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const token = localStorage.getItem("access_token");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!token || !user) {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    toast.success("Logged out successfully");

    navigate("/login");
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-red-600 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link
            to={
              user.role === "ADMIN"
                ? "/admin/dashboard"
                : "/menu"
            }
            className="text-xl font-bold"
          >
            Restaurant System
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-2">

            {user.role === "CUSTOMER" && (
              <>
                <Link
                  to="/menu"
                  className={`px-3 py-2 rounded ${
                    isActive("/menu")
                      ? "bg-white text-red-600"
                      : "hover:bg-red-700"
                  }`}
                >
                  Menu
                </Link>

                <Link
                  to="/cart"
                  className={`px-3 py-2 rounded ${
                    isActive("/cart")
                      ? "bg-white text-red-600"
                      : "hover:bg-red-700"
                  }`}
                >
                  Cart
                </Link>

                <Link
                  to="/orders"
                  className={`px-3 py-2 rounded ${
                    isActive("/orders")
                      ? "bg-white text-red-600"
                      : "hover:bg-red-700"
                  }`}
                >
                  Orders
                </Link>

                <Link
                  to="/reservations"
                  className={`px-3 py-2 rounded ${
                    isActive("/reservations")
                      ? "bg-white text-red-600"
                      : "hover:bg-red-700"
                  }`}
                >
                  Reservations
                </Link>
              </>
            )}

            {user.role === "ADMIN" && (
              <>
                <Link
                  to="/admin/dashboard"
                  className={`px-3 py-2 rounded ${
                    isActive("/admin/dashboard")
                      ? "bg-white text-red-600"
                      : "hover:bg-red-700"
                  }`}
                >
                  Dashboard
                </Link>

                <Link
                  to="/admin/menu"
                  className={`px-3 py-2 rounded ${
                    isActive("/admin/menu")
                      ? "bg-white text-red-600"
                      : "hover:bg-red-700"
                  }`}
                >
                  Menu
                </Link>

                <Link
                  to="/admin/tables"
                  className={`px-3 py-2 rounded ${
                    isActive("/admin/tables")
                      ? "bg-white text-red-600"
                      : "hover:bg-red-700"
                  }`}
                >
                  Tables
                </Link>

                <Link
                  to="/admin/reservations"
                  className={`px-3 py-2 rounded ${
                    isActive("/admin/reservations")
                      ? "bg-white text-red-600"
                      : "hover:bg-red-700"
                  }`}
                >
                  Reservations
                </Link>

                <Link
                  to="/admin/orders"
                  className={`px-3 py-2 rounded ${
                    isActive("/admin/orders")
                      ? "bg-white text-red-600"
                      : "hover:bg-red-700"
                  }`}
                >
                  Orders
                </Link>
              </>
            )}

            {/* User */}
            <span className="px-3 py-2 font-medium">
              {user.name}
            </span>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="bg-white text-red-600 px-4 py-2 rounded font-medium hover:bg-red-50"
            >
              Logout
            </button>

          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;