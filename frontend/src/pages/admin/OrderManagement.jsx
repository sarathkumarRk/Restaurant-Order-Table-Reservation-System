import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import API from "../../api/axios";

function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const response = await API.get("/orders/admin/all");

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

  const getNextStatuses = (status) => {
    switch (status) {
      case "ORDER_PLACED":
        return ["CONFIRMED", "CANCELLED"];

      case "CONFIRMED":
        return ["PREPARING", "CANCELLED"];

      case "PREPARING":
        return ["READY"];

      case "READY":
        return ["COMPLETED"];

      default:
        return [];
    }
  };

  const updateOrderStatus = async (
    orderId,
    newStatus
  ) => {
    try {
      setUpdatingId(orderId);

      const response = await API.put(
        `/orders/admin/${orderId}/status`,
        {
          status: newStatus,
        }
      );

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId
            ? response.data
            : order
        )
      );

      toast.success(
        `Order status changed to ${newStatus.replaceAll(
          "_",
          " "
        )}`
      );
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to update order status"
      );
    } finally {
      setUpdatingId(null);
    }
  };

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
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-red-600">
            Order Management
          </h1>

          <p className="text-gray-600 mt-1">
            View and manage customer orders
          </p>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="text-center py-16">
            <p className="text-red-600 font-semibold">
              Loading orders...
            </p>
          </div>
        ) : orders.length === 0 ? (
          <div className="border border-red-200 rounded-xl p-10 text-center">
            <h2 className="text-xl font-semibold text-red-600">
              No orders found
            </h2>

            <p className="text-gray-600 mt-2">
              There are no customer orders yet.
            </p>
          </div>
        ) : (
          <div className="space-y-5">

            {orders.map((order) => {
              const nextStatuses =
                getNextStatuses(order.status);

              return (
                <div
                  key={order.id}
                  className="border border-red-200 rounded-xl p-6"
                >

                  {/* Order Header */}
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Order #{order.id}
                      </h2>

                      <p className="text-sm text-gray-500 mt-1">
                        Customer ID: {order.user_id}
                      </p>

                      <p className="text-sm text-gray-500 mt-1">
                        {formatDate(order.created_at)}
                      </p>
                    </div>

                    <span
                      className={`inline-flex w-fit px-4 py-2 rounded-full border text-sm font-semibold ${getStatusStyle(
                        order.status
                      )}`}
                    >
                      {order.status.replaceAll(
                        "_",
                        " "
                      )}
                    </span>

                  </div>

                  {/* Order Information */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6 pt-5 border-t border-red-100">

                    <div>
                      <p className="text-sm text-gray-500">
                        Total Amount
                      </p>

                      <p className="text-2xl font-bold text-red-600 mt-1">
                        ₹
                        {Number(
                          order.total_amount
                        ).toFixed(2)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">
                        Order Items
                      </p>

                      <p className="text-lg font-semibold text-gray-900 mt-1">
                        {order.items?.length || 0} item(s)
                      </p>
                    </div>

                  </div>

                  {/* Items */}
                  {order.items &&
                    order.items.length > 0 && (
                      <div className="mt-6">

                        <h3 className="font-bold text-red-600 mb-3">
                          Items
                        </h3>

                        <div className="space-y-2">

                          {order.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border border-red-100 rounded-lg p-3"
                            >

                              <div>
                                <p className="font-semibold">
                                  Food Item #
                                  {item.menu_item_id}
                                </p>

                                <p className="text-sm text-gray-500">
                                  Quantity:{" "}
                                  {item.quantity}
                                </p>
                              </div>

                              <p className="font-semibold text-red-600">
                                ₹
                                {Number(
                                  item.unit_price
                                ).toFixed(2)}
                              </p>

                            </div>
                          ))}

                        </div>

                      </div>
                    )}

                  {/* Status Actions */}
                  <div className="mt-6 pt-5 border-t border-red-100">

                    <p className="text-sm font-semibold text-gray-700 mb-3">
                      Update Status
                    </p>

                    {nextStatuses.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        No further status changes available.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-3">

                        {nextStatuses.map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() =>
                              updateOrderStatus(
                                order.id,
                                status
                              )
                            }
                            disabled={
                              updatingId === order.id
                            }
                            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {updatingId === order.id
                              ? "Updating..."
                              : status.replaceAll(
                                  "_",
                                  " "
                                )}
                          </button>
                        ))}

                      </div>
                    )}

                  </div>

                </div>
              );
            })}

          </div>
        )}

      </div>
    </div>
  );
}

export default OrderManagement;