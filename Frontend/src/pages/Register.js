import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP Verification flow states
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [devOtp, setDevOtp] = useState(""); // Temporary toast for testing
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);

  // Password Validation Checklist State
  const [checklist, setChecklist] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  useEffect(() => {
    const password = formData.password;
    setChecklist({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    });
  }, [formData.password]);

  // Timer countdown for resending OTP
  useEffect(() => {
    let interval = null;
    if (otpStep && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [otpStep, timer]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const getPasswordStrength = () => {
    const passedCount = Object.values(checklist).filter(Boolean).length;
    if (formData.password.length === 0) return { label: "", color: "#ddd", width: "0%" };
    if (passedCount <= 2) return { label: "Weak", color: "#ef4444", width: "33%" };
    if (passedCount <= 4) return { label: "Moderate", color: "#f97316", width: "66%" };
    return { label: "Strong & Secure", color: "#22c55e", width: "100%" };
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    // Check password checklist
    const passedCount = Object.values(checklist).filter(Boolean).length;
    if (passedCount < 5) {
      return setError("Please meet all password security requirements.");
    }

    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }

    setLoading(true);
    setError("");

    try {
      // Step 1: Send registration OTP
      const { data } = await API.post("/auth/send-otp", {
        email: formData.email,
      });

      setSuccessMessage("Security code sent successfully!");
      if (data.devOtp) {
        setDevOtp(data.devOtp); // Provide code for testing
      }
      setOtpStep(true);
      setTimer(60);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to send security code. Please check your email."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Step 2: Register user with OTP
      await API.post("/auth/register", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        otp: otpCode,
      });

      setSuccessMessage("Account created successfully! Redirecting...");
      setTimeout(() => {
        navigate("/login", { state: { registered: true } });
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Invalid security code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0) return;
    setError("");
    setLoading(true);

    try {
      const { data } = await API.post("/auth/send-otp", {
        email: formData.email,
      });
      setSuccessMessage("New security code sent!");
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

  const strength = getPasswordStrength();

  return (
    <div className="register-container">
      {/* Left Side */}
      <div className="register-left">
        <h1>Join TrendEra</h1>
        <p>
          Create your account and explore thousands of trending products,
          exclusive deals, and secure shopping experiences.
        </p>

        <div className="features">
          <div>✓ Multi-Factor Authentication (OTP)</div>
          <div>✓ Brute-Force Lockout Protection</div>
          <div>✓ End-to-End Encrypted Passwords</div>
          <div>✓ Live Delivery Map Tracking</div>
        </div>
      </div>

      {/* Right Side */}
      <div className="register-right">
        <div className="register-card">
          {!otpStep ? (
            <>
              <h2>Create Account 🚀</h2>
              <p className="subtitle">Start your secure shopping journey today</p>

              {error && <div className="error-box">{error}</div>}
              {successMessage && <div className="success-box">{successMessage}</div>}

              <form onSubmit={submitHandler}>
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />

                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />

                {/* Password field with show/hide toggle */}
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Create Password"
                    value={formData.password}
                    onChange={handleChange}
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

                {/* Password Strength Meter */}
                {formData.password && (
                  <div style={{ marginBottom: "15px", textAlign: "left" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "5px" }}>
                      <span style={{ color: "#64748b" }}>Security Strength:</span>
                      <strong style={{ color: strength.color }}>{strength.label}</strong>
                    </div>
                    <div style={{ height: "6px", width: "100%", backgroundColor: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: strength.width, backgroundColor: strength.color, transition: "width 0.3s ease" }}></div>
                    </div>

                    {/* Requirements checklist */}
                    <div style={{ marginTop: "10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px 15px", fontSize: "11px", color: "#64748b" }}>
                      <div style={{ color: checklist.length ? "#22c55e" : "#94a3b8" }}>
                        {checklist.length ? "✓" : "○"} At least 8 chars
                      </div>
                      <div style={{ color: checklist.uppercase ? "#22c55e" : "#94a3b8" }}>
                        {checklist.uppercase ? "✓" : "○"} 1 Uppercase letter
                      </div>
                      <div style={{ color: checklist.lowercase ? "#22c55e" : "#94a3b8" }}>
                        {checklist.lowercase ? "✓" : "○"} 1 Lowercase letter
                      </div>
                      <div style={{ color: checklist.number ? "#22c55e" : "#94a3b8" }}>
                        {checklist.number ? "✓" : "○"} 1 Number (0-9)
                      </div>
                      <div style={{ color: checklist.special ? "#22c55e" : "#94a3b8", gridColumn: "span 2" }}>
                        {checklist.special ? "✓" : "○"} 1 Special symbol (@$!%*?&#...)
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ position: "relative" }}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    style={{ paddingRight: "40px" }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                    {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>

                <button type="submit" disabled={loading}>
                  {loading ? "Sending security code..." : "Verify & Create Account"}
                </button>
              </form>

              <p className="login-link">
                Already have an account? <Link to="/login">Login</Link>
              </p>
            </>
          ) : (
            <>
              <h2>Verification Required 🔒</h2>
              <p className="subtitle">
                We've sent a 6-digit verification code to <strong>{formData.email}</strong>.
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
                  🔐 <strong>[DEMO MODE] Copy OTP:</strong> <code style={{ fontSize: "16px", color: "#2563eb", fontWeight: "bold" }}>{devOtp}</code>
                </div>
              )}

              {error && <div className="error-box">{error}</div>}
              {successMessage && <div className="success-box">{successMessage}</div>}

              <form onSubmit={handleVerifyOtp}>
                <input
                  type="text"
                  placeholder="6-Digit Verification Code"
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
                  {loading ? "Verifying..." : "Confirm & Register"}
                </button>
              </form>

              <div style={{ marginTop: "20px", textAlign: "center" }}>
                <p style={{ fontSize: "14px", color: "#64748b" }}>
                  Didn't receive the code?{" "}
                  <button
                    type="button"
                    onClick={handleResendOtp}
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
                  onClick={() => { setOtpStep(false); setError(""); setDevOtp(""); }}
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
                  ← Edit Registration Info
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Register;