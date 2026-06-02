import { MOBILE_REGEX, PIN_REGEX } from "../constants/auth";

/** Strip non-digits and cap at 4 characters for PIN fields. */
export const sanitizePin = (value) =>
  String(value ?? "")
    .replace(/\D/g, "")
    .trim()
    .slice(0, 4);

export const validatePin = (pin) => {
  const normalized = sanitizePin(pin);
  if (!normalized) return "PIN is required";
  if (!PIN_REGEX.test(normalized)) return "PIN must be 4 digits";
  return null;
};

export const validateMobile = (mobile) => {
  const normalized = String(mobile ?? "").replace(/\D/g, "");
  if (!normalized) return "Phone number is required";
  if (!MOBILE_REGEX.test(normalized)) return "Enter a valid 10 digit mobile number";
  return null;
};

export const validateSignupName = (name) => {
  const trimmed = String(name ?? "").trim();
  if (!trimmed) return "Full name is required";
  if (!/^[a-zA-Z ]+$/.test(trimmed)) return "Name can only contain letters and spaces";
  return null;
};
