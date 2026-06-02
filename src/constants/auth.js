export const AUTH_STEPS = {
  LOGIN: "login",
  SIGNUP: "signup",
  PIN: "pin",
};

export const PIN_LENGTH = 4;
export const PIN_REGEX = /^\d{4}$/;
export const MOBILE_REGEX = /^[6-9][0-9]{9}$/;

export const SIGNUP_ENDPOINT = "/user/account_signup";
export const VERIFY_PIN_ENDPOINT = "/common/verify_pin";
export const LOGIN_CHECK_ENDPOINT = "/common/login";
