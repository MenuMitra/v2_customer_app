function ConfirmLogoutModal({ show, onCancel, onConfirm }) {
  if (!show) return null;

  return (
    <div
      className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black/35 z-[1050]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmLogoutTitle"
    >
      <div className="bg-white rounded-2xl shadow-lg max-w-[420px] w-[90%] border border-[#f5c2c7]">
        <div className="p-3 text-center">
          <h5 id="confirmLogoutTitle" className="mb-0 flex items-center justify-center gap-2">
            <i className="fa-solid fa-right-from-bracket text-[#dc3545]"></i>
            <span className="font-bold text-[#1f2937]">Confirm Logout</span>
          </h5>
        </div>
        <div className="px-4 pb-2 text-center">
          <p className="mb-0 font-semibold text-[#1f2937]">Are you sure you want to logout?</p>
        </div>
        <div className="flex justify-center gap-3 px-4 py-3">
          <button
            type="button"
            className="px-4 py-2 text-[#374151] border border-[#d1d5db] bg-transparent rounded-3xl hover:bg-[#f0f0f0] hover:border-[#cbd5e1] hover:text-[#111827] transition-colors duration-200"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-[#dc3545] text-white rounded-3xl hover:bg-[#c82333] transition-colors duration-200"
            onClick={onConfirm}
          >
            <i className="fa-solid fa-right-from-bracket mr-2"></i>
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmLogoutModal;


