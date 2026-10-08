import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../../api/axios";

function Checkout() {
  const navigate = useNavigate();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  const fetchCart = async () => {
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
    fetchCart();
  }, []);

  const placeOrder = async () => {
    try {
      setPlacingOrder(true);

      // Step 1: Place order
      const orderResponse = await API.post("/orders");

      const order = orderResponse.data;

      // Step 2: Create Stripe checkout session
      const paymentResponse = await API.post(
        "/payments/create-checkout-session",
        null,
        {
          params: {
            order_id: order.id,
          },
        }
      );

      const checkoutUrl =
        paymentResponse.data.checkout_url;

      if (!checkoutUrl) {
        toast.error(
          "Stripe checkout URL was not received"
        );
        return;
      }

      // Step 3: Redirect to Stripe Checkout
      window.location.href = checkoutUrl;

    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to place order"
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white px-4 py-8">
        <div className="max-w-5xl mx-auto text-center py-16">
          <p className="text-red-600 font-semibold">
            Loading checkout...
          </p>
        </div>
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-white px-4 py-8">
        <div className="max-w-5xl mx-auto">

          <div className="text-center py-16 border border-red-200 rounded-xl">
            <h1 className="text-2xl font-bold text-red-600">
              Your cart is empty
            </h1>

            <p className="text-gray-600 mt-2">
              Add some food items before checkout.
            </p>

            <Link
              to="/menu"
              className="inline-block mt-5 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Browse Menu
            </Link>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 py-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-red-600">
            Checkout
          </h1>

          <p className="text-gray-600 mt-1">
            Review your order and continue to payment
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Order Items */}
          <div className="lg:col-span-2 border border-red-200 rounded-xl p-6">

            <h2 className="text-xl font-bold text-red-600 mb-5">
              Order Summary
            </h2>

            <div className="space-y-4">

              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="border border-red-100 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between gap-4">

                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Food Item #{item.menu_item_id}
                      </h3>

                      <p className="text-sm text-gray-500 mt-1">
                        Quantity: {item.quantity}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        Item
                      </p>

                      <p className="font-bold text-red-600">
                        ₹
                        {(
                          Number(item.unit_price) *
                          item.quantity
                        ).toFixed(2)}
                      </p>
                    </div>

                  </div>
                </div>
              ))}

            </div>
          </div>

          {/* Payment Summary */}
          <div className="border border-red-200 rounded-xl p-6 h-fit">

            <h2 className="text-xl font-bold text-red-600 mb-5">
              Payment Summary
            </h2>

            <div className="flex justify-between text-gray-600">
              <span>Total Items</span>
              <span>{cart.total_quantity}</span>
            </div>

            <div className="border-t border-red-100 mt-4 pt-4">
              <div className="flex justify-between items-center">

                <span className="font-semibold text-gray-900">
                  Total Amount
                </span>

                <span className="text-2xl font-bold text-red-600">
                  ₹{Number(cart.total_amount).toFixed(2)}
                </span>

              </div>
            </div>

            <button
              type="button"
              onClick={placeOrder}
              disabled={placingOrder}
              className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {placingOrder
                ? "Processing..."
                : "Place Order & Pay"}
            </button>

            <Link
              to="/cart"
              className="block w-full mt-3 border border-red-600 text-red-600 hover:bg-red-50 text-center py-3 rounded-lg font-semibold"
            >
              Back to Cart
            </Link>

          </div>

        </div>
      </div>
    </div>
  );
}

export default Checkout;