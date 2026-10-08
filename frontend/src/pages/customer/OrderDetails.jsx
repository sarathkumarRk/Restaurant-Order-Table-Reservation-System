import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../../api/axios";

function OrderDetails() {
  const { order_id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);

      const response = await API.get(`/orders/${order_id}`);

      setOrder(response.data);
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to load order"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [order_id]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-white px-4 py-8">
        <div className="max-w-5xl mx-auto text-center py-16">
          <p className="text-red-600 font-semibold">
            Loading order...
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-white px-4 py-8">
        <div className="max-w-5xl mx-auto text-center py-16">

          <h1 className="text-2xl font-bold text-red-600">
            Order not found
          </h1>

          <Link
            to="/orders"
            className="inline-block mt-5 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Back to Orders
          </Link>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 py-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">

          <div>
            <h1 className="text-3xl font-bold text-red-600">
              Order #{order.id}
            </h1>

            <p className="text-gray-600 mt-1">
              Order details and status
            </p>
          </div>

          <Link
            to="/orders"
            className="border border-red-600 text-red-600 hover:bg-red-50 px-5 py-3 rounded-lg font-semibold text-center"
          >
            Back to Orders
          </Link>

        </div>

        {/* Order Summary */}
        <div className="border border-red-200 rounded-xl p-6">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            <div>
              <p className="text-sm text-gray-500">
                Order Date
              </p>

              <p className="font-semibold mt-1">
                {formatDate(order.created_at)}
              </p>
            </div>

            <span
              className={`inline-flex items-center w-fit px-4 py-2 rounded-full border text-sm font-semibold ${getStatusStyle(
                order.status
              )}`}
            >
              {order.status.replaceAll("_", " ")}
            </span>

          </div>

          {/* Total */}
          <div className="mt-6 pt-6 border-t border-red-100">
            <p className="text-sm text-gray-500">
              Total Amount
            </p>

            <p className="text-2xl font-bold text-red-600 mt-1">
              ₹{Number(order.total_amount).toFixed(2)}
            </p>
          </div>

        </div>

        {/* Order Items */}
        <div className="border border-red-200 rounded-xl p-6 mt-6">

          <h2 className="text-xl font-bold text-red-600 mb-5">
            Order Items
          </h2>

          {order.items && order.items.length > 0 ? (
            <div className="space-y-4">

              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="border border-red-100 rounded-lg p-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Food Item #{item.menu_item_id}
                      </h3>

                      <p className="text-sm text-gray-500 mt-1">
                        Quantity: {item.quantity}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">

                      <p className="text-sm text-gray-500">
                        Unit Price
                      </p>

                      <p className="font-semibold text-red-600">
                        ₹{Number(item.unit_price).toFixed(2)}
                      </p>

                    </div>

                  </div>

                  <div className="mt-3 pt-3 border-t border-red-100 flex justify-between">

                    <span className="text-sm text-gray-500">
                      Item Total
                    </span>

                    <span className="font-bold text-gray-900">
                      ₹
                      {(
                        Number(item.unit_price) *
                        item.quantity
                      ).toFixed(2)}
                    </span>

                  </div>
                </div>
              ))}

            </div>
          ) : (
            <p className="text-gray-600">
              No order items found.
            </p>
          )}

        </div>

      </div>
    </div>
  );
}

export default OrderDetails;