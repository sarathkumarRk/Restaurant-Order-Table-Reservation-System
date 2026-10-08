import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../../api/axios";

function MenuDetails() {
  const { menu_id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const fetchMenuItem = async () => {
    try {
      setLoading(true);

      const response = await API.get(`/menu/${menu_id}`);

      setItem(response.data);
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to load food item"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItem();
  }, [menu_id]);

  const addToCart = async () => {
    try {
      setAdding(true);

      await API.post("/cart/items", {
        menu_item_id: item.id,
        quantity: 1,
      });

      toast.success("Added to cart");

      navigate("/cart");
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to add item to cart"
      );
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white px-4 py-8">
        <div className="max-w-5xl mx-auto text-center py-16">
          <p className="text-red-600 font-semibold">
            Loading food details...
          </p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-white px-4 py-8">
        <div className="max-w-5xl mx-auto text-center py-16">

          <h1 className="text-2xl font-bold text-red-600">
            Food item not found
          </h1>

          <Link
            to="/menu"
            className="inline-block mt-5 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Back to Menu
          </Link>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 py-8">
      <div className="max-w-5xl mx-auto">

        {/* Top Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">

          <Link
            to="/menu"
            className="border border-red-600 text-red-600 hover:bg-red-50 px-5 py-3 rounded-lg font-semibold text-center"
          >
            ← Back to Menu
          </Link>

          <Link
            to="/cart"
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-lg font-semibold text-center"
          >
            View Cart
          </Link>

        </div>

        {/* Details */}
        <div className="border border-red-200 rounded-xl overflow-hidden">

          <div className="grid grid-cols-1 md:grid-cols-2">

            {/* Image */}
            <div className="h-80 md:h-full min-h-[320px] bg-red-50 flex items-center justify-center overflow-hidden">

              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-red-600 font-semibold">
                  No Image
                </span>
              )}

            </div>

            {/* Content */}
            <div className="p-6 md:p-8">

              <div className="flex items-start justify-between gap-4">

                <h1 className="text-3xl font-bold text-gray-900">
                  {item.name}
                </h1>

                <span className="text-2xl font-bold text-red-600 whitespace-nowrap">
                  ₹{Number(item.price).toFixed(2)}
                </span>

              </div>

              {/* Availability */}
              <div className="mt-5">

                {item.is_available ? (
                  <span className="inline-block px-3 py-1.5 rounded-full border border-red-200 bg-red-50 text-red-600 text-sm font-semibold">
                    Available
                  </span>
                ) : (
                  <span className="inline-block px-3 py-1.5 rounded-full border border-red-200 bg-red-50 text-red-400 text-sm font-semibold">
                    Unavailable
                  </span>
                )}

              </div>

              {/* Description */}
              <div className="mt-7">

                <h2 className="text-lg font-bold text-red-600">
                  Description
                </h2>

                <p className="text-gray-600 mt-2 leading-7">
                  {item.description ||
                    "No description available for this food item."}
                </p>

              </div>

              {/* Category */}
              {item.category_id && (
                <div className="mt-6">

                  <p className="text-sm text-gray-500">
                    Category ID
                  </p>

                  <p className="font-semibold mt-1">
                    {item.category_id}
                  </p>

                </div>
              )}

              {/* Action */}
              <button
                type="button"
                onClick={addToCart}
                disabled={
                  !item.is_available || adding
                }
                className="w-full mt-8 bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {adding
                  ? "Adding..."
                  : item.is_available
                  ? "Add to Cart"
                  : "Currently Unavailable"}
              </button>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default MenuDetails;