import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../../api/axios";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "CUSTOMER",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.email ||
      !formData.password ||
      !formData.role
    ) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      const loginResponse = await API.post(
        "/auth/login",
        {
          email: formData.email,
          password: formData.password,
        }
      );

      const token =
        loginResponse.data.access_token;

      localStorage.setItem(
        "access_token",
        token
      );

      const meResponse = await API.get(
        "/auth/me"
      );

      const user = meResponse.data;

      if (user.role !== formData.role) {
        localStorage.removeItem(
          "access_token"
        );

        toast.error(
          `Invalid role. This account is registered as ${user.role}.`
        );

        return;
      }

      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );

      if (user.role === "ADMIN") {
        toast.success(
          "Admin login successful"
        );

        navigate("/admin/dashboard");
      } else {
        toast.success(
          "Customer login successful"
        );

        navigate("/menu");
      }

    } catch (error) {
      localStorage.removeItem(
        "access_token"
      );

      toast.error(
        error.response?.data?.detail ||
          "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-red-600">
            Restaurant
          </h1>

          <p className="mt-2 text-gray-600">
            Login to your account
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="border border-red-200 rounded-xl p-6 shadow-sm"
        >
          <div className="mb-5">
            <label className="block text-sm font-medium text-red-600 mb-2">
              Email
            </label>

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="w-full px-4 py-3 border border-red-300 rounded-lg outline-none focus:border-red-600"
            />
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-red-600 mb-2">
              Password
            </label>

            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className="w-full px-4 py-3 border border-red-300 rounded-lg outline-none focus:border-red-600"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-red-600 mb-2">
              Login As
            </label>

            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-red-300 rounded-lg outline-none focus:border-red-600"
            >
              <option value="CUSTOMER">
                Customer
              </option>

              <option value="ADMIN">
                Admin
              </option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>

          <p className="text-center mt-6 text-gray-600">
            Don't have an account?{" "}

            <Link
              to="/register"
              className="text-red-600 font-semibold hover:underline"
            >
              Register
            </Link>
          </p>
        </form>

      </div>
    </div>
  );
}

export default Login;