import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import BaseModal from "../Modal/BaseModal";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useToast } from "../Toast/useToast";
import { AUTH_STEPS } from "../../constants/auth";
import PinInput from "./PinInput";
import { getDeviceInfo } from "../../utils/deviceInfo";
import {
  accountSignup,
  checkMobileRegistration,
  getAuthErrorMessage,
  isRegisteredForLogin,
  isUnregisteredMobileError,
  UNREGISTERED_MOBILE_MESSAGE,
  verifyPinLogin,
} from "../../services/authService";
import {
  sanitizePin,
  validateMobile,
  validatePin,
  validateSignupName,
} from "../../utils/authValidation";

const AuthOffcanvas = () => {
  const { showAuthOffcanvas, setShowAuthOffcanvas, handleLoginSuccess } =
    useAuth();
  const [currentStep, setCurrentStep] = useState(AUTH_STEPS.LOGIN);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pin, setPin] = useState("");
  const [userDetails, setUserDetails] = useState({ name: "" });
  const [pinError, setPinError] = useState("");
  const [signupPinError, setSignupPinError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { isDarkMode } = useTheme();
  const toast = useToast();
  const phoneInputRef = useRef(null);
  const nameInputRef = useRef(null);
  const pinFormRef = useRef(null);
  const didAutoSubmitRef = useRef(false);
  const [shouldHighlightPhone, setShouldHighlightPhone] = useState(false);
  const [shouldHighlightPinButton, setShouldHighlightPinButton] = useState(false);
  const [pinFieldsHighlight, setPinFieldsHighlight] = useState([
    false,
    false,
    false,
    false,
  ]);

  const handleInputFocus = (e) => {
    if (e?.target?.select) e.target.select();
  };

  const handlePhoneNumberChange = (value) => {
    const cleanValue = value.replace(/\D/g, "");
    if (cleanValue === "" || (/^[6-9]/.test(cleanValue) && cleanValue.length <= 10)) {
      setPhoneNumber(cleanValue);
      setShouldHighlightPhone(cleanValue.length > 1);
    }
  };

  const clearSensitiveAuthFields = () => {
    setPin("");
    setPinError("");
    setSignupPinError("");
  };

  useEffect(() => {
    if (currentStep !== AUTH_STEPS.PIN) return undefined;

    didAutoSubmitRef.current = false;
    const pinInputs = document.querySelectorAll("#login-pin input");

    const handlePinDigitInput = (e) => {
      const input = e.target;
      const value = input.value.replace(/\D/g, "");

      if (value) {
        input.value = value;
        const next = input.getAttribute("data-next");
        if (next && value.length === 1) {
          document.getElementById(next)?.focus();
        }
      }
    };

    const handleKeyDown = (e) => {
      const input = e.target;
      if (e.key === "Backspace" && !input.value) {
        const prev = input.getAttribute("data-previous");
        if (prev) document.getElementById(prev)?.focus();
      }
    };

    const updatePinState = () => {
      const digits = [...pinInputs].map((input) => input.value).join("");
      setPin(digits);
      setPinError("");

      const fieldHighlights = [...pinInputs].map((input) => input.value.length > 0);
      setPinFieldsHighlight(fieldHighlights);
      setShouldHighlightPinButton(
        digits.length === 4 &&
          [...pinInputs].every((i) => i.value && i.value.length === 1)
      );

      if (
        digits.length === 4 &&
        [...pinInputs].every((i) => i.value && i.value.length === 1) &&
        !isLoading &&
        !didAutoSubmitRef.current
      ) {
        didAutoSubmitRef.current = true;
        setTimeout(() => {
          if (pinFormRef.current?.requestSubmit) {
            pinFormRef.current.requestSubmit();
          } else {
            pinFormRef.current?.querySelector('button[type="submit"]')?.click();
          }
        }, 0);
      }
    };

    pinInputs.forEach((input) => {
      input.addEventListener("input", (e) => {
        handlePinDigitInput(e);
        updatePinState();
      });
      input.addEventListener("keydown", handleKeyDown);
    });

    pinInputs[0]?.focus();

    return () => {
      pinInputs.forEach((input) => {
        input.removeEventListener("input", handlePinDigitInput);
        input.removeEventListener("keydown", handleKeyDown);
      });
    };
  }, [currentStep, isLoading]);

  useEffect(() => {
    if (currentStep === AUTH_STEPS.LOGIN && showAuthOffcanvas) {
      const t = setTimeout(() => phoneInputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [currentStep, showAuthOffcanvas]);

  useEffect(() => {
    if (currentStep === AUTH_STEPS.SIGNUP && showAuthOffcanvas) {
      const t = setTimeout(() => nameInputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [currentStep, showAuthOffcanvas]);

  const handleClose = () => {
    setCurrentStep(AUTH_STEPS.LOGIN);
    setPhoneNumber("");
    clearSensitiveAuthFields();
    setUserDetails({ name: "" });
    setIsLoading(false);
    setShowAuthOffcanvas(false);
    setShouldHighlightPhone(false);
    setShouldHighlightPinButton(false);
    setPinFieldsHighlight([false, false, false, false]);
  };

  const redirectToRegister = () => {
    clearSensitiveAuthFields();
    setCurrentStep(AUTH_STEPS.SIGNUP);
    toast.error(UNREGISTERED_MOBILE_MESSAGE, { title: "Not Registered" });
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    const mobileError = validateMobile(phoneNumber);
    if (mobileError) {
      toast.error(mobileError, { title: "Error" });
      return;
    }

    setIsLoading(true);
    const version = "2.3.0";
    const device = getDeviceInfo();

    try {
      const { data } = await checkMobileRegistration({
        mobile: phoneNumber,
        version,
        device,
      });

      if (isRegisteredForLogin(data)) {
        clearSensitiveAuthFields();
        setCurrentStep(AUTH_STEPS.PIN);
        toast.info("Enter your PIN to continue", { title: "Login" });
        return;
      }

      redirectToRegister();
    } catch (err) {
      if (isUnregisteredMobileError(err)) {
        redirectToRegister();
        return;
      }

      toast.error(
        getAuthErrorMessage(err, "Unable to process request. Please try again."),
        { title: "Error" }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();

    const nameError = validateSignupName(userDetails.name);
    const mobileError = validateMobile(phoneNumber);
    const pinValidationError = validatePin(pin);

    setSignupPinError(pinValidationError || "");
    if (nameError || mobileError || pinValidationError) {
      if (nameError) toast.error(nameError, "Error");
      else if (mobileError) toast.error(mobileError, "Error");
      return;
    }

    setIsLoading(true);
    setSignupPinError("");

    try {
      const { data } = await accountSignup({
        mobile: phoneNumber,
        name: userDetails.name,
        pin,
      });

      clearSensitiveAuthFields();
      setUserDetails({ name: "" });
      setCurrentStep(AUTH_STEPS.LOGIN);
      toast.success(
        data?.detail || "Account created successfully",
        "Success"
      );
    } catch (err) {
      clearSensitiveAuthFields();
      const message = getAuthErrorMessage(
        err,
        "Failed to create account. Please try again."
      );
      setSignupPinError(
        err.response?.status === 400 && message.toLowerCase().includes("pin")
          ? message
          : ""
      );
      toast.error(message, "Error");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    const pinValidationError = validatePin(pin);
    if (pinValidationError) {
      setPinError(pinValidationError);
      return;
    }

    setIsLoading(true);
    setPinError("");
    const deviceInfo = getDeviceInfo();

    try {
      const { data } = await verifyPinLogin({
        mobile: phoneNumber,
        pin,
        device_id: deviceInfo.device_id,
        device_model: deviceInfo.device_model,
        device_type: deviceInfo.device_type,
      });

      if (!data.user_id || !data.access_token) {
        throw new Error("Invalid response from server");
      }

      handleLoginSuccess({
        user_id: data.user_id,
        name: data.name,
        role: data.role,
        mobile: phoneNumber,
        access_token: data.access_token,
        expiresAt: data.expires_at || data.expires_on, // Check both possibilities
      });

      toast.success("Login successful!", "Welcome");
      handleClose();
    } catch (err) {
      clearSensitiveAuthFields();
      const pinInputs = document.querySelectorAll("#login-pin input");
      pinInputs.forEach((input) => {
        input.value = "";
      });
      setPinFieldsHighlight([false, false, false, false]);
      didAutoSubmitRef.current = false;

      const message = getAuthErrorMessage(
        err,
        err.response?.status === 400
          ? "Invalid PIN. Please try again."
          : "Failed to sign in. Please try again."
      );
      setPinError(message);
      toast.error(message, "Error");
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
          <label className="block mb-2 text-sm font-medium text-[var(--title)]">
            Phone Number
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-3 text-sm text-[#222121ff] bg-[#e9ecef] border border-r-0 border-[var(--border-color)] rounded-l-lg">
              +91
            </span>
            <input
              type="tel"
              className="flex-1 px-3 py-2 border border-[var(--border-color)] rounded-r-lg outline-none focus:border-[var(--primary)] transition-colors"
              style={{
                fontSize: "14px",
                color: "#222121ff",
                ...(shouldHighlightPhone
                  ? {
                      borderColor: "#66ccd4",
                      backgroundColor: "rgba(102, 204, 212, 0.05)",
                      boxShadow: "0 0 0 2px rgba(102, 204, 212, 0.3)",
                      transition: "all 0.3s ease",
                    }
                  : {}),
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
              />
              Please wait...
            </span>
          ) : (
            "Continue"
          )}
        </button>
      </form>

      <div className="text-center mt-4">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="border-b flex-grow" />
          <button
            type="button"
            className="p-0 bg-transparent border-0 text-sm font-medium transition-opacity duration-200 text-[#6c757d] hover:opacity-80 cursor-pointer"
            onClick={() => {
              clearSensitiveAuthFields();
              setCurrentStep(AUTH_STEPS.SIGNUP);
            }}
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
          <div className="border-b flex-grow" />
        </div>
      </div>
    </div>
  );

  const renderSignupStep = () => (
    <div className="px-1">
      <form onSubmit={handleSignupSubmit}>
        <div className="mb-3">
          <label className="block mb-2 text-sm font-medium text-[var(--title)]">
            Full Name
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg outline-none focus:border-[var(--primary)] transition-colors"
            ref={nameInputRef}
            value={userDetails.name}
            onChange={(e) => {
              const value = e.target.value;
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
          <label className="block mb-2 text-sm font-medium text-[var(--title)]">
            Phone Number
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-3 text-sm text-[#495057] bg-[#e9ecef] border border-r-0 border-[var(--border-color)] rounded-l-lg">
              +91
            </span>
            <input
              type="tel"
              className="flex-1 px-3 py-2 border border-[var(--border-color)] rounded-r-lg outline-none focus:border-[var(--primary)] transition-colors"
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                color: "#000000",
                ...(shouldHighlightPhone
                  ? {
                      borderColor: "#66ccd4",
                      backgroundColor: "rgba(102, 204, 212, 0.05)",
                      boxShadow: "0 0 0 2px rgba(102, 204, 212, 0.3)",
                      transition: "all 0.3s ease",
                    }
                  : {}),
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
        <PinInput
          id="signup-pin"
          label="Create PIN"
          value={pin}
          onChange={(value) => {
            setPin(value);
            if (signupPinError) setSignupPinError("");
          }}
          disabled={isLoading}
          error={signupPinError}
          autoComplete="new-password"
        />
        <div className="flex items-center gap-3 mt-4">
          <button
            type="button"
            className={`w-10 h-10 flex items-center justify-center ${isDarkMode ? "bg-[#027335]" : "bg-[#e8f5eb]"} border-0 rounded-lg cursor-pointer transition-colors hover:opacity-80`}
            onClick={() => {
              clearSensitiveAuthFields();
              setCurrentStep(AUTH_STEPS.LOGIN);
            }}
            disabled={isLoading}
          >
            {backButtonIcon}
          </button>
          <button
            type="submit"
            className="flex-1 py-2.5 px-4 bg-[var(--primary)] text-white rounded-lg font-medium hover:bg-[#32a852] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={
              isLoading ||
              !userDetails.name.trim() ||
              phoneNumber.length !== 10 ||
              sanitizePin(pin).length !== 4
            }
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <span
                  className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2 animate-spin"
                  role="status"
                  aria-hidden="true"
                />
                Creating Account...
              </span>
            ) : (
              "Create Account"
            )}
          </button>
        </div>
      </form>
    </div>
  );

  const renderPinStep = () => (
    <div className="px-1">
      <p className="text-[var(--title)] mb-4">
        Enter your 4 digit PIN for <br />
        <span className="font-bold text-base">+91 {phoneNumber}</span>
      </p>
      <form ref={pinFormRef} onSubmit={handlePinSubmit}>
        <div className="mb-4">
          <div id="login-pin" className="digit-group flex gap-2 justify-center">
            {[1, 2, 3, 4].map((digit) => (
              <input
                key={digit}
                className="w-12 h-12 px-3 py-2 border border-2 rounded-lg text-center outline-none transition-colors"
                style={{
                  borderColor: pinFieldsHighlight[digit - 1]
                    ? "#66ccd4"
                    : "var(--border-color)",
                  backgroundColor: pinFieldsHighlight[digit - 1]
                    ? "rgba(102, 204, 212, 0.1)"
                    : "transparent",
                  boxShadow: pinFieldsHighlight[digit - 1]
                    ? "0 0 0 2px rgba(102, 204, 212, 0.2)"
                    : "none",
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: "#000000",
                  transition: "all 0.3s ease",
                  WebkitTextSecurity: "disc",
                }}
                type="password"
                id={`pin-digit-${digit}`}
                name={`pin-digit-${digit}`}
                data-next={digit < 4 ? `pin-digit-${digit + 1}` : null}
                data-previous={digit > 1 ? `pin-digit-${digit - 1}` : null}
                maxLength="1"
                pattern="[0-9]"
                inputMode="numeric"
                autoComplete="off"
                required
                disabled={isLoading}
              />
            ))}
          </div>
          {pinError ? (
            <small className="text-red-600 text-xs mt-2 block text-center">
              {pinError}
            </small>
          ) : null}
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button
            type="button"
            className={`w-10 h-10 flex items-center justify-center ${isDarkMode ? "bg-[#027335]" : "bg-[#e8f5eb]"} border-0 rounded-lg cursor-pointer transition-colors hover:opacity-80`}
            onClick={() => {
              clearSensitiveAuthFields();
              setCurrentStep(AUTH_STEPS.LOGIN);
            }}
            disabled={isLoading}
          >
            {backButtonIcon}
          </button>
          <button
            type="submit"
            className="flex-1 py-2.5 px-4 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: shouldHighlightPinButton ? "#66ccd4" : "var(--primary)",
              boxShadow: shouldHighlightPinButton
                ? "0 0 0 3px rgba(102, 204, 212, 0.4)"
                : "none",
              transition: "all 0.3s ease",
            }}
            disabled={isLoading || sanitizePin(pin).length !== 4}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <span
                  className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2 animate-spin"
                  role="status"
                  aria-hidden="true"
                />
                Signing in...
              </span>
            ) : (
              "Login"
            )}
          </button>
        </div>
      </form>
    </div>
  );

  const stepTitle = {
    [AUTH_STEPS.LOGIN]: "Login to MenuMitra",
    [AUTH_STEPS.SIGNUP]: "Create Account",
    [AUTH_STEPS.PIN]: "Enter PIN",
  };

  return (
    <BaseModal
      isOpen={showAuthOffcanvas}
      onClose={handleClose}
      size="modal-dialog-centered"
    >
      <div className="auth-modal-content">
        <div className="flex justify-between items-center mb-3">
          <h6 className="title font-semibold mb-0 text-base">{stepTitle[currentStep]}</h6>
          <button
            className={`bg-transparent border-0 text-xl p-1 cursor-pointer hover:opacity-80 transition-opacity ${isDarkMode ? "text-white" : "text-[#6c757d]"}`}
            onClick={handleClose}
            type="button"
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {currentStep === AUTH_STEPS.LOGIN && renderLoginStep()}
        {currentStep === AUTH_STEPS.SIGNUP && renderSignupStep()}
        {currentStep === AUTH_STEPS.PIN && renderPinStep()}
      </div>
    </BaseModal>
  );
};

AuthOffcanvas.propTypes = {};

export default AuthOffcanvas;
