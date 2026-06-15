import {
  browserVersion,
  deviceType,
  mobileModel,
  mobileVendor,
  osName,
  osVersion,
} from "react-device-detect";

const DEVICE_ID_KEY = "mm_device_id";
const APP_VERSION = "2.3.0";

const generateDeviceId = () => {
  const stored = localStorage.getItem(DEVICE_ID_KEY);
  if (stored && stored.length >= 5) return stored;

  const characteristics = [
    navigator.userAgent,
    screen.height,
    screen.width,
    navigator.language,
    new Date().getTimezoneOffset(),
  ].join("|");

  let hash = 0;
  for (let i = 0; i < characteristics.length; i++) {
    const char = characteristics.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash &= hash;
  }

  const deviceId = `${Date.now()}${Math.abs(hash)}`;
  localStorage.setItem(DEVICE_ID_KEY, deviceId);
  return deviceId;
};

const getBrowserInfo = () => {
  const ua = navigator.userAgent;
  if (navigator.brave?.isBrave || ua.includes("Brave")) return "Brave";
  if (ua.includes("Chrome") && !ua.includes("Edg") && !ua.includes("OPR")) {
    return "Chrome";
  }
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("OPR") || ua.includes("Opera")) return "Opera";
  if (ua.includes("MSIE") || ua.includes("Trident/")) return "Internet Explorer";
  return "Browser";
};

const getOSInfo = () => {
  if (osName === "none" || !osName) {
    const ua = navigator.userAgent;
    if (ua.includes("Windows")) return "Windows";
    if (ua.includes("Mac")) return "MacOS";
    if (ua.includes("Linux")) return "Linux";
    if (ua.includes("Android")) return "Android";
    if (ua.includes("iOS") || ua.includes("iPhone") || ua.includes("iPad")) {
      return "iOS";
    }
    return "Unknown OS";
  }
  return osName === "Mac OS" ? "MacOS" : osName;
};

const getReadableDeviceType = () => {
  const ua = navigator.userAgent;
  if (
    deviceType === "mobile" ||
    /Mobile|Android|iPhone|iPod/i.test(ua) ||
    (mobileModel !== "none" && !ua.includes("iPad"))
  ) {
    return "Mobile Phone";
  }
  if (
    deviceType === "tablet" ||
    /iPad|Tablet|PlayBook/i.test(ua) ||
    (ua.includes("Android") && !ua.includes("Mobile"))
  ) {
    return "Tablet";
  }
  return "Desktop";
};

/** Device payload shared by /common/login and /common/verify_pin */
export const getDeviceInfo = () => {
  localStorage.setItem("version", APP_VERSION);

  const detectedBrowser = getBrowserInfo();
  const detectedOS = getOSInfo();
  const readableDeviceType = getReadableDeviceType();

  let deviceModel = "";
  if (
    mobileModel &&
    mobileVendor &&
    mobileModel !== "none" &&
    mobileVendor !== "none"
  ) {
    deviceModel = `${mobileVendor} ${mobileModel}`;
  } else {
    deviceModel = `${detectedOS} - ${detectedBrowser}`;
  }

  return {
    device_id: generateDeviceId(),
    device_model: deviceModel.trim() || `${detectedOS} Device`,
    device_type: readableDeviceType,
    full_details: {
      browser: `${detectedBrowser} ${browserVersion !== "none" ? browserVersion : ""}`.trim(),
      operating_system: `${detectedOS} ${osVersion !== "none" ? osVersion : ""}`.trim(),
      device_type: readableDeviceType,
    },
  };
};

export const getAppVersion = () => localStorage.getItem("version") || APP_VERSION;
