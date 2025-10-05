import React, { useState } from "react";
import CustomerFeedbackModal from "../components/CustomerFeedbackModal";

const FeedbackButton = ({ orderNo, onOpen }) => {
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <>
      <button
        className="d-flex align-items-center"
        style={{
          border: "2px solid #222",
          background: "#fff",
          color: "#222",
          borderRadius: 8,
          padding: "8px 18px",
          fontWeight: 600,
          fontSize: 16,
          boxShadow: "none",
          outline: "none",
          cursor: "pointer",
          gap: 8,
        }}
        onClick={() => {
          if (typeof onOpen === 'function') onOpen();
          setShowFeedback(true);
        }}
      >
        <i
          className="fa-solid fa-star"
          style={{ color: "#FFD600", fontSize: 20, marginRight: 8 }}
        ></i>
        <span style={{ color: "#222" }}>Feedback</span>
      </button>
      <CustomerFeedbackModal
        show={showFeedback}
        onClose={() => setShowFeedback(false)}
        orderNo={orderNo}
      />
    </>
  );
};

export default FeedbackButton;
