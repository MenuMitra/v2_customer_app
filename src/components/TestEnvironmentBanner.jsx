import { useEffect } from "react";
import { Link } from "react-router-dom";
import ENV from "../config";

const PRODUCTION_HOSTNAMES = new Set([
  "menumitra.com",
  "user.menumitra.com",
  "www.menumitra.com",
  "www.user.menumitra.com",
  "menu4.xyz",
  "www.menu4.xyz",
]);

const TestEnvironmentBanner = () => {
  const showBanner =
    ENV.env === "testing" && !PRODUCTION_HOSTNAMES.has(window.location.hostname);

  useEffect(() => {
    if (!showBanner) return;

    document.documentElement.dataset.hasTestEnvBanner = "true";
    return () => {
      delete document.documentElement.dataset.hasTestEnvBanner;
    };
  }, [showBanner]);

  if (!showBanner) return null;

  return (
    <div className="fixed top-0 left-0 w-full z-[1001] h-[44px] text-white flex justify-between items-center px-2 bg-orange-500 shadow-md transition-all duration-300">
      <div className="flex-grow text-center flex items-center justify-center">
        <svg
          className="w-6 h-6"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12.8943 4.55846C12.5318 3.94241 11.4682 3.94241 11.1057 4.55846L2.18046 19.4415C1.81797 20.0576 2.24949 20.8334 2.57476 20.8334H21.4252C21.7505 20.8334 22.182 20.0576 21.8195 19.4415L12.8943 4.55846ZM12 8.33337C12.4606 8.33337 12.8334 8.70615 12.8334 9.16671V13.5001C12.8334 13.9606 12.4606 14.3334 12 14.3334C11.5394 14.3334 11.1667 13.9606 11.1667 13.5001V9.16671C11.1667 8.70615 11.5394 8.33337 12 8.33337ZM12 17.5001C11.5394 17.5001 11.1667 17.1273 11.1667 16.6667C11.1667 16.2062 11.5394 15.8334 12 15.8334C12.4606 15.8334 12.8334 16.2062 12.8334 16.6667C12.8334 17.1273 12.4606 17.5001 12 17.5001Z"
            fill="currentColor"
          />
        </svg>
        <span className="ml-1 font-semibold tracking-wide">
          TESTING ENVIRONMENT
        </span>
      </div>
      <Link
        to="https://menu4.xyz/"
        className="flex items-center bg-white/95 text-[#027335] border-0 rounded-md px-4 py-2 font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg hover:bg-white"
        target="_blank"
      >
        Prod
        <svg
          className="ml-1 mt-0 w-[0.68em] h-[0.68em]"
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
      </Link>
    </div>
  );
};

export default TestEnvironmentBanner;
