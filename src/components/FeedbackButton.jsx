import { useState } from "react";
import CustomerFeedbackModal from "../components/CustomerFeedbackModal";

const FeedbackButton = ({ orderNo, onOpen }) => {
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <>
      <button
        className="flex items-center border-2 border-[#222] bg-white text-[#222] rounded-lg px-[18px] py-2 font-semibold text-base shadow-none outline-none cursor-pointer gap-2 hover:bg-gray-50 transition-colors duration-200"
        onClick={() => {
          if (typeof onOpen === 'function') onOpen();
          setShowFeedback(true);
        }}
      >
        <i className="fa-solid fa-star text-[#FFD600] text-xl mr-2"></i>
        <span className="text-[#222]">Feedback</span>
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
