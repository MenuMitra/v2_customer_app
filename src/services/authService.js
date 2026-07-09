import axios from "axios";
import { ENV } from "../config";
import {
  LOGIN_CHECK_ENDPOINT,
  SIGNUP_ENDPOINT,
  VERIFY_PIN_ENDPOINT,
} from "../constants/auth";
import { sanitizePin } from "../utils/authValidation";
import { getAppVersion, getDeviceInfo } from "../utils/deviceInfo";

const SESSION_ERROR_PATTERN = /no active login session/i;

export const UNREGISTERED_MOBILE_MESSAGE =
  "This mobile number is not registered. Please register to continue.";

const UNREGISTERED_MOBILE_PATTERNS = [
  /not registered/i,
  /number not register/i,
  /mobile.*not found/i,
  /user.*not found/i,
  /does not exist/i,
  /no account/i,
  /sign up first/i,
  /signup first/i,
  /create an account/i,
];

const normalizeAuthResponseText = (value) => {
  if (value == null) return "";
  if (typeof value === "string") return value.toLowerCase();
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === "string"
          ? item
          : item?.msg || item?.message || item?.detail || ""
      )
      .join(" ")
      .toLowerCase();
  }
  if (typeof value === "object") {
    return [value.detail, value.message, value.msg, value.error]
      .filter((part) => typeof part === "string")
      .join(" ")
      .toLowerCase();
  }
  return String(value).toLowerCase();
};

export const isRegisteredForLogin = (data) => {
  const role = String(data?.role ?? "").toLowerCase().trim();
  return role === "customer" || role === "admin";
};

export const isUnregisteredMobileError = (err) => {
  if (!err?.response) return false;

  const status = err.response.status;
  const data = err.response.data ?? {};
  const combined = [
    normalizeAuthResponseText(data.detail),
    normalizeAuthResponseText(data.message),
    normalizeAuthResponseText(data.error),
  ].join(" ");

  if (UNREGISTERED_MOBILE_PATTERNS.some((pattern) => pattern.test(combined))) {
    return true;
  }

  if (status === 404 && /mobile|user|number|account/i.test(combined)) {
    return true;
  }

  return false;
};

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

const buildLoginCheckPayload = ({ mobile, version, device = getDeviceInfo() }) => ({
  mobile,
  version: version || getAppVersion(),
  app_type: "customer",
  device_id: device.device_id,
  device_model: device.device_model,
  device_type: device.device_type,
});

const buildVerifyPinPayload = (payload) => ({
  mobile: payload.mobile,
  pin: sanitizePin(payload.pin),
  app_type: "customer",
  device_id: payload.device_id,
  device_model: payload.device_model,
  device_type: payload.device_type,
});

/** Creates a device-bound login session required before verify_pin. */
export const checkMobileRegistration = (payload) =>
  authApi.post(
    LOGIN_CHECK_ENDPOINT,
    buildLoginCheckPayload({
      mobile: payload.mobile,
      version: payload.version,
      device: payload.device,
    })
  );

/**
 * PIN login — device fields must match the prior /common/login call.
 * @param {{ mobile: string, pin: string, device_id: string, device_model: string, device_type: string }} payload
 */
export const verifyPinLogin = async (payload) => {
  const body = buildVerifyPinPayload(payload);

  try {
    return await authApi.post(VERIFY_PIN_ENDPOINT, body);
  } catch (err) {
    const message = err.response?.data?.message || "";
    if (!SESSION_ERROR_PATTERN.test(message)) throw err;

    await checkMobileRegistration({
      mobile: payload.mobile,
      device: {
        device_id: payload.device_id,
        device_model: payload.device_model,
        device_type: payload.device_type,
      },
    });

    return authApi.post(VERIFY_PIN_ENDPOINT, body);
  }
};

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
  const combined = [message, detail].filter((v) => typeof v === "string").join(" ");

  if (SESSION_ERROR_PATTERN.test(combined)) {
    return "Login session expired. Please enter your mobile number again.";
  }
  if (typeof detail === "string" && detail.trim()) return detail;
  if (typeof message === "string" && message.trim()) return message;

  if (status === 409) return "This mobile number is already registered.";
  if (status === 400) return "Invalid request. Please check your details.";
  if (status >= 500) return "Server error. Please try again later.";

  return fallback;
};

export default authApi;
