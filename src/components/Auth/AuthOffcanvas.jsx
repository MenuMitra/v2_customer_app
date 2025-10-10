import React, { useState, useEffect, useRef } from "react";
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

const API_BASE_URL = "https://men4u.xyz/v2";

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


  // inside AuthOffcanvas component, near other handlers
const handleInputFocus = (e) => {
  // optional UX: select all text on focus
  if (e?.target?.select) e.target.select();
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
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data } = await api.post("/common/login", {
        mobile: phoneNumber,
        version: "2.1.1",
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

    try {
      const { data } = await api.post("/common/resend_otp", {
        mobile: phoneNumber,
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
          <label className="form-label">Phone Number</label>
          <div className="input-group">
            <span className="input-group-text">+91</span>
            <input
              type="tel"
              className="form-control"
              ref={phoneInputRef}
              value={phoneNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                if (
                  value === "" ||
                  (/^[6-9]/.test(value) && value.length <= 10)
                ) {
                  setPhoneNumber(value);
                }
              }}
              placeholder="Enter your phone number"
              pattern="^[6-9][0-9]{9}$"
              maxLength="10"
              required
              disabled={isLoading}
            />
          </div>
          <small className="text-muted">Enter 10 digit mobile number</small>
        </div>
        <button
          type="submit"
          className="btn btn-primary w-100"
          disabled={
            isLoading ||
            phoneNumber.length !== 10 ||
            !/^[6-9][0-9]{9}$/.test(phoneNumber)
          }
        >
          {isLoading ? (
            <span>
              <span
                className="spinner-border spinner-border-sm me-2"
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
        <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
          <div className="border-bottom flex-grow-1"></div>
          <button
            type="button"
            className="btn btn-link p-0 text-decoration-none"
            onClick={() => setCurrentStep(STEPS.SIGNUP)}
            disabled={isLoading}
            style={{
              fontSize: "0.875rem",
              fontWeight: "500",
              transition: "opacity 0.2s ease",
              color: "#6c757d",
            }}
          >
            New to MenuMitra?{" "}
            <span className="ms-2" style={{ color: "#027335" }}>
              Register
              <svg
                className="ms-1 mt-0"
                viewBox="0 0 10 10"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                style={{
                  width: "0.68em",
                  height: "0.68em",
                  color: "#027335",
                }}
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
          <div className="border-bottom flex-grow-1"></div>
        </div>
      </div>
    </div>
  );

  const buttonContainerStyle = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginTop: "1rem",
  };

  const backButtonStyle = {
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: isDarkMode ? "#027335" : "#e8f5eb",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  };

  const renderSignupStep = () => (
    <div className="px-1">
      <form onSubmit={handleSignupSubmit}>
        <div className="mb-3">
          <label className="form-label">Full Name</label>
          <input
            type="text"
            className="form-control"
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
          <label className="form-label">Phone Number</label>
          <div className="input-group">
            <span className="input-group-text">+91</span>
            <input
              type="tel"
              className="form-control"
              value={phoneNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                if (
                  value === "" ||
                  (/^[6-9]/.test(value) && value.length <= 10)
                ) {
                  setPhoneNumber(value);
                }
              }}
              placeholder="Enter your phone number"
              pattern="^[6-9][0-9]{9}$"
              maxLength="10"
              required
              disabled={isLoading}
            />
          </div>
          <small className="text-muted">Enter 10 digit mobile number</small>
        </div>
        <div style={buttonContainerStyle}>
          <button
            type="button"
            style={backButtonStyle}
            onClick={() => setCurrentStep(STEPS.LOGIN)}
            disabled={isLoading}
            className={`back-btn ${isDarkMode ? "dark-mode" : ""}`}
          >
            {backButtonIcon}
          </button>
          <button
            type="submit"
            className="btn btn-primary flex-grow-1"
            disabled={
              isLoading || !userDetails.name.trim() || phoneNumber.length !== 10
            }
          >
            {isLoading ? (
              <span>
                <span
                  className="spinner-border spinner-border-sm me-2"
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
          className="btn btn-link text-decoration-none"
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
      <p className="text-dark mb-4">
        Enter the verification code sent to <br />
        <span className="fw-bold fs-6">+91 {phoneNumber}</span>
      </p>
      <form ref={otpFormRef} onSubmit={handleOTPSubmit}>
        <div className="mb-4">
          <div
            id="otp"
            className="digit-group d-flex gap-2 justify-content-center"
          >
            {[1, 2, 3, 4].map((digit) => (
              <input
                key={digit}
                className="form-control text-center"
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
        <div style={buttonContainerStyle}>
          <button
            type="button"
            style={backButtonStyle}
            onClick={() => setCurrentStep(STEPS.LOGIN)}
            disabled={isLoading}
            className={`back-btn ${isDarkMode ? "dark-mode" : ""}`}
          >
            {backButtonIcon}
          </button>
          <button
            type="submit"
            className="btn btn-primary flex-grow-1"
            disabled={isLoading || otp.length !== 4}
          >
            {isLoading ? (
              <span>
                <span
                  className="spinner-border spinner-border-sm me-2"
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
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="title font-w600 mb-0">
            {currentStep === STEPS.LOGIN && "Login to MenuMitra"}
            {currentStep === STEPS.SIGNUP && "Create Account"}
            {currentStep === STEPS.OTP && "Verify OTP"}
          </h6>
          <button 
            className="btn-close" 
            onClick={handleClose}
            type="button"
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.2rem',
              color: isDarkMode ? '#ffffff' : '#6c757d',
              padding: '0.25rem',
              cursor: 'pointer'
            }}
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
