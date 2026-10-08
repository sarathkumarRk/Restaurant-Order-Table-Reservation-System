import { Link } from "react-router-dom";

function PaymentSuccess() {
  return (
    <div className="min-h-screen bg-white px-4 py-8">
      <div className="max-w-xl mx-auto">

        <div className="border border-red-200 rounded-xl p-8 text-center">

          {/* Success Icon */}
          <div className="w-20 h-20 mx-auto rounded-full bg-red-600 flex items-center justify-center">
            <span className="text-white text-4xl font-bold">
              ✓
            </span>
          </div>

          {/* Message */}
          <h1 className="text-3xl font-bold text-red-600 mt-6">
            Payment Successful
          </h1>

          <p className="text-gray-600 mt-3">
            Your payment has been completed successfully.
          </p>

          <p className="text-gray-500 text-sm mt-2">
            Your order will be confirmed after Stripe webhook
            verification.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mt-7">

            <Link
              to="/orders"
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold text-center"
            >
              View My Orders
            </Link>

            <Link
              to="/menu"
              className="flex-1 border border-red-600 text-red-600 hover:bg-red-50 py-3 rounded-lg font-semibold text-center"
            >
              Continue Shopping
            </Link>

          </div>

        </div>

      </div>
    </div>
  );
}

export default PaymentSuccess;