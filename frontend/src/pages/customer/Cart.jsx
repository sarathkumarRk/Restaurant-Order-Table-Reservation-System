import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../../api/axios";

function Cart() {
  const navigate = useNavigate();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  const getCart = async () => {
    try {
      setLoading(true);

      const response = await API.get("/cart");

      setCart(response.data);
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to load cart"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCart();
  }, []);

  const updateQuantity = async (itemId, quantity) => {
    if (quantity < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }

    try {
      const response = await API.put(
        `/cart/items/${itemId}`,
        {
          quantity: quantity,
        }
      );

      setCart(response.data);

      toast.success("Cart updated successfully");
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to update cart"
      );
    }
  };

  const removeItem = async (itemId) => {
    try {
      const response = await API.delete(
        `/cart/items/${itemId}`
      );

      setCart(response.data);

      toast.success("Item removed from cart");
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to remove item"
      );
    }
  };

  const clearCart = async () => {
    try {
      await API.delete("/cart");

      toast.success("Cart cleared successfully");

      getCart();
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to clear cart"
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-red-600 font-semibold">
          Loading cart...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 py-8">
      <div className="max-w-5xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-red-600">
            My Cart
          </h1>

          <Link
            to="/menu"
            className="text-red-600 font-semibold hover:underline"
          >
            Continue Shopping
          </Link>
        </div>

        {!cart || cart.items.length === 0 ? (
          <div className="border border-red-200 rounded-xl p-10 text-center">
            <h2 className="text-xl font-semibold text-red-600">
              Your cart is empty
            </h2>

            <p className="text-gray-600 mt-2 mb-6">
              Add some food items to your cart.
            </p>

            <Link
              to="/menu"
              className="inline-block bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Browse Menu
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            <div className="lg:col-span-2 space-y-4">

              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="border border-red-200 rounded-xl p-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                    <div>
                      <h2 className="font-semibold text-lg">
                        Food Item #{item.menu_item_id}
                      </h2>

                      <p className="text-gray-600 mt-1">
                        ₹{Number(item.unit_price).toFixed(2)}
                      </p>

                      <p className="text-red-600 font-semibold mt-1">
                        Subtotal: ₹
                        {Number(item.subtotal).toFixed(2)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">

                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            item.quantity - 1
                          )
                        }
                        className="w-9 h-9 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                      >
                        -
                      </button>

                      <span className="w-8 text-center font-semibold">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            item.quantity + 1
                          )
                        }
                        className="w-9 h-9 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                      >
                        +
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          removeItem(item.id)
                        }
                        className="ml-2 text-red-600 font-semibold hover:underline"
                      >
                        Remove
                      </button>

                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={clearCart}
                className="text-red-600 font-semibold hover:underline"
              >
                Clear Cart
              </button>
            </div>

            <div className="border border-red-200 rounded-xl p-6 h-fit">

              <h2 className="text-xl font-bold text-red-600 mb-5">
                Order Summary
              </h2>

              <div className="flex justify-between mb-3">
                <span className="text-gray-600">
                  Total Items
                </span>

                <span className="font-semibold">
                  {cart.total_quantity}
                </span>
              </div>

              <div className="border-t border-red-100 pt-4 flex justify-between">
                <span className="font-semibold">
                  Total Amount
                </span>

                <span className="text-xl font-bold text-red-600">
                  ₹{Number(cart.total_amount).toFixed(2)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => navigate("/checkout")}
                className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold"
              >
                Proceed to Checkout
              </button>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default Cart;