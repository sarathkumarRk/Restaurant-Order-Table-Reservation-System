import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import API from "../../api/axios";

function Dashboard() {
  const [dashboard, setDashboard] = useState({
    total_orders: 0,
    todays_orders: 0,
    total_revenue: 0,
    todays_revenue: 0,
    pending_orders: 0,
    todays_reservations: 0,
  });

  const [mostOrderedFoods, setMostOrderedFoods] = useState([]);
  const [dailyRevenue, setDailyRevenue] = useState([]);
  const [reservationsPerDay, setReservationsPerDay] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);

  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const [
        dashboardResponse,
        foodsResponse,
        revenueResponse,
        reservationsResponse,
        customersResponse,
      ] = await Promise.all([
        API.get("/admin/dashboard"),
        API.get("/admin/most-ordered-foods"),
        API.get("/admin/daily-revenue"),
        API.get("/admin/reservations-per-day"),
        API.get("/admin/top-customers"),
      ]);

      setDashboard(dashboardResponse.data);
      setMostOrderedFoods(foodsResponse.data);
      setDailyRevenue(revenueResponse.data);
      setReservationsPerDay(reservationsResponse.data);
      setTopCustomers(customersResponse.data);
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to load dashboard"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white px-4 py-8">
        <div className="max-w-7xl mx-auto text-center py-16">
          <p className="text-red-600 font-semibold">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 py-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-red-600">
            Admin Dashboard
          </h1>

          <p className="text-gray-600 mt-1">
            Restaurant overview and performance
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

          <div className="border border-red-200 rounded-xl p-5">
            <p className="text-sm text-gray-500">
              Total Orders
            </p>

            <p className="text-3xl font-bold text-red-600 mt-2">
              {dashboard.total_orders}
            </p>
          </div>

          <div className="border border-red-200 rounded-xl p-5">
            <p className="text-sm text-gray-500">
              Today's Orders
            </p>

            <p className="text-3xl font-bold text-red-600 mt-2">
              {dashboard.todays_orders}
            </p>
          </div>

          <div className="border border-red-200 rounded-xl p-5">
            <p className="text-sm text-gray-500">
              Total Revenue
            </p>

            <p className="text-3xl font-bold text-red-600 mt-2">
              ₹{Number(dashboard.total_revenue).toFixed(2)}
            </p>
          </div>

          <div className="border border-red-200 rounded-xl p-5">
            <p className="text-sm text-gray-500">
              Today's Revenue
            </p>

            <p className="text-3xl font-bold text-red-600 mt-2">
              ₹{Number(dashboard.todays_revenue).toFixed(2)}
            </p>
          </div>

          <div className="border border-red-200 rounded-xl p-5">
            <p className="text-sm text-gray-500">
              Pending Orders
            </p>

            <p className="text-3xl font-bold text-red-600 mt-2">
              {dashboard.pending_orders}
            </p>
          </div>

          <div className="border border-red-200 rounded-xl p-5">
            <p className="text-sm text-gray-500">
              Today's Reservations
            </p>

            <p className="text-3xl font-bold text-red-600 mt-2">
              {dashboard.todays_reservations}
            </p>
          </div>

        </div>

        {/* Most Ordered Foods */}
        <div className="border border-red-200 rounded-xl p-6 mt-8">

          <h2 className="text-xl font-bold text-red-600 mb-5">
            Most Ordered Foods
          </h2>

          {mostOrderedFoods.length === 0 ? (
            <p className="text-gray-600">
              No food order data available.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">

                <thead>
                  <tr className="border-b border-red-200">
                    <th className="py-3 px-3">
                      Food
                    </th>

                    <th className="py-3 px-3">
                      Quantity Ordered
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {mostOrderedFoods.map((food) => (
                    <tr
                      key={food.food_id}
                      className="border-b border-red-100"
                    >
                      <td className="py-3 px-3 font-semibold">
                        {food.food_name}
                      </td>

                      <td className="py-3 px-3 text-red-600 font-semibold">
                        {food.total_quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}

        </div>

        {/* Daily Revenue */}
        <div className="border border-red-200 rounded-xl p-6 mt-6">

          <h2 className="text-xl font-bold text-red-600 mb-5">
            Daily Revenue
          </h2>

          {dailyRevenue.length === 0 ? (
            <p className="text-gray-600">
              No revenue data available.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">

                <thead>
                  <tr className="border-b border-red-200">
                    <th className="py-3 px-3">
                      Date
                    </th>

                    <th className="py-3 px-3">
                      Revenue
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {dailyRevenue.map((item) => (
                    <tr
                      key={item.date}
                      className="border-b border-red-100"
                    >
                      <td className="py-3 px-3">
                        {item.date}
                      </td>

                      <td className="py-3 px-3 text-red-600 font-semibold">
                        ₹{Number(item.revenue).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}

        </div>

        {/* Reservations Per Day */}
        <div className="border border-red-200 rounded-xl p-6 mt-6">

          <h2 className="text-xl font-bold text-red-600 mb-5">
            Reservations Per Day
          </h2>

          {reservationsPerDay.length === 0 ? (
            <p className="text-gray-600">
              No reservation data available.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">

                <thead>
                  <tr className="border-b border-red-200">
                    <th className="py-3 px-3">
                      Date
                    </th>

                    <th className="py-3 px-3">
                      Reservations
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {reservationsPerDay.map((item) => (
                    <tr
                      key={item.date}
                      className="border-b border-red-100"
                    >
                      <td className="py-3 px-3">
                        {item.date}
                      </td>

                      <td className="py-3 px-3 text-red-600 font-semibold">
                        {item.reservation_count}
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}

        </div>

        {/* Top Customers */}
        <div className="border border-red-200 rounded-xl p-6 mt-6">

          <h2 className="text-xl font-bold text-red-600 mb-5">
            Top Customers
          </h2>

          {topCustomers.length === 0 ? (
            <p className="text-gray-600">
              No customer spending data available.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">

                <thead>
                  <tr className="border-b border-red-200">
                    <th className="py-3 px-3">
                      Customer
                    </th>

                    <th className="py-3 px-3">
                      Email
                    </th>

                    <th className="py-3 px-3">
                      Total Spending
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {topCustomers.map((customer) => (
                    <tr
                      key={customer.customer_id}
                      className="border-b border-red-100"
                    >
                      <td className="py-3 px-3 font-semibold">
                        {customer.name}
                      </td>

                      <td className="py-3 px-3 text-gray-600">
                        {customer.email}
                      </td>

                      <td className="py-3 px-3 text-red-600 font-semibold">
                        ₹
                        {Number(
                          customer.total_spending
                        ).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

export default Dashboard;