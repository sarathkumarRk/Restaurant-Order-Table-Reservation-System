import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../../api/axios";

function CreateReservation() {
  const navigate = useNavigate();

  const [reservationDate, setReservationDate] = useState("");
  const [guests, setGuests] = useState("");
  const [availableTables, setAvailableTables] = useState([]);

  const [loadingTables, setLoadingTables] = useState(false);
  const [creatingReservation, setCreatingReservation] = useState(false);

  const getAvailableTables = async () => {
    if (!reservationDate) {
      toast.error("Please select reservation date and time");
      return;
    }

    if (!guests || Number(guests) <= 0) {
      toast.error("Guests must be greater than 0");
      return;
    }

    const selectedDate = new Date(reservationDate);

    if (selectedDate <= new Date()) {
      toast.error("Reservation date must be in the future");
      return;
    }

    try {
      setLoadingTables(true);
      setAvailableTables([]);

      const response = await API.get(
        "/reservations/available-tables",
        {
          params: {
            reservation_date: selectedDate.toISOString(),
            guests: Number(guests),
          },
        }
      );

      setAvailableTables(response.data);

      if (response.data.length === 0) {
        toast.info("No tables available for this time");
      } else {
        toast.success(
          `${response.data.length} table(s) available`
        );
      }
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to find available tables"
      );
    } finally {
      setLoadingTables(false);
    }
  };

  const createReservation = async (tableId) => {
    if (!reservationDate) {
      toast.error("Please select reservation date and time");
      return;
    }

    if (!guests || Number(guests) <= 0) {
      toast.error("Guests must be greater than 0");
      return;
    }

    try {
      setCreatingReservation(true);

      const selectedDate = new Date(reservationDate);

      await API.post("/reservations", {
        table_id: tableId,
        reservation_date: selectedDate.toISOString(),
        guests: Number(guests),
      });

      toast.success(
        "Reservation created successfully"
      );

      navigate("/reservations");
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to create reservation"
      );
    } finally {
      setCreatingReservation(false);
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 py-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">

          <div>
            <h1 className="text-3xl font-bold text-red-600">
              Create Reservation
            </h1>

            <p className="text-gray-600 mt-1">
              Choose your date, time and number of guests
            </p>
          </div>

          <Link
            to="/reservations"
            className="border border-red-600 text-red-600 hover:bg-red-50 px-5 py-3 rounded-lg font-semibold text-center"
          >
            My Reservations
          </Link>

        </div>

        {/* Reservation Form */}
        <div className="border border-red-200 rounded-xl p-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Date & Time */}
            <div>
              <label className="block text-sm font-medium text-red-600 mb-2">
                Reservation Date & Time
              </label>

              <input
                type="datetime-local"
                value={reservationDate}
                onChange={(e) => {
                  setReservationDate(e.target.value);
                  setAvailableTables([]);
                }}
                className="w-full px-4 py-3 border border-red-300 rounded-lg outline-none focus:border-red-600"
              />
            </div>

            {/* Guests */}
            <div>
              <label className="block text-sm font-medium text-red-600 mb-2">
                Number of Guests
              </label>

              <input
                type="number"
                min="1"
                value={guests}
                onChange={(e) => {
                  setGuests(e.target.value);
                  setAvailableTables([]);
                }}
                placeholder="Example: 4"
                className="w-full px-4 py-3 border border-red-300 rounded-lg outline-none focus:border-red-600"
              />
            </div>

          </div>

          {/* Find Tables */}
          <button
            type="button"
            onClick={getAvailableTables}
            disabled={loadingTables}
            className="mt-6 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingTables
              ? "Checking..."
              : "Find Available Tables"}
          </button>

        </div>

        {/* Available Tables */}
        <div className="mt-8">

          <h2 className="text-2xl font-bold text-red-600 mb-5">
            Available Tables
          </h2>

          {availableTables.length === 0 ? (
            <div className="border border-red-200 rounded-xl p-8 text-center">
              <p className="text-gray-600">
                Select a date, time and number of guests to
                find available tables.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

              {availableTables.map((table) => (
                <div
                  key={table.id}
                  className="border border-red-200 rounded-xl p-5"
                >

                  <h3 className="text-xl font-bold text-red-600">
                    Table {table.table_number}
                  </h3>

                  <p className="text-gray-600 mt-2">
                    Capacity: {table.capacity} guests
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      createReservation(table.id)
                    }
                    disabled={creatingReservation}
                    className="w-full mt-5 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingReservation
                      ? "Booking..."
                      : "Book This Table"}
                  </button>

                </div>
              ))}

            </div>
          )}

        </div>

      </div>
    </div>
  );
}

export default CreateReservation;