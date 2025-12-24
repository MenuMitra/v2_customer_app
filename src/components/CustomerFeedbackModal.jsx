import { useState, useEffect } from "react";
import axios from "axios";
import { useToast } from "../components/Toast/useToast";
import {ENV} from '../config';

const CustomerFeedbackModal = ({ show, onClose, orderNo }) => {
  const toast = useToast();
  const [form, setForm] = useState({
    order_number: "",
    customer_name: "",
    mobile: "",
    feedback_description: "",
    feedback_rating: "",
    app_source: "customer_app",
  });
  const [loading, setLoading] = useState(false);

  // Update form when orderNo prop changes
  useEffect(() => {
    if (orderNo) {
      setForm(prev => ({ ...prev, order_number: orderNo }));
    }
  }, [orderNo]);

  if (!show) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "customer_name") {
      // Only allow letters and spaces
      if (/^[A-Za-z\s]*$/.test(value)) {
        setForm((prev) => ({ ...prev, [name]: value }));
      }
    } else if (name === "mobile") {
      // Allow empty value for clearing the input
      if (value === "") {
        setForm((prev) => ({ ...prev, [name]: "" }));
        return;
      }

      // Remove any non-digit characters
      const numbersOnly = value.replace(/\D/g, "");

      // Check if first digit is valid (6-9)
      if (numbersOnly.length > 0) {
        const firstDigit = parseInt(numbersOnly[0]);
        if (firstDigit < 6) {
          // Clear input if starts with 0-5
          setForm((prev) => ({ ...prev, [name]: "" }));
          return;
        }
      }

      // Limit to 10 digits and validate format
      if (/^[6-9]\d{0,9}$/.test(numbersOnly)) {
        setForm((prev) => ({ ...prev, [name]: numbersOnly }));
      }
    } else if (name === "order_number") {
      // Allow empty value for clearing the input
      if (value === "") {
        setForm((prev) => ({ ...prev, [name]: "" }));
        return;
      }

      // Remove any non-digit characters
      const numbersOnly = value.replace(/\D/g, "");

      // Only update if the value contains 6-12 digits
      if (/^\d{0,12}$/.test(numbersOnly)) {
        setForm((prev) => ({ ...prev, [name]: numbersOnly }));
      }
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Add order number validation
    // if (form.order_number && form.order_number.length < 6) {
    //   setError("Order number must be at least 6 digits.");
    //   return;
    // }
    const storedUser = localStorage.getItem("adminData")
    const parseStoredUser = storedUser ?  JSON.parse(storedUser) : null;
    const user_id = parseStoredUser?.user_id

    if (!form.feedback_description.trim() || !form.feedback_rating) {
      toast.error("Feedback and rating are required.", "Validation");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${ENV.V2_COMMON_BASE}/common/customer_feedback`, {
        ...form,
        user_id,
        feedback_rating: Number(form.feedback_rating),
      });
      toast.success("Thank you for your feedback!", "Success");
      setTimeout(() => { 
        if (response?.status === 201) {
          setForm((prev) => ({
            ...prev,
            customer_name: "",
            mobile: "",
            feedback_description: "",
            feedback_rating: "",
          }));
        }
        onClose();
      }, 1500);
    } catch (err) {
      toast.error("Failed to submit feedback. Please try again.", "Error");
    } finally {
      setLoading(false);
    }
  };

  const ratingLabels = ["Bad", "Poor", "Average", "Good", "Excellent"];

  return (
    <>
      <style>{`
        .feedback-modal-backdrop {
          background: rgba(17, 25, 40, 0.35);
          backdrop-filter: blur(10px) saturate(160%);
          -webkit-backdrop-filter: blur(10px) saturate(160%);
        }
      `}</style>
      <div
        className="feedback-modal-backdrop fixed inset-0 flex items-center justify-center z-[1055]"
        tabIndex="-1"
      >
      <div className="w-full max-w-[500px] mx-4">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 pr-2">
            <h5 className="text-xl font-semibold mb-0">Customer Feedback</h5>
            <button
              type="button"
              className="bg-transparent border-0 text-2xl text-[#222] p-0 cursor-pointer hover:text-gray-600 transition-colors"
              onClick={onClose}
              aria-label="Close"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="p-3">

              <div className="mb-2">
                <label className="block mb-2 text-sm font-medium text-gray-700">Customer Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  name="customer_name"
                  value={form.customer_name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                />
              </div>
              <div className="mb-2">
                <label className="block mb-2 text-sm font-medium text-gray-700">Mobile</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  name="mobile"
                  value={form.mobile}
                  onChange={handleChange}
                  placeholder="Enter your mobile number"
                />
              </div>
              {/* <div className="mb-2">
                <label className="form-label">Order Number</label>
                <input
                  type="text"
                  className="form-control"
                  name="order_number"
                  value={form.order_number}
                  onChange={handleChange}
                  placeholder="Enter your order number"
                />
              </div> */}
              <div className="mb-2">
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  <span className="text-red-600">*</span>Feedback
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  name="feedback_description"
                  value={form.feedback_description}
                  onChange={handleChange}
                  required
                  rows={3}
                  placeholder="Write your feedback here..."
                />
              </div>
              <div className="mb-2">
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  <span className="text-red-600">*</span>Rating
                </label>
                <div className="flex gap-1 text-2xl relative">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div
                      key={n}
                      className="relative flex flex-col items-center"
                    >
                      {/* Show label above the selected star */}
                      {form.feedback_rating === n && (
                        <span className="absolute -top-[22px] left-1/2 -translate-x-1/2 text-xs text-gray-600 font-medium whitespace-nowrap pointer-events-none z-10">
                          {ratingLabels[n - 1]}
                        </span>
                      )}
                      <i
                        className={`${
                          n <= Number(form.feedback_rating)
                            ? "fa-solid fa-star text-[#FFD600]"
                            : "fa-regular fa-star text-[#ccc]"
                        } cursor-pointer transition-colors duration-200`}
                        onClick={() =>
                          setForm((prev) => ({ ...prev, feedback_rating: n }))
                        }
                        aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
                      ></i>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-4 py-2 border-t border-gray-200">
              <button
                type="button"
                className="px-4 py-2 bg-gray-500 text-white rounded-3xl hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                onClick={onClose}
                disabled={loading}
              >
                Close
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-3xl hover:bg-primary-hover transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit Feedback"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </>
  );
};

export default CustomerFeedbackModal;
