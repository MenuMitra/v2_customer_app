import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import BaseModal from "../Modal/BaseModal";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";
import { useTheme } from "../../contexts/ThemeContext";
import { useToast } from "../Toast/useToast";
import {
  browserName,
  browserVersion,
  deviceType,
  getUA,
  mobileModel,
  mobileVendor,
  osName,
  osVersion,
} from "react-device-detect";

const STEPS = {
  LOGIN: "login",
  SIGNUP: "signup",
  OTP: "otp",
}; 
import {ENV} from '../../config';
const API_BASE_URL = ENV.V2_COMMON_BASE;

// Create axios instance with common config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const AuthOffcanvas = () => {
  const { showAuthOffcanvas, setShowAuthOffcanvas, handleLoginSuccess } =
    useAuth();
  const [currentStep, setCurrentStep] = useState(STEPS.LOGIN);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [userDetails, setUserDetails] = useState({
    name: "",
    email: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const { isDarkMode } = useTheme();
  const [timer, setTimer] = useState(0);
  const [isResendDisabled, setIsResendDisabled] = useState(false);
  const [resetTimer, setResetTimer] = useState(0);
  const toast = useToast();
  const phoneInputRef = useRef(null);
  const nameInputRef = useRef(null);
  const otpFormRef = useRef(null);
  const didAutoSubmitRef = useRef(false);
  const [shouldHighlightPhone, setShouldHighlightPhone] = useState(false);
  const [shouldHighlightOTPButton, setShouldHighlightOTPButton] = useState(false);
  const [otpFieldsHighlight, setOtpFieldsHighlight] = useState([false, false, false, false]);


  // inside AuthOffcanvas component, near other handlers
const handleInputFocus = (e) => {
  // optional UX: select all text on focus
  if (e?.target?.select) e.target.select();
};

const handlePhoneNumberChange = (value) => {
  const cleanValue = value.replace(/\D/g, "");
  if (cleanValue === "" || (/^[6-9]/.test(cleanValue) && cleanValue.length <= 10)) {
    setPhoneNumber(cleanValue);
    
    // Highlight phone input when user enters more than 1 digit
    if (cleanValue.length > 1) {
      console.log("Highlighting phone input, length:", cleanValue.length); // Debug log
      setShouldHighlightPhone(true);
    } else {
      console.log("Removing phone highlight, length:", cleanValue.length); // Debug log
      setShouldHighlightPhone(false);
    }
  }
};
  useEffect(() => {
    let interval;
    if (currentStep === STEPS.OTP || resetTimer) {
      setTimer(20);
      setIsResendDisabled(true);

      interval = setInterval(() => {
        setTimer((prevTimer) => {
          if (prevTimer <= 1) {
            setIsResendDisabled(false);
            clearInterval(interval);
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [currentStep, resetTimer]);

  useEffect(() => {
    if (currentStep === STEPS.OTP) {
      didAutoSubmitRef.current = false;
      const otpInputs = document.querySelectorAll("#otp input");

      const handleOTPInput = (e) => {
        const input = e.target;
        const value = input.value.replace(/\D/g, "");

        if (value) {
          input.value = value;

          const next = input.getAttribute("data-next");
          if (next && value.length === 1) {
            const nextInput = document.getElementById(next);
            if (nextInput) {
              nextInput.focus();
            }
          }
        }
      };

      const handleKeyDown = (e) => {
        const input = e.target;

        if (e.key === "Backspace" && !input.value) {
          const prev = input.getAttribute("data-previous");
          if (prev) {
            const prevInput = document.getElementById(prev);
            if (prevInput) {
              prevInput.focus();
            }
          }
        }
      };

      const updateOTPState = () => {
        const digits = [...otpInputs].map((input) => input.value).join("");
        setOtp(digits);

        // Update field highlighting based on filled inputs
        const fieldHighlights = [...otpInputs].map((input) => input.value.length > 0);
        setOtpFieldsHighlight(fieldHighlights);
        console.log("OTP fields highlight:", fieldHighlights);

        // Highlight OTP button when all 4 digits are entered
        if (digits.length === 4 && [...otpInputs].every((i) => i.value && i.value.length === 1)) {
          console.log("Highlighting OTP button - 4 digits entered");
          setShouldHighlightOTPButton(true);
        } else {
          console.log("Removing OTP button highlight - digits:", digits.length);
          setShouldHighlightOTPButton(false);
        }

        if (
          digits.length === 4 &&
          [...otpInputs].every((i) => i.value && i.value.length === 1) &&
          !isLoading &&
          !didAutoSubmitRef.current
        ) {
          didAutoSubmitRef.current = true;
          setTimeout(() => {
            if (otpFormRef.current?.requestSubmit) {
              otpFormRef.current.requestSubmit();
            } else {
              otpFormRef.current
                ?.querySelector('button[type="submit"]')
                ?.click();
            }
          }, 0);
        }
      };

      otpInputs.forEach((input) => {
        input.addEventListener("input", (e) => {
          handleOTPInput(e);
          updateOTPState();
        });
        input.addEventListener("keydown", handleKeyDown);
      });

      otpInputs[0]?.focus();

      return () => {
        otpInputs.forEach((input) => {
          input.removeEventListener("input", handleOTPInput);
          input.removeEventListener("keydown", handleKeyDown);
        });
      };
    }
  }, [currentStep, isLoading]);

  // Autofocus phone input when login step is active
  useEffect(() => {
    if (currentStep === STEPS.LOGIN && showAuthOffcanvas) {
      const t = setTimeout(() => {
        phoneInputRef.current?.focus();
      }, 0);
      return () => clearTimeout(t);
    }
  }, [currentStep, showAuthOffcanvas]);

  // Autofocus name input when signup step is active
  useEffect(() => {
    if (currentStep === STEPS.SIGNUP && showAuthOffcanvas) {
      const t = setTimeout(() => {
        nameInputRef.current?.focus();
      }, 0);
      return () => clearTimeout(t);
    }
  }, [currentStep, showAuthOffcanvas]);

  // Debug effect to monitor highlight state
  useEffect(() => {
    console.log("shouldHighlightPhone changed:", shouldHighlightPhone);
  }, [shouldHighlightPhone]);

  // Debug effect to monitor OTP button highlight state
  useEffect(() => {
    console.log("shouldHighlightOTPButton changed:", shouldHighlightOTPButton);
  }, [shouldHighlightOTPButton]);

  // Debug effect to monitor OTP fields highlight state
  useEffect(() => {
    console.log("otpFieldsHighlight changed:", otpFieldsHighlight);
  }, [otpFieldsHighlight]);



  const handleClose = () => {
    setCurrentStep(STEPS.LOGIN);
    setPhoneNumber("");
    setOtp("");
    setUserDetails({ name: "", email: "" });
    setIsLoading(false);
    setShowAuthOffcanvas(false);
    setTimer(0);
    setIsResendDisabled(false);
    setResetTimer(0); // Reset the resetTimer state
    setShouldHighlightPhone(false);
    setShouldHighlightOTPButton(false);
    setOtpFieldsHighlight([false, false, false, false]);
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    let Version = localStorage.getItem("version")

    try {
      const { data } = await api.post("/common/login", {
        mobile: phoneNumber,
        version: Version,
        app_type: "customer",
      });

      if (data.role === "customer" || data.role === "admin") {
        setCurrentStep(STEPS.OTP);
        toast.success("OTP sent successfully", "Verification");
      } else {
        toast.error(
          "This mobile number is not registered as a customer or admin",
          "Error"
        );
      }
    } catch (err) {
      console.error("Login error:", err);

      if (
        err.response?.status === 400 &&
        err.response?.data?.detail === "This mobile number is not registered."
      ) {
        setCurrentStep(STEPS.SIGNUP);
        toast.info("Number not registered. Please sign up.", "New User");
        return;
      }

      toast.error(
        err.response?.data?.detail ||
          "Unable to process request. Please try again.",
        "Error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post("/user/account_signup", {
        mobile: phoneNumber,
        name: userDetails.name,
      });

      setCurrentStep(STEPS.OTP);
      toast.success(
        "Account created successfully. Please verify OTP.",
        "Success"
      );
    } catch (err) {
      console.error("Signup error:", err);
      toast.error(
        err.response?.data?.detail ||
          "Failed to create account. Please try again.",
        "Error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getDeviceInfo = () => {
    // Generate a semi-permanent device ID using available device characteristics
    const generateDeviceId = () => {
      const characteristics = [
        navigator.userAgent,
        screen.height,
        screen.width,
        navigator.language,
        new Date().getTimezoneOffset(),
      ].join("|");

      // Create a hash of the characteristics
      let hash = 0;
      for (let i = 0; i < characteristics.length; i++) {
        const char = characteristics.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash).toString(16);
    };

    // Get or create device ID
    let setVersion = localStorage.setItem("version", "2.1.1")
    let deviceId = localStorage.getItem("mm_device_id");
    if (!deviceId) {
      deviceId = generateDeviceId();
      localStorage.setItem("mm_device_id", deviceId);
    }

    // Enhanced browser detection
    const getBrowserInfo = () => {
      const ua = navigator.userAgent;

      // Check for common browsers using both user agent and specific browser properties
      if (navigator.brave?.isBrave || ua.includes("Brave")) {
        return "Brave";
      } else if (
        ua.includes("Chrome") &&
        !ua.includes("Edg") &&
        !ua.includes("OPR")
      ) {
        return "Chrome";
      } else if (ua.includes("Firefox")) {
        return "Firefox";
      } else if (ua.includes("Safari") && !ua.includes("Chrome")) {
        return "Safari";
      } else if (ua.includes("Edg")) {
        return "Edge";
      } else if (ua.includes("OPR") || ua.includes("Opera")) {
        return "Opera";
      } else if (ua.includes("MSIE") || ua.includes("Trident/")) {
        return "Internet Explorer";
      } else {
        return "Browser"; // Generic fallback
      }
    };

    // Get OS info with better formatting
    const getOSInfo = () => {
      if (osName === "none" || !osName) {
        // Fallback OS detection from user agent
        const ua = navigator.userAgent;
        if (ua.includes("Windows")) return "Windows";
        if (ua.includes("Mac")) return "MacOS";
        if (ua.includes("Linux")) return "Linux";
        if (ua.includes("Android")) return "Android";
        if (ua.includes("iOS") || ua.includes("iPhone") || ua.includes("iPad"))
          return "iOS";
        return "Unknown OS";
      }
      return osName === "Mac OS" ? "MacOS" : osName;
    };

    // Format device model
    let deviceModel = "";
    const detectedBrowser = getBrowserInfo();
    const detectedOS = getOSInfo();

    if (
      mobileModel &&
      mobileVendor &&
      mobileModel !== "none" &&
      mobileVendor !== "none"
    ) {
      // Mobile device format
      deviceModel = `${mobileVendor} ${mobileModel}`;
    } else {
      // Desktop/laptop format
      deviceModel = `${detectedOS} - ${detectedBrowser}`;
    }

    // Enhanced device type detection
    let readableDeviceType = "Desktop";
    const ua = navigator.userAgent;

    if (
      deviceType === "mobile" ||
      /Mobile|Android|iPhone|iPod/i.test(ua) ||
      (mobileModel !== "none" && !ua.includes("iPad"))
    ) {
      readableDeviceType = "Mobile Phone";
    } else if (
      deviceType === "tablet" ||
      /iPad|Tablet|PlayBook/i.test(ua) ||
      (ua.includes("Android") && !ua.includes("Mobile"))
    ) {
      readableDeviceType = "Tablet";
    }

    return {
      device_id: deviceId,
      device_model: deviceModel.trim() || `${detectedOS} Device`,
      device_type: readableDeviceType,
      full_details: {
        browser: `${detectedBrowser} ${
          browserVersion !== "none" ? browserVersion : ""
        }`.trim(),
        operating_system: `${detectedOS} ${
          osVersion !== "none" ? osVersion : ""
        }`.trim(),
        device_type: readableDeviceType,
      },
    };
  };

  useEffect(() => {
    const info = getDeviceInfo();
    console.log("Browser Detection:", {
      userAgent: navigator.userAgent,
      deviceInfo: info,
      platform: navigator.platform,
      vendor: navigator.vendor,
    });
  }, []);

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const deviceInfo = getDeviceInfo();

    try {
      const response = await api.post("/common/verify_otp", {
        mobile: phoneNumber,
        otp: otp,
        app_type: "customer",
        device_id: deviceInfo.device_id,
        device_model: deviceInfo.device_model,
        device_type: deviceInfo.device_type,
      });

      const { data } = response;

      // Check if we have all required data
      if (!data.user_id || !data.access_token) {
        throw new Error("Invalid response from server");
      }

      // Store user data in localStorage and update context
      handleLoginSuccess({
        user_id: data.user_id,
        name: data.name,
        role: data.role,
        mobile: phoneNumber,
        access_token: data.access_token,
        expires_at: data.expires_at,
      });

      toast.success("Login successful!", "Welcome");
      handleClose();
    } catch (err) {
      console.error("OTP verification error:", err);

      // Handle different types of errors
      if (err.response?.status === 400) {
        toast.error("Invalid OTP. Please try again.", "Error");
      } else if (err.response?.data?.detail) {
        toast.error(err.response.data.detail, "Error");
      } else if (err.message) {
        toast.error(err.message, "Error");
      } else {
        toast.error("Failed to verify OTP. Please try again.", "Error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    setResetTimer((prev) => prev + 1); // Trigger timer reset
    let Version = localStorage.getItem("version")
    try {
      const { data } = await api.post("/common/resend_otp", {
        mobile: phoneNumber,
        version:Version,
        app_type: "customer",
      });

      if (data.role === "customer") {
        toast.success(data.detail || "OTP resent successfully!", "OTP Sent");
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error("Resend OTP error:", err);
      toast.error(
        err.response?.data?.detail || "Failed to resend OTP. Please try again.",
        "Error"
      );
      // Reset timer state if API call fails
      setTimer(0);
      setIsResendDisabled(false);
    } finally {
      setIsLoading(false);
    }
  };

  const backButtonIcon = (
    <svg
      width="10"
      height="16"
      viewBox="0 0 10 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.40366 8L9.91646 2.58333L7.83313 0.499999L0.333132 8L7.83313 15.5L9.91644 13.4167L4.40366 8Z"
        fill={isDarkMode ? "#ffffff" : "#027335"}
      />
    </svg>
  );

  const renderLoginStep = () => (
    <div className="px-1">
      <form onSubmit={handlePhoneSubmit}>
        <div className="mb-3">
          <label className="block mb-2 text-sm font-medium text-[var(--title)]">Phone Number</label>
          <div className="flex">
            <span className="inline-flex items-center px-3 text-sm text-[#222121ff] bg-[#e9ecef] border border-r-0 border-[var(--border-color)] rounded-l-lg">+91</span>
            <input
              type="tel"
              className="flex-1 px-3 py-2 border border-[var(--border-color)] rounded-r-lg outline-none focus:border-[var(--primary)] transition-colors"
              style={{
                fontSize: '14px',
                color: '#222121ff',
                ...(shouldHighlightPhone ? {
                  borderColor: '#66ccd4',
                  backgroundColor: 'rgba(102, 204, 212, 0.05)',
                  boxShadow: '0 0 0 2px rgba(102, 204, 212, 0.3)',
                  transition: 'all 0.3s ease'
                } : {})
              }}
              ref={phoneInputRef}
              value={phoneNumber}
              onChange={(e) => handlePhoneNumberChange(e.target.value)}
              placeholder="Enter your phone number"
              pattern="^[6-9][0-9]{9}$"
              maxLength="10"
              required
              disabled={isLoading}
            />
          </div>
          <small className="text-[#6c757d] text-xs">Enter 10 digit mobile number</small>
        </div>
        <button
          type="submit"
          className="w-full py-2.5 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={
            isLoading ||
            phoneNumber.length !== 10 ||
            !/^[6-9][0-9]{9}$/.test(phoneNumber)
          }
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <span
                className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2 animate-spin"
                role="status"
                aria-hidden="true"
              ></span>
              Please wait...
            </span>
          ) : (
            "Get OTP"
          )}
        </button>
      </form>

      <div className="text-center mt-4">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="border-b flex-grow"></div>
          <button
            type="button"
            className="p-0 bg-transparent border-0 text-sm font-medium transition-opacity duration-200 text-[#6c757d] hover:opacity-80 cursor-pointer"
            onClick={() => setCurrentStep(STEPS.SIGNUP)}
            disabled={isLoading}
          >
            New to MenuMitra?{" "}
            <span className="ml-2 text-[#027335]">
              Register
              <svg
                className="ml-1 inline-block w-[0.68em] h-[0.68em] text-[#027335]"
                viewBox="0 0 10 10"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M1.004 9.166 9.337.833m0 0v8.333m0-8.333H1.004"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>
          <div className="border-b flex-grow"></div>
        </div>
      </div>
    </div>
  );

  const renderSignupStep = () => (
    <div className="px-1">
      <form onSubmit={handleSignupSubmit}>
        <div className="mb-3">
          <label className="block mb-2 text-sm font-medium text-[var(--title)]">Full Name</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg outline-none focus:border-[var(--primary)] transition-colors"
            ref={nameInputRef}
            value={userDetails.name}
            onChange={(e) => {
              const value = e.target.value;
              // Only allow alphabets and spaces
              if (/^[a-zA-Z ]*$/.test(value)) {
                setUserDetails((prev) => ({ ...prev, name: value }));
              }
            }}
            onFocus={handleInputFocus}
            placeholder="Enter your full name"
            required
            disabled={isLoading}
          />
        </div>
        <div className="mb-3">
          <label className="block mb-2 text-sm font-medium text-[var(--title)]">Phone Number</label>
          <div className="flex">
            <span className="inline-flex items-center px-3 text-sm text-[#495057] bg-[#e9ecef] border border-r-0 border-[var(--border-color)] rounded-l-lg">+91</span>
            <input
              type="tel"
              className="flex-1 px-3 py-2 border border-[var(--border-color)] rounded-r-lg outline-none focus:border-[var(--primary)] transition-colors"
              style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#000000',
                ...(shouldHighlightPhone ? {
                  borderColor: '#66ccd4',
                  backgroundColor: 'rgba(102, 204, 212, 0.05)',
                  boxShadow: '0 0 0 2px rgba(102, 204, 212, 0.3)',
                  transition: 'all 0.3s ease'
                } : {})
              }}
              value={phoneNumber}
              onChange={(e) => handlePhoneNumberChange(e.target.value)}
              placeholder="Enter your phone number"
              pattern="^[6-9][0-9]{9}$"
              maxLength="10"
              required
              disabled={isLoading}
            />
          </div>
          <small className="text-[#6c757d] text-xs">Enter 10 digit mobile number</small>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button
            type="button"
            className={`w-10 h-10 flex items-center justify-center ${isDarkMode ? 'bg-[#027335]' : 'bg-[#e8f5eb]'} border-0 rounded-lg cursor-pointer transition-colors hover:opacity-80`}
            onClick={() => setCurrentStep(STEPS.LOGIN)}
            disabled={isLoading}
          >
            {backButtonIcon}
          </button>
          <button
            type="submit"
            className="flex-1 py-2.5 px-4 bg-[var(--primary)] text-white rounded-lg font-medium hover:bg-[#32a852] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={
              isLoading || !userDetails.name.trim() || phoneNumber.length !== 10
            }
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <span
                  className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2 animate-spin"
                  role="status"
                  aria-hidden="true"
                ></span>
                Creating Account...
              </span>
            ) : (
              "Send OTP"
            )}
          </button>
        </div>
      </form>
    </div>
  );

  const renderResendOTP = () => {
    if (currentStep !== STEPS.OTP) return null;

    return (
      <div className="text-center mt-3">
        <button
          type="button"
          className="p-0 bg-transparent border-0 text-[var(--primary)] hover:opacity-80 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleResendOTP}
          disabled={isLoading || isResendDisabled}
        >
          {isResendDisabled ? `Resend OTP in ${timer}s` : "Resend OTP"}
        </button>
      </div>
    );
  };

  const renderOTPStep = () => (
    <div className="px-1">
      <p className="text-[var(--title)] mb-4">
        Enter the verification code sent to <br />
        <span className="font-bold text-base">+91 {phoneNumber}</span>
      </p>
      <form ref={otpFormRef} onSubmit={handleOTPSubmit}>
        <div className="mb-4">
          <div
            id="otp"
            className="digit-group flex gap-2 justify-center"
          >
            {[1, 2, 3, 4].map((digit) => (
              <input
                key={digit}
                className="w-12 h-12 px-3 py-2 border border-2 rounded-lg text-center outline-none transition-colors"
                style={{
                  borderColor: otpFieldsHighlight[digit - 1] ? '#66ccd4' : 'var(--border-color)',
                  backgroundColor: otpFieldsHighlight[digit - 1] ? 'rgba(102, 204, 212, 0.1)' : 'transparent',
                  boxShadow: otpFieldsHighlight[digit - 1] ? '0 0 0 2px rgba(102, 204, 212, 0.2)' : 'none',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#000000',
                  transition: 'all 0.3s ease'
                }}
                type="text"
                id={`digit-${digit}`}
                name={`digit-${digit}`}
                data-next={digit < 4 ? `digit-${digit + 1}` : null}
                data-previous={digit > 1 ? `digit-${digit - 1}` : null}
                maxLength="1"
                pattern="[0-9]"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                disabled={isLoading}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button
            type="button"
            className={`w-10 h-10 flex items-center justify-center ${isDarkMode ? 'bg-[#027335]' : 'bg-[#e8f5eb]'} border-0 rounded-lg cursor-pointer transition-colors hover:opacity-80`}
            onClick={() => setCurrentStep(STEPS.LOGIN)}
            disabled={isLoading}
          >
            {backButtonIcon}
          </button>
          <button
            type="submit"
            className="flex-1 py-2.5 px-4 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: shouldHighlightOTPButton ? '#66ccd4' : 'var(--primary)',
              boxShadow: shouldHighlightOTPButton ? '0 0 0 3px rgba(102, 204, 212, 0.4)' : 'none',
              transition: 'all 0.3s ease'
            }}
            disabled={isLoading || otp.length !== 4}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <span
                  className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2 animate-spin"
                  role="status"
                  aria-hidden="true"
                ></span>
                Verifying...
              </span>
            ) : (
              "SUBMIT"
            )}
          </button>
        </div>
      </form>
      {renderResendOTP()}
    </div>
  );

  return (
    <BaseModal
      isOpen={showAuthOffcanvas}
      onClose={handleClose}
      size="modal-dialog-centered"
    >
      <div className="auth-modal-content">
        {/* Custom title with close button */}
        <div className="flex justify-between items-center mb-3">
          <h6 className="title font-semibold mb-0 text-base">
            {currentStep === STEPS.LOGIN && "Login to MenuMitra"}
            {currentStep === STEPS.SIGNUP && "Create Account"}
            {currentStep === STEPS.OTP && "Verify OTP"}
          </h6>
          <button 
            className={`bg-transparent border-0 text-xl p-1 cursor-pointer hover:opacity-80 transition-opacity ${isDarkMode ? 'text-white' : 'text-[#6c757d]'}`}
            onClick={handleClose}
            type="button"
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        
        {currentStep === STEPS.LOGIN && renderLoginStep()}
        {currentStep === STEPS.SIGNUP && renderSignupStep()}
        {currentStep === STEPS.OTP && renderOTPStep()}
      </div>
    </BaseModal>
  );
};

AuthOffcanvas.propTypes = {
  // PropTypes are handled by the AuthContext, no direct props needed
};

export default AuthOffcanvas;
