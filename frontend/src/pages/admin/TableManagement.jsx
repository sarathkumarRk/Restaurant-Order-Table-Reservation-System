import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import API from "../../api/axios";

function TableManagement() {
  const [tables, setTables] = useState([]);
  const [tableNumber, setTableNumber] = useState("");
  const [capacity, setCapacity] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTables = async () => {
    try {
      const response = await API.get("/tables");
      setTables(response.data);
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Failed to fetch tables"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const resetForm = () => {
    setTableNumber("");
    setCapacity("");
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!tableNumber || !capacity) {
      toast.error("Please enter table number and capacity");
      return;
    }

    try {
      const data = {
        table_number: Number(tableNumber),
        capacity: Number(capacity),
      };

      if (editingId) {
        await API.put(`/tables/${editingId}`, data);
        toast.success("Table updated successfully");
      } else {
        await API.post("/tables", data);
        toast.success("Table created successfully");
      }

      resetForm();
      fetchTables();
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Failed to save table"
      );
    }
  };

  const handleEdit = (table) => {
    setEditingId(table.id);
    setTableNumber(table.table_number);
    setCapacity(table.capacity);
  };

  const handleDelete = async (tableId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this table?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      await API.delete(`/tables/${tableId}`);

      toast.success("Table deleted successfully");

      if (editingId === tableId) {
        resetForm();
      }

      fetchTables();
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Failed to delete table"
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600 text-lg">
          Loading tables...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">

        <h1 className="text-3xl font-bold text-red-600 mb-6">
          Table Management
        </h1>

        {/* Create / Edit Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? "Edit Table" : "Add New Table"}
          </h2>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div>
              <label className="block text-sm font-medium mb-1">
                Table Number
              </label>

              <input
                type="number"
                min="1"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="Enter table number"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Capacity
              </label>

              <input
                type="number"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="Enter capacity"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="bg-red-600 text-white px-5 py-2 rounded hover:bg-red-700"
              >
                {editingId ? "Update Table" : "Add Table"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="border border-red-600 text-red-600 px-5 py-2 rounded hover:bg-red-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Tables List */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-red-600 text-white">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Table Number</th>
                <th className="px-4 py-3">Capacity</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {tables.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No tables found.
                  </td>
                </tr>
              ) : (
                tables.map((table) => (
                  <tr
                    key={table.id}
                    className="border-b hover:bg-red-50"
                  >
                    <td className="px-4 py-4">
                      #{table.id}
                    </td>

                    <td className="px-4 py-4 font-medium">
                      Table {table.table_number}
                    </td>

                    <td className="px-4 py-4">
                      {table.capacity} persons
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(table)}
                          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(table.id)}
                          className="border border-red-600 text-red-600 px-4 py-2 rounded hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

export default TableManagement;