import PropTypes from "prop-types";

const PhoneNumberInput = ({
  value,
  onChange,
  inputRef,
  disabled = false,
  highlighted = false,
  id = "phone-number",
}) => (
  <div
    className="flex w-full items-stretch border border-[var(--border-color)] rounded-lg overflow-hidden transition-colors focus-within:border-[var(--primary)]"
    style={
      highlighted
        ? {
            borderColor: "#66ccd4",
            backgroundColor: "rgba(102, 204, 212, 0.05)",
            boxShadow: "0 0 0 2px rgba(102, 204, 212, 0.3)",
            transition: "all 0.3s ease",
          }
        : undefined
    }
  >
    <span className="inline-flex items-center px-3 text-sm text-[#495057] bg-[#e9ecef] border-r border-[var(--border-color)] shrink-0">
      +91
    </span>
    <input
      id={id}
      ref={inputRef}
      type="tel"
      className="flex-1 min-w-0 px-3 py-2 border-0 outline-none bg-transparent text-sm text-[#222121]"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Enter your phone number"
      pattern="^[6-9][0-9]{9}$"
      maxLength="10"
      required
      disabled={disabled}
    />
  </div>
);

PhoneNumberInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  inputRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.any }),
  ]),
  disabled: PropTypes.bool,
  highlighted: PropTypes.bool,
  id: PropTypes.string,
};

export default PhoneNumberInput;
