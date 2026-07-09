import { useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router";
import styles from "./login.module.css";
import GradientButton from "~/components/Button/GradientButton";
import Logo from "~/components/Button/Logo";
import LanguagesContext from "~/context/Languages/Languages";

export function meta() {
  return [
    { title: "Login - HyperTube" },
    { name: "description", content: "Log in or create your HyperTube account" },
  ];
}

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const authMode = location.pathname === "/signup" ? "signup" : "signin";

  const [loginUsername, setLoginUsername] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState(false);

  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [username, setUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const langContext = useContext(LanguagesContext);

  const API_BASE = "https://localhost";

  const handleLogin = async () => {
    setIsLoading(true);
    setApiError("");
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/auth/api/signin`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            auth: {
              username: loginUsername,
              password: password,
            },
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid credentials");
      const today = new Date();
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      const expirationString = tomorrow.toUTCString();
      document.cookie = `token=${data.token}; path=/;expires=${expirationString}`;
      navigate("/");
    } catch (err: any) {
      setApiError(err.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    setIsLoading(true);
    setApiError("");
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/auth/api/signup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            auth: {
              username: username,
              password: signupPassword,
              confirm_password: confirmPassword,
              first_name: firstname,
              last_name: lastname,
              email: signupEmail,
            },
          }),
        }
      );
      const data = await res.json();
      console.log("Signup response:", res.status, data);
      if (!res.ok) {
        let msg = data.error || data.message;

        if (!msg && data.errors) {
          msg = Array.isArray(data.errors)
            ? data.errors.join(", ")
            : Object.entries(data.errors)
                .map(([k, v]) => `${k} ${v}`)
                .join(", ");
        }

        // Rails validation: top-level { field: ["msg"] } (no wrapper)
        if (!msg && typeof data === "object") {
          const fields = Object.entries(data)
            .filter(([, v]) => Array.isArray(v))
            .map(
              ([k, v]) =>
                `${k.charAt(0).toUpperCase() + k.slice(1)} ${(v as string[]).join(", ")}`
            );
          if (fields.length) msg = fields.join(". ");
        }

        throw new Error(msg || "Signup failed");
      }
      setSignupSuccess(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err: any) {
      setApiError(err.message || "Signup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = (provider: string) => {
    window.location.href = `${API_BASE}/auth/${provider}`;
  };

  const getPasswordRequirements = (pwd: string) => [
    { label: "At least 8 characters", met: pwd.length >= 8 },
    { label: "Uppercase letter (A-Z)", met: /[A-Z]/.test(pwd) },
    { label: "Lowercase letter (a-z)", met: /[a-z]/.test(pwd) },
    { label: "Number (0-9)", met: /[0-9]/.test(pwd) },
    { label: "Special character (!@#$...)", met: /[^A-Za-z0-9]/.test(pwd) },
  ];

  const passwordRequirements = getPasswordRequirements(signupPassword);
  const metCount = passwordRequirements.filter((r) => r.met).length;

  const getPasswordStrength = (
    pwd: string
  ): { level: number; text: string; color: string } => {
    if (pwd.length === 0) return { level: 0, text: "", color: "transparent" };
    if (metCount <= 1) return { level: 1, text: "Weak", color: "#ef4444" };
    if (metCount === 2) return { level: 2, text: "Fair", color: "#f97316" };
    if (metCount <= 3) return { level: 2, text: "Fair", color: "#f97316" };
    if (metCount === 4) return { level: 3, text: "Good", color: "#eab308" };
    return { level: 4, text: "Strong", color: "#22c55e" };
  };

  const passwordStrength = getPasswordStrength(signupPassword);
  const isSignupValid =
    firstname.length > 0 &&
    lastname.length > 0 &&
    username.length > 0 &&
    signupEmail.length > 0 &&
    passwordStrength.level >= 3 &&
    signupPassword === confirmPassword &&
    confirmPassword.length > 0;

  const mailIcon = (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
      <polyline points="22,6 12,13 2,6"></polyline>
    </svg>
  );
  const lockIcon = (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  );
  const eyeIcon = (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  );
  const eyeOffIcon = (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
  );
  const userIcon = (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  );

  return (
    <div className={styles.loginContainer}>
      <div className={styles.indigoGlow} />
      <div className={styles.warmGlow} />

      <Logo />

      <main className={styles.mainContent}>
        <div className={styles.loginBox}>
          <div className={styles.languagesContainer}>
            <ul>
              <li>
                <button
                  onClick={() => {
                    if (langContext && langContext.change)
                      langContext?.change("fr");
                  }}
                >
                  {" "}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={15}
                    height={15}
                    viewBox="0 0 36 36"
                  >
                    <path
                      fill="#ed2939"
                      d="M36 27a4 4 0 0 1-4 4h-8V5h8a4 4 0 0 1 4 4z"
                    ></path>
                    <path
                      fill="#002495"
                      d="M4 5a4 4 0 0 0-4 4v18a4 4 0 0 0 4 4h8V5z"
                    ></path>
                    <path fill="#eee" d="M12 5h12v26H12z"></path>
                  </svg>
                  French
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    if (langContext && langContext.change)
                      langContext?.change("en");
                  }}
                >
                  {" "}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={15}
                    height={15}
                    viewBox="0 0 36 36"
                  >
                    <path
                      fill="#b22334"
                      d="M35.445 7C34.752 5.809 33.477 5 32 5H18v2zM0 25h36v2H0zm18-8h18v2H18zm0-4h18v2H18zM0 21h36v2H0zm4 10h28c1.477 0 2.752-.809 3.445-2H.555c.693 1.191 1.968 2 3.445 2M18 9h18v2H18z"
                    ></path>
                    <path
                      fill="#eee"
                      d="M.068 27.679q.025.14.059.277q.04.15.092.296c.089.259.197.509.333.743L.555 29h34.89l.002-.004a4 4 0 0 0 .332-.741a4 4 0 0 0 .152-.576c.041-.22.069-.446.069-.679H0c0 .233.028.458.068.679M0 23h36v2H0zm0-4v2h36v-2H18zm18-4h18v2H18zm0-4h18v2H18zM.555 7l-.003.005zM.128 8.044c.025-.102.06-.199.092-.297a4 4 0 0 0-.092.297M18 9h18c0-.233-.028-.459-.069-.68a3.6 3.6 0 0 0-.153-.576A4 4 0 0 0 35.445 7H18z"
                    ></path>
                    <path
                      fill="#3c3b6e"
                      d="M18 5H4a4 4 0 0 0-4 4v10h18z"
                    ></path>
                    <path
                      fill="#fff"
                      d="m2.001 7.726l.618.449l-.236.725L3 8.452l.618.448l-.236-.725L4 7.726h-.764L3 7l-.235.726zm2 2l.618.449l-.236.725l.617-.448l.618.448l-.236-.725L6 9.726h-.764L5 9l-.235.726zm4 0l.618.449l-.236.725l.617-.448l.618.448l-.236-.725l.618-.449h-.764L9 9l-.235.726zm4 0l.618.449l-.236.725l.617-.448l.618.448l-.236-.725l.618-.449h-.764L13 9l-.235.726zm-8 4l.618.449l-.236.725l.617-.448l.618.448l-.236-.725l.618-.449h-.764L5 13l-.235.726zm4 0l.618.449l-.236.725l.617-.448l.618.448l-.236-.725l.618-.449h-.764L9 13l-.235.726zm4 0l.618.449l-.236.725l.617-.448l.618.448l-.236-.725l.618-.449h-.764L13 13l-.235.726zm-6-6l.618.449l-.236.725L7 8.452l.618.448l-.236-.725L8 7.726h-.764L7 7l-.235.726zm4 0l.618.449l-.236.725l.617-.448l.618.448l-.236-.725l.618-.449h-.764L11 7l-.235.726zm4 0l.618.449l-.236.725l.617-.448l.618.448l-.236-.725l.618-.449h-.764L15 7l-.235.726zm-12 4l.618.449l-.236.725l.617-.448l.618.448l-.236-.725l.618-.449h-.764L3 11l-.235.726zM6.383 12.9L7 12.452l.618.448l-.236-.725l.618-.449h-.764L7 11l-.235.726h-.764l.618.449zm3.618-1.174l.618.449l-.236.725l.617-.448l.618.448l-.236-.725l.618-.449h-.764L11 11l-.235.726zm4 0l.618.449l-.236.725l.617-.448l.618.448l-.236-.725l.618-.449h-.764L15 11l-.235.726zm-12 4l.618.449l-.236.725l.617-.448l.618.448l-.236-.725l.618-.449h-.764L3 15l-.235.726zM6.383 16.9L7 16.452l.618.448l-.236-.725l.618-.449h-.764L7 15l-.235.726h-.764l.618.449zm3.618-1.174l.618.449l-.236.725l.617-.448l.618.448l-.236-.725l.618-.449h-.764L11 15l-.235.726zm4 0l.618.449l-.236.725l.617-.448l.618.448l-.236-.725l.618-.449h-.764L15 15l-.235.726z"
                    ></path>
                  </svg>
                  English
                </button>
              </li>
            </ul>
          </div>
          <div className={styles.tabSwitcher}>
            <button
              onClick={() => navigate("/login")}
              className={`${styles.tabButton} ${authMode === "signin" ? styles.activeTab : ""}`}
            >
              {langContext?.data.data.signIn.signInButton}
            </button>
            <button
              onClick={() => navigate("/signup")}
              className={`${styles.tabButton} ${authMode === "signup" ? styles.activeTab : ""}`}
            >
              {langContext?.data.data.signIn.signUpButton}
            </button>
          </div>

          <div className={styles.textContainer}>
            <h1 className={styles.mainTitle}>
              {authMode === "signin"
                ? `${langContext?.data.data.signIn.signInTitle}`
                : `${langContext?.data.data.signIn.createAccount}`}
            </h1>
            <p className={styles.subtitle}>
              {authMode === "signin"
                ? `${langContext?.data.data.signIn.signInDesc}`
                : `${langContext?.data.data.signIn.join}`}
            </p>
          </div>

          <div className={styles.socialButtons}>
            <button
              className={styles.intraButton}
              onClick={() => handleOAuth("marvin")}
            >
              <span className={styles.intraShimmer} />
              <span className={styles.intraContent}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 -200 960 960"
                  fill="currentColor"
                >
                  <polygon points="32,412.6 362.1,412.6 362.1,578 526.8,578 526.8,279.1 197.3,279.1 526.8,-51.1 362.1,-51.1 32,279.1" />
                  <polygon points="597.9,114.2 762.7,-51.1 597.9,-51.1" />
                  <polygon points="762.7,114.2 597.9,279.1 597.9,443.9 762.7,443.9 762.7,279.1 928,114.2 928,-51.1 762.7,-51.1" />
                  <polygon points="928,279.1 762.7,443.9 928,443.9" />
                </svg>
                {langContext?.data.data.signIn.continueWithIntra}
              </span>
            </button>

            <div className={styles.socialRow}>
              <button
                className={styles.socialButton}
                onClick={() => handleOAuth("github")}
              >
                <span className={styles.socialShimmer} />
                <span className={styles.socialContent}>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  GitHub
                </span>
              </button>
              <button
                className={styles.socialButton}
                onClick={() => handleOAuth("google_oauth2")}
              >
                <span className={styles.socialShimmer} />
                <span className={styles.socialContent}>
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </span>
              </button>
            </div>
          </div>

          {authMode === "signup" && signupSuccess ? (
            <div className={styles.successOverlay}>
              <div className={styles.successCheckmark}>
                <div className={styles.gradientRing} />
                <div className={styles.sparkles}>
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
                <svg viewBox="0 0 52 52" className={styles.checkmarkSvg}>
                  <circle
                    className={styles.checkmarkCircle}
                    cx="26"
                    cy="26"
                    r="24"
                    fill="none"
                  />
                  <path
                    className={styles.checkmarkPath}
                    fill="none"
                    d="M14 27l7.8 7.8L38 17"
                  />
                </svg>
              </div>
              <h2 className={styles.successTitle}>
                Welcome{firstname ? `, ${firstname}` : ""}!
              </h2>
              <p className={styles.successSubtitle}>
                Your account has been created successfully
              </p>
              <div className={styles.redirectBar}>
                <div className={styles.redirectProgress} />
              </div>
              <span className={styles.redirectLabel}>
                Redirecting to sign in...
              </span>
            </div>
          ) : (
            <>
              <div className={styles.divider}>
                <div className={styles.line}></div>
                <span>{langContext?.data.data.signIn.orUsername}</span>
                <div className={styles.line}></div>
              </div>

              {authMode === "signin" && (
                <div key="signin" className={styles.formAnimate}>
                  <form
                    className={styles.formContainer}
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleLogin();
                    }}
                  >
                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>
                        {langContext?.data.data.signIn.username}
                      </label>
                      <div className={styles.inputWrapper}>
                        <span className={styles.leftIcon}>{userIcon}</span>
                        <input
                          type="text"
                          placeholder="username"
                          value={loginUsername}
                          onChange={(e) => setLoginUsername(e.target.value)}
                          className={styles.nativeInput}
                        />
                      </div>
                    </div>

                    <div className={styles.inputGroup}>
                      <div className={styles.labelRow}>
                        <label className={styles.inputLabel}>
                          {langContext?.data.data.signIn.password}
                        </label>
                        <a href="/forgot" className={styles.forgotLink}>
                          {langContext?.data.data.signIn.forgot}
                        </a>
                      </div>
                      <div className={styles.inputWrapper}>
                        <span className={styles.leftIcon}>{lockIcon}</span>
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className={styles.nativeInput}
                        />
                        <span
                          className={styles.rightIcon}
                          onClick={() => setShowPassword((v) => !v)}
                        >
                          {showPassword ? eyeOffIcon : eyeIcon}
                        </span>
                      </div>
                    </div>

                    {apiError && authMode === "signin" && (
                      <span className={styles.errorText}>{apiError}ff</span>
                    )}

                    <GradientButton
                      type="submit"
                      className="w-full mt-2"
                      disabled={isLoading}
                    >
                      {isLoading
                        ? `${langContext?.data.data.signIn.signInButton}...`
                        : `${langContext?.data.data.signIn.signInButton}`}
                    </GradientButton>
                  </form>
                </div>
              )}

              {authMode === "signup" && (
                <div key="signup" className={styles.formAnimate}>
                  <form
                    className={styles.formContainer}
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSignup();
                    }}
                  >
                    <div className={styles.nameRow}>
                      <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>
                          {langContext?.data.data.signIn.firstName}
                        </label>
                        <div className={styles.inputWrapper}>
                          <span className={styles.leftIcon}>{userIcon}</span>
                          <input
                            type="text"
                            placeholder="Omar"
                            value={firstname}
                            onChange={(e) => setFirstname(e.target.value)}
                            className={styles.nativeInput}
                          />
                        </div>
                      </div>
                      <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>
                          {langContext?.data.data.signIn.lastName}
                        </label>
                        <div className={styles.inputWrapper}>
                          <span className={styles.leftIcon}>{userIcon}</span>
                          <input
                            type="text"
                            placeholder="Makran"
                            value={lastname}
                            onChange={(e) => setLastname(e.target.value)}
                            className={styles.nativeInput}
                          />
                        </div>
                      </div>
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>USERNAME</label>
                      <div className={styles.inputWrapper}>
                        <span className={styles.leftIcon}>{userIcon}</span>
                        <input
                          type="text"
                          placeholder="omakran"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className={styles.nativeInput}
                        />
                      </div>
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>EMAIL ADDRESS</label>
                      <div className={styles.inputWrapper}>
                        <span className={styles.leftIcon}>{mailIcon}</span>
                        <input
                          type="email"
                          placeholder="omakran@gmail.com"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          className={styles.nativeInput}
                        />
                      </div>
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>PASSWORD</label>
                      <div className={styles.inputWrapper}>
                        <span className={styles.leftIcon}>{lockIcon}</span>
                        <input
                          type={showSignupPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          className={styles.nativeInput}
                        />
                        <span
                          className={styles.rightIcon}
                          onClick={() => setShowSignupPassword((v) => !v)}
                        >
                          {showSignupPassword ? eyeOffIcon : eyeIcon}
                        </span>
                      </div>
                      {signupPassword.length > 0 && (
                        <div className={styles.strengthPanel}>
                          <div className={styles.strengthHeader}>
                            <div className={styles.strengthSegments}>
                              {[1, 2, 3, 4].map((i) => (
                                <div
                                  key={i}
                                  className={`${styles.strengthSegment} ${passwordStrength.level >= i ? styles.segmentActive : ""}`}
                                  style={{
                                    backgroundColor:
                                      passwordStrength.level >= i
                                        ? passwordStrength.color
                                        : undefined,
                                  }}
                                />
                              ))}
                            </div>
                            <span
                              className={styles.strengthLabel}
                              style={{ color: passwordStrength.color }}
                            >
                              {passwordStrength.text}
                            </span>
                          </div>
                          <ul className={styles.requirementsList}>
                            {passwordRequirements.map((req, i) => (
                              <li
                                key={i}
                                className={`${styles.requirementItem} ${req.met ? styles.requirementMet : ""}`}
                              >
                                <span className={styles.reqIcon}>
                                  {req.met ? (
                                    <svg
                                      width="12"
                                      height="12"
                                      viewBox="0 0 12 12"
                                      fill="none"
                                    >
                                      <circle
                                        cx="6"
                                        cy="6"
                                        r="5.5"
                                        stroke="currentColor"
                                        strokeWidth="1"
                                      />
                                      <path
                                        d="M3.5 6l1.8 1.8L8.5 4.5"
                                        stroke="currentColor"
                                        strokeWidth="1.2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  ) : (
                                    <svg
                                      width="12"
                                      height="12"
                                      viewBox="0 0 12 12"
                                      fill="none"
                                    >
                                      <circle
                                        cx="6"
                                        cy="6"
                                        r="5.5"
                                        stroke="currentColor"
                                        strokeWidth="1"
                                      />
                                    </svg>
                                  )}
                                </span>
                                {req.label}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>
                        CONFIRM PASSWORD
                      </label>
                      <div className={styles.inputWrapper}>
                        <span className={styles.leftIcon}>{lockIcon}</span>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={styles.nativeInput}
                        />
                        <span
                          className={styles.rightIcon}
                          onClick={() => setShowConfirmPassword((v) => !v)}
                        >
                          {showConfirmPassword ? eyeOffIcon : eyeIcon}
                        </span>
                      </div>
                      {confirmPassword.length > 0 &&
                        signupPassword !== confirmPassword && (
                          <span className={styles.errorText}>
                            Passwords do not match
                          </span>
                        )}
                    </div>

                    {apiError && authMode === "signup" && (
                      <span className={styles.errorText}>{apiError}</span>
                    )}

                    <GradientButton
                      type="submit"
                      className="w-full mt-2"
                      disabled={!isSignupValid || isLoading}
                    >
                      {isLoading ? "Creating..." : "Create Account"}
                    </GradientButton>
                  </form>
                </div>
              )}

              <p className={styles.terms}>
                {langContext?.data.data.signIn.policyMsg}
              </p>
            </>
          )}
        </div>
      </main>

      <footer className={styles.footer}>
        {langContext?.data.data.signIn.rights}
      </footer>
    </div>
  );
}
