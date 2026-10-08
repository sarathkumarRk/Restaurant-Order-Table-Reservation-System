import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../../api/axios";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const response = await API.get("/orders");

      setOrders(response.data);
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to load orders"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const formatDate = (date) => {
    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "ORDER_PLACED":
        return "bg-red-50 text-red-600 border-red-200";

      case "CONFIRMED":
        return "bg-red-100 text-red-700 border-red-300";

      case "PREPARING":
        return "bg-red-50 text-red-600 border-red-200";

      case "READY":
        return "bg-red-100 text-red-700 border-red-300";

      case "COMPLETED":
        return "bg-red-600 text-white border-red-600";

      case "CANCELLED":
        return "bg-red-50 text-red-400 border-red-200";

      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 py-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-red-600">
              My Orders
            </h1>

            <p className="text-gray-600 mt-1">
              View your order history and status
            </p>
          </div>

          <Link
            to="/menu"
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-lg font-semibold text-center"
          >
            Browse Menu
          </Link>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="text-center py-16">
            <p className="text-red-600 font-semibold">
              Loading orders...
            </p>
          </div>
        ) : orders.length === 0 ? (

          /* Empty Orders */
          <div className="border border-red-200 rounded-xl p-10 text-center">
            <h2 className="text-xl font-semibold text-red-600">
              No orders found
            </h2>

            <p className="text-gray-600 mt-2">
              You have not placed any orders yet.
            </p>

            <Link
              to="/menu"
              className="inline-block mt-5 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Order Now
            </Link>
          </div>

        ) : (

          /* Orders */
          <div className="space-y-5">

            {orders.map((order) => (
              <div
                key={order.id}
                className="border border-red-200 rounded-xl p-5 bg-white"
              >
                {/* Order Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Order #{order.id}
                    </h2>

                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(order.created_at)}
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center w-fit px-3 py-1.5 rounded-full border text-sm font-semibold ${getStatusStyle(
                      order.status
                    )}`}
                  >
                    {order.status.replaceAll("_", " ")}
                  </span>
                </div>

                {/* Order Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 pt-5 border-t border-red-100">

                  <div>
                    <p className="text-sm text-gray-500">
                      Total Amount
                    </p>

                    <p className="text-xl font-bold text-red-600 mt-1">
                      ₹{Number(order.total_amount).toFixed(2)}
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <Link
                      to={`/orders/${order.id}`}
                      className="inline-block border border-red-600 text-red-600 hover:bg-red-50 px-5 py-2.5 rounded-lg font-semibold"
                    >
                      View Details
                    </Link>
                  </div>

                </div>
              </div>
            ))}

          </div>
        )}

      </div>
    </div>
  );
}

export default Orders;