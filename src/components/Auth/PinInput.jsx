import PropTypes from "prop-types";
import { sanitizePin } from "../../utils/authValidation";
import { PIN_LENGTH } from "../../constants/auth";

const PinInput = ({
  id,
  label,
  value,
  onChange,
  disabled = false,
  error = "",
  autoComplete = "off",
  placeholder = "Enter 4 digit PIN",
}) => (
  <div className="mb-3">
    {label ? (
      <label htmlFor={id} className="block mb-2 text-sm font-medium text-[var(--title)]">
        {label}
      </label>
    ) : null}
    <input
      id={id}
      type="password"
      inputMode="numeric"
      pattern="[0-9]*"
      maxLength={PIN_LENGTH}
      autoComplete={autoComplete}
      className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg outline-none focus:border-[var(--primary)] transition-colors tracking-[0.35em] text-center font-semibold"
      value={value}
      onChange={(e) => onChange(sanitizePin(e.target.value))}
      placeholder={placeholder}
      required
      disabled={disabled}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${id}-error` : undefined}
    />
    {error ? (
      <small id={`${id}-error`} className="text-red-600 text-xs mt-1 block">
        {error}
      </small>
    ) : (
      <small className="text-[#6c757d] text-xs">4 digit numeric PIN</small>
    )}
  </div>
);

PinInput.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  autoComplete: PropTypes.string,
  placeholder: PropTypes.string,
};

export default PinInput;
