import React from "react";
import { useAuth } from "../../contexts/AuthContext";

const AuthPrompt = ({
  iconClassName = "fa-solid fa-heart",
  title = "Please Login",
  subtitle = "Login to continue",
  buttonLabel = "Login Now",
  minHeight = "calc(100vh - 300px)",
  containerClassName = "",
  onLogin,
  styles = {},
  variant,
}) => {
  const { setShowAuthOffcanvas } = useAuth();

  // Variant presets
  const variants = {
    favourites: {
      iconClassName: "fa-solid fa-heart",
      title: "Please Login to view Favourites",
      subtitle: "Login to see your saved items",
    },
    orders: {
      iconClassName: "fa-solid fa-clock-rotate-left",
      title: "Please Login to View Orders",
      subtitle: "Login to your account to see your order history",
    },
    checkout: {
      iconClassName: "fa-solid fa-shopping-cart",
      title: "Please Login to Cart",
      subtitle: "Login to your account to complete your order",
    },
    savings: {
      iconClassName: "fa-solid fa-percent",
      title: "Please Login to View Savings",
      subtitle: "Login to see your discount history and savings",
    },
  };

  // Apply variant if provided
  const variantConfig = variant ? variants[variant] : {};
  const finalIconClassName = variantConfig.iconClassName || iconClassName;
  const finalTitle = variantConfig.title || title;
  const finalSubtitle = variantConfig.subtitle || subtitle;

  // Default styles
  const defaultIconStyle = {
    fontSize: 80,
    opacity: 0.5,
    color: "#6c757d",
  };

  const defaultButtonStyle = {
    borderRadius: 12,
    fontWeight: 500,
  };

  // Merge with custom styles
  const iconStyle = { ...defaultIconStyle, ...styles.iconStyle };
  const buttonStyle = { ...defaultButtonStyle, ...styles.buttonStyle };

  // Handle login click
  const handleLogin = () => {
    if (onLogin) {
      onLogin();
    } else {
      setShowAuthOffcanvas(true);
    }
  };

  return (
    <div
      className={`d-flex align-items-center justify-content-center ${containerClassName}`}
      style={{ minHeight }}
    >
      <div className="text-center">
        <div className="mb-4">
          <i
            className={finalIconClassName}
            style={iconStyle}
            aria-hidden="true"
          ></i>
        </div>
        <h5 className="mb-3">{finalTitle}</h5>
        <p className="text-dark mb-4">{finalSubtitle}</p>
        <button
          className="btn btn-outline-primary px-4 py-3 rounded-3xl"
          style={buttonStyle}
          onClick={handleLogin}
          aria-label="Open login"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
};

export default AuthPrompt;
