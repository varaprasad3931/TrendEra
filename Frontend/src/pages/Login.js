import { useState, useContext, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // 2FA login verification states
  const [requires2FA, setRequires2FA] = useState(false);
  const [userId, setUserId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [devOtp, setDevOtp] = useState(""); // Temporary toast for testing
  const [timer, setTimer] = useState(60);

  // Set initial messages if redirected from registration
  useEffect(() => {
    if (location.state?.registered) {
      setSuccessMessage("Registration successful! Please login below.");
    }
  }, [location]);

  // Timer countdown for resending 2FA code
  useEffect(() => {
    let interval = null;
    if (requires2FA && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [requires2FA, timer]);

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const { data } = await API.post("/auth/login", {
        email,
        password,
      });

      if (data.requires2FA) {
        // Switch to OTP entry step
        setUserId(data.userId);
        setRequires2FA(true);
        setTimer(60);
        if (data.devOtp) {
          setDevOtp(data.devOtp); // Provide OTP code for testing
        }
      } else {
        // Direct login fallback (in case 2FA is disabled, though our secure backend requires it)
        login(data);
        navigate("/");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Invalid credentials or connection error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2fa = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data } = await API.post("/auth/verify-2fa", {
        userId,
        otp: otpCode,
      });

      login(data);
      setSuccessMessage("Authentication verified! Logging in...");
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Invalid security code. Please check and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend2fa = async () => {
    if (timer > 0) return;
    setError("");
    setLoading(true);

    try {
      // Re-trigger standard login to recreate OTP
      const { data } = await API.post("/auth/login", {
        email,
        password,
      });
      setSuccessMessage("New verification code sent!");
      if (data.devOtp) {
        setDevOtp(data.devOtp);
      }
      setTimer(60);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to resend code."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Left Side */}
      <div className="login-left">
        <h1>TrendEra</h1>
        <p>
          Discover trending fashion, electronics and lifestyle products on a
          secure shopping platform.
        </p>
      </div>

      {/* Right Side */}
      <div className="login-right">
        <div className="login-card">
          {!requires2FA ? (
            <>
              <h2>Welcome Back 👋</h2>
              <p className="subtitle">Securely login to continue shopping</p>

              {error && <div className="error-box">{error}</div>}
              {successMessage && <div className="success-box">{successMessage}</div>}

              <form onSubmit={submitHandler}>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                {/* Password field with show/hide toggle */}
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingRight: "40px" }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "14px",
                      background: "none",
                      border: "none",
                      color: "#64748b",
                      width: "auto",
                      padding: "0",
                      cursor: "pointer"
                    }}
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>

                <div className="login-options">
                  <label>
                    <input type="checkbox" /> Remember Me
                  </label>
                  <span>Forgot Password?</span>
                </div>

                <button type="submit" disabled={loading}>
                  {loading ? "Authenticating..." : "Login securely"}
                </button>
              </form>

              <p className="register-link">
                Don't have an account? <Link to="/register">Register</Link>
              </p>
            </>
          ) : (
            <>
              <h2>Two-Step Verification 🔒</h2>
              <p className="subtitle">
                Enter the 6-digit OTP code sent to your email to verify your identity.
              </p>

              {devOtp && (
                <div style={{
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  borderRadius: "10px",
                  padding: "10px",
                  fontSize: "12px",
                  color: "#1e3a8a",
                  marginBottom: "15px",
                  textAlign: "center"
                }}>
                  🔐 <strong>[2FA DEMO MODE] Copy OTP:</strong> <code style={{ fontSize: "16px", color: "#2563eb", fontWeight: "bold" }}>{devOtp}</code>
                </div>
              )}

              {error && <div className="error-box">{error}</div>}
              {successMessage && <div className="success-box">{successMessage}</div>}

              <form onSubmit={handleVerify2fa}>
                <input
                  type="text"
                  placeholder="6-Digit OTP"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength="6"
                  style={{
                    fontSize: "20px",
                    letterSpacing: "4px",
                    textAlign: "center",
                    fontWeight: "bold",
                    padding: "12px"
                  }}
                  required
                />

                <button type="submit" disabled={loading || otpCode.length !== 6}>
                  {loading ? "Verifying..." : "Confirm & Login"}
                </button>
              </form>

              <div style={{ marginTop: "20px", textAlign: "center" }}>
                <p style={{ fontSize: "14px", color: "#64748b" }}>
                  Didn't receive the code?{" "}
                  <button
                    type="button"
                    onClick={handleResend2fa}
                    disabled={timer > 0 || loading}
                    style={{
                      background: "none",
                      border: "none",
                      color: timer > 0 ? "#94a3b8" : "#2563eb",
                      cursor: timer > 0 ? "not-allowed" : "pointer",
                      padding: "0",
                      fontWeight: "bold",
                      width: "auto",
                      display: "inline"
                    }}
                  >
                    {timer > 0 ? `Resend in ${timer}s` : "Resend Code"}
                  </button>
                </p>

                <button
                  type="button"
                  onClick={() => { setRequires2FA(false); setError(""); setDevOtp(""); }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#64748b",
                    cursor: "pointer",
                    marginTop: "15px",
                    textDecoration: "underline",
                    width: "auto",
                    padding: "0"
                  }}
                >
                  ← Back to Email / Password
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;