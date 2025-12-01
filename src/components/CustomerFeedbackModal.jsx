import React, { useState, useEffect } from "react";
import axios from "axios";
import { useToast } from "../components/Toast/useToast";

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
      await axios.post("https://ghanish.in/v2/common/customer_feedback", {
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
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{
        background: "rgba(17, 25, 40, 0.35)",
        backdropFilter: "blur(10px) saturate(160%)",
        WebkitBackdropFilter: "blur(10px) saturate(160%)",
      }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div
            className="modal-header d-flex align-items-center justify-content-between"
            style={{ paddingRight: 8 }}
          >
            <h5 className="modal-title mb-0">Customer Feedback</h5>
            <button
              type="button"
              className="btn"
              style={{
                background: "none",
                border: "none",
                fontSize: 24,
                color: "#222",
                boxShadow: "none",
                outline: "none",
                padding: 0,
              }}
              onClick={onClose}
              aria-label="Close"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">

              <div className="mb-2">
                <label className="form-label">Customer Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="customer_name"
                  value={form.customer_name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                />
              </div>
              <div className="mb-2">
                <label className="form-label">Mobile</label>
                <input
                  type="text"
                  className="form-control"
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
                <label className="form-label">
                  <span className="text-danger">*</span>Feedback
                </label>
                <textarea
                  className="form-control"
                  name="feedback_description"
                  value={form.feedback_description}
                  onChange={handleChange}
                  required
                  rows={3}
                  placeholder="Write your feedback here..."
                />
              </div>
              <div className="mb-2">
                <label className="form-label">
                  <span className="text-danger">*</span>Rating
                </label>
                <div
                  style={{
                    display: "flex",
                    gap: 4,
                    fontSize: 24,
                    position: "relative",
                  }}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div
                      key={n}
                      style={{
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      {/* Show label above the selected star */}
                      {form.feedback_rating === n && (
                        <span
                          style={{
                            position: "absolute",
                            top: -22,
                            left: "50%",
                            transform: "translateX(-50%)",
                            fontSize: 12,
                            color: "#666",
                            fontWeight: 500,
                            whiteSpace: "nowrap",
                            pointerEvents: "none",
                            zIndex: 1,
                          }}
                        >
                          {ratingLabels[n - 1]}
                        </span>
                      )}
                      <i
                        className={
                          n <= Number(form.feedback_rating)
                            ? "fa-solid fa-star"
                            : "fa-regular fa-star"
                        }
                        style={{
                          color:
                            n <= Number(form.feedback_rating)
                              ? "#FFD600"
                              : "#ccc",
                          cursor: "pointer",
                          transition: "color 0.2s",
                        }}
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
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Close
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit Feedback"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomerFeedbackModal;
