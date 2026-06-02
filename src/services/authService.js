import axios from "axios";
import { ENV } from "../config";
import {
  LOGIN_CHECK_ENDPOINT,
  SIGNUP_ENDPOINT,
  VERIFY_PIN_ENDPOINT,
} from "../constants/auth";
import { sanitizePin } from "../utils/authValidation";

const authApi = axios.create({
  baseURL: ENV.V2_COMMON_BASE,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 30000,
});

/**
 * @typedef {{ mobile: string, name: string, pin: string }} SignupPayload
 */

/** @param {SignupPayload} payload */
export const accountSignup = (payload) =>
  authApi.post(SIGNUP_ENDPOINT, {
    mobile: payload.mobile,
    name: payload.name.trim(),
    pin: sanitizePin(payload.pin),
  });

/** @param {{ mobile: string, version?: string }} payload */
export const checkMobileRegistration = (payload) =>
  authApi.post(LOGIN_CHECK_ENDPOINT, {
    mobile: payload.mobile,
    version: payload.version,
    app_type: "customer",
  });

/**
 * PIN login — same device fields as legacy OTP verify.
 * @param {{ mobile: string, pin: string, device_id: string, device_model: string, device_type: string }} payload
 */
export const verifyPinLogin = (payload) =>
  authApi.post(VERIFY_PIN_ENDPOINT, {
    mobile: payload.mobile,
    pin: sanitizePin(payload.pin),
    app_type: "customer",
    device_id: payload.device_id,
    device_model: payload.device_model,
    device_type: payload.device_type,
  });

const isNetworkError = (err) =>
  !err.response &&
  (err.code === "ECONNABORTED" ||
    err.code === "ERR_NETWORK" ||
    err.message === "Network Error");

export const getAuthErrorMessage = (err, fallback = "Something went wrong. Please try again.") => {
  if (isNetworkError(err)) {
    if (err.code === "ECONNABORTED") {
      return "Request timed out. Check your connection and try again.";
    }
    return "Network error. Please check your internet connection.";
  }

  const status = err.response?.status;
  const detail = err.response?.data?.detail;
  const message = err.response?.data?.message;

  if (typeof detail === "string" && detail.trim()) return detail;
  if (typeof message === "string" && message.trim()) return message;

  if (status === 409) return "This mobile number is already registered.";
  if (status === 400) return "Invalid request. Please check your details.";
  if (status >= 500) return "Server error. Please try again later.";

  return fallback;
};

export default authApi;
