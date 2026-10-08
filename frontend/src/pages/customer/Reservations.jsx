import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../../api/axios";

function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchReservations = async () => {
    try {
      setLoading(true);

      const response = await API.get("/reservations");

      setReservations(response.data);
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to load reservations"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const cancelReservation = async (reservationId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this reservation?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setCancellingId(reservationId);

      const response = await API.put(
        `/reservations/${reservationId}/cancel`
      );

      setReservations((currentReservations) =>
        currentReservations.map((reservation) =>
          reservation.id === reservationId
            ? response.data
            : reservation
        )
      );

      toast.success(
        "Reservation cancelled successfully"
      );
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to cancel reservation"
      );
    } finally {
      setCancellingId(null);
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
      case "PENDING":
        return "bg-red-50 text-red-600 border-red-200";

      case "CONFIRMED":
        return "bg-red-600 text-white border-red-600";

      case "COMPLETED":
        return "bg-red-100 text-red-700 border-red-300";

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
              My Reservations
            </h1>

            <p className="text-gray-600 mt-1">
              View and manage your table reservations
            </p>
          </div>

          <Link
            to="/reservations/create"
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-lg font-semibold text-center"
          >
            New Reservation
          </Link>

        </div>

        {/* Loading */}
        {loading ? (
          <div className="text-center py-16">
            <p className="text-red-600 font-semibold">
              Loading reservations...
            </p>
          </div>
        ) : reservations.length === 0 ? (

          /* Empty */
          <div className="border border-red-200 rounded-xl p-10 text-center">

            <h2 className="text-xl font-semibold text-red-600">
              No reservations found
            </h2>

            <p className="text-gray-600 mt-2">
              You have not made any table reservations yet.
            </p>

            <Link
              to="/reservations/create"
              className="inline-block mt-5 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Book a Table
            </Link>

          </div>

        ) : (

          /* Reservation List */
          <div className="space-y-5">

            {reservations.map((reservation) => (
              <div
                key={reservation.id}
                className="border border-red-200 rounded-xl p-5 bg-white"
              >

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Reservation #{reservation.id}
                    </h2>

                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(
                        reservation.reservation_date
                      )}
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center w-fit px-3 py-1.5 rounded-full border text-sm font-semibold ${getStatusStyle(
                      reservation.status
                    )}`}
                  >
                    {reservation.status}
                  </span>

                </div>

                {/* Reservation Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 pt-5 border-t border-red-100">

                  {/* Table */}
                  <div>
                    <p className="text-sm text-gray-500">
                      Table
                    </p>

                    <p className="font-semibold text-gray-900 mt-1">
                      Table #{reservation.table_id}
                    </p>
                  </div>

                  {/* Guests */}
                  <div>
                    <p className="text-sm text-gray-500">
                      Guests
                    </p>

                    <p className="font-semibold text-gray-900 mt-1">
                      {reservation.guests}
                    </p>
                  </div>

                  {/* Action */}
                  <div className="sm:text-right">

                    {(
                      reservation.status === "PENDING" ||
                      reservation.status === "CONFIRMED"
                    ) ? (
                      <button
                        type="button"
                        onClick={() =>
                          cancelReservation(
                            reservation.id
                          )
                        }
                        disabled={
                          cancellingId === reservation.id
                        }
                        className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {cancellingId === reservation.id
                          ? "Cancelling..."
                          : "Cancel Reservation"}
                      </button>
                    ) : (
                      <span className="text-sm text-gray-500">
                        No actions available
                      </span>
                    )}

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

export default Reservations;