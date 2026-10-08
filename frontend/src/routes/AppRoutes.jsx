import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "../components/ProtectedRoute";
import Navbar from "../components/Navbar";

// Auth
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

// Customer
import Menu from "../pages/customer/Menu";
import MenuDetails from "../pages/customer/MenuDetails";
import Cart from "../pages/customer/Cart";
import Checkout from "../pages/customer/Checkout";
import Orders from "../pages/customer/Orders";
import OrderDetails from "../pages/customer/OrderDetails";
import Reservations from "../pages/customer/Reservations";
import CreateReservation from "../pages/customer/CreateReservation";

// Admin
import Dashboard from "../pages/admin/Dashboard";
import MenuManagement from "../pages/admin/MenuManagement";
import OrderManagement from "../pages/admin/OrderManagement";
import ReservationManagement from "../pages/admin/ReservationManagement";
import TableManagement from "../pages/admin/TableManagement";

// Payment
import PaymentSuccess from "../pages/payment/PaymentSuccess";
import PaymentCancel from "../pages/payment/PaymentCancel";

function AppRoutes() {
  return (
    <BrowserRouter>

      <Navbar />

      <Routes>

        {/* PUBLIC ROUTES */}

        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/payment/success"
          element={<PaymentSuccess />}
        />

        <Route
          path="/payment/cancel"
          element={<PaymentCancel />}
        />


        {/* CUSTOMER ROUTES */}

        <Route
          element={<ProtectedRoute allowedRole="CUSTOMER" />}
        >

          <Route
            path="/menu"
            element={<Menu />}
          />

          <Route
            path="/menu/:menu_id"
            element={<MenuDetails />}
          />

          <Route
            path="/cart"
            element={<Cart />}
          />

          <Route
            path="/checkout"
            element={<Checkout />}
          />

          <Route
            path="/orders"
            element={<Orders />}
          />

          <Route
            path="/orders/:order_id"
            element={<OrderDetails />}
          />

          <Route
            path="/reservations"
            element={<Reservations />}
          />

          <Route
            path="/reservations/create"
            element={<CreateReservation />}
          />

        </Route>


        {/* ADMIN ROUTES */}

        <Route
          element={<ProtectedRoute allowedRole="ADMIN" />}
        >

          <Route
            path="/admin/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/admin/menu"
            element={<MenuManagement />}
          />

          <Route
            path="/admin/orders"
            element={<OrderManagement />}
          />

          <Route
            path="/admin/reservations"
            element={<ReservationManagement />}
          />

          <Route
            path="/admin/tables"
            element={<TableManagement />}
          />

        </Route>


        {/* INVALID ROUTE */}

        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default AppRoutes;