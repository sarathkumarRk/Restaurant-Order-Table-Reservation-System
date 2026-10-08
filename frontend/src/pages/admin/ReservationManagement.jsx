import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import API from "../../api/axios";

function ReservationManagement() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReservations = async () => {
    try {
      const response = await API.get("/reservations/admin/all");
      setReservations(response.data);
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Failed to fetch reservations"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const getNextStatuses = (status) => {
    if (status === "PENDING") {
      return ["CONFIRMED", "CANCELLED"];
    }

    if (status === "CONFIRMED") {
      return ["COMPLETED", "CANCELLED"];
    }

    return [];
  };

  const updateStatus = async (reservationId, newStatus) => {
    try {
      await API.put(
        `/reservations/admin/${reservationId}/status`,
        {
          status: newStatus,
        }
      );

      toast.success(`Reservation ${newStatus.toLowerCase()} successfully`);

      fetchReservations();
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Failed to update reservation status"
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600 text-lg">Loading reservations...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-red-600 mb-6">
          Reservation Management
        </h1>

        {reservations.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">
              No reservations found.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-red-600 text-white">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Customer ID</th>
                  <th className="px-4 py-3">Table ID</th>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">Guests</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {reservations.map((reservation) => {
                  const nextStatuses = getNextStatuses(
                    reservation.status
                  );

                  return (
                    <tr
                      key={reservation.id}
                      className="border-b hover:bg-red-50"
                    >
                      <td className="px-4 py-4 font-medium">
                        #{reservation.id}
                      </td>

                      <td className="px-4 py-4">
                        {reservation.user_id}
                      </td>

                      <td className="px-4 py-4">
                        {reservation.table_id}
                      </td>

                      <td className="px-4 py-4">
                        {new Date(
                          reservation.reservation_date
                        ).toLocaleString()}
                      </td>

                      <td className="px-4 py-4">
                        {reservation.guests}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            reservation.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-700"
                              : reservation.status === "CONFIRMED"
                              ? "bg-green-100 text-green-700"
                              : reservation.status === "COMPLETED"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {reservation.status}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        {nextStatuses.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {nextStatuses.map((status) => (
                              <button
                                key={status}
                                onClick={() =>
                                  updateStatus(
                                    reservation.id,
                                    status
                                  )
                                }
                                className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700"
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">
                            No actions
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReservationManagement;