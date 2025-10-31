import React from "react";

function ConfirmLogoutModal({ show, onCancel, onConfirm }) {
  if (!show) return null;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ backgroundColor: "rgba(0,0,0,0.35)", zIndex: 1050 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmLogoutTitle"
    >
      <div className="bg-white rounded-4 shadow" style={{ maxWidth: 420, width: "90%", border: "1px solid #f5c2c7" }}>
        <div className="p-3 text-center">
          <h5 id="confirmLogoutTitle" className="mb-0 d-flex align-items-center justify-content-center gap-2">
            <i className="fa-solid fa-right-from-bracket" style={{ color: "#dc3545" }}></i>
            <span className="fw-bold" style={{ color: "#1f2937" }}>Confirm Logout</span>
          </h5>
        </div>
        <div className="px-4 pb-2 text-center">
          <p className="mb-0 fw-semibold" style={{ color: "#1f2937" }}>Are you sure you want to logout?</p>
        </div>
        <div className="d-flex justify-content-center gap-3 px-4 py-3">
          <button
            type="button"
            className="btn btn-outline-secondary px-4"
            style={{ color: "#374151", borderColor: "#d1d5db", backgroundColor: "transparent" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f0f0f0"; // light grey
              e.currentTarget.style.borderColor = "#cbd5e1"; // neutral border
              e.currentTarget.style.color = "#111827"; // darker text
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.borderColor = "#d1d5db";
              e.currentTarget.style.color = "#374151";
            }}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn px-4"
            style={{ backgroundColor: "#dc3545", color: "#fff" }}
            onClick={onConfirm}
          >
            <i className="fa-solid fa-right-from-bracket me-2"></i>
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmLogoutModal;


