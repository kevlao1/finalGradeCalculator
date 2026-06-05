import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./loginPage.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [signupUsername, setSignupUsername] = useState("");
  const [signupGpa, setSignupGpa] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [signupError, setSignupError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState("");

  const [shownUser, setShownUser] = useState(null);

  const validatePassword = (password) => {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/;

    return passwordRegex.test(password);
  };

  const logout = () => {
    setShownUser(null);
    localStorage.removeItem("username");
    localStorage.removeItem("access_token");
  };

  const validLogin = async () => {
    if (error !== "") {
      setSuccess("");
    }

    if (!username || !password) {
      setError("Login username or password cannot be left blank.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.detail ||
            "Login failed. Please check your username and password and try again."
        );
        return;
      }

      localStorage.setItem("username", data.username);
      localStorage.setItem("access_token", data.access_token);

      setError("");
      setSuccess("Login successful!");
      setShownUser(data.username);
      setUsername("");
      setPassword("");

      navigate("/calculator");
    } catch (error) {
      setSuccess("");
      setError("An error occurred while logging in. Please try again.");
      return;
    }
  };

  const validSignup = async () => {
    if (signupError !== "") {
      setSignupSuccess("");
    }

    if (!signupUsername || !signupPassword || !confirmPassword) {
      setSignupError("Username or password cannot be left blank.");
      return;
    }

    const gpaNumber = signupGpa === "" ? 0 : Number(signupGpa);

    if (Number.isNaN(gpaNumber) || gpaNumber < 0 || gpaNumber > 4) {
      setSignupError("GPA must be between 0 and 4.");
      return;
    }

    if (!validatePassword(signupPassword)) {
      setSignupError(
        "Invalid: Password requires at least one uppercase, lowercase, number, and symbol"
      );
      setSignupPassword("");
      setConfirmPassword("");
      return;
    }

    if (signupPassword !== confirmPassword) {
      setSignupError("Passwords do not match. Try again.");
      setSignupPassword("");
      setConfirmPassword("");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: signupUsername,
          gpa: gpaNumber,
          password: signupPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.username || !data.access_token) {
        setSignupSuccess("");
        setSignupError(
          data.detail || "An error occurred while creating the account."
        );
        return;
      }
    } catch (error) {
      setSignupSuccess("");
      console.error("THE CRASH CAUSE:", error);
      setSignupError(
        "An error occurred while creating the account. Please try again."
      );
      return;
    }

    setSignupSuccess("Account created successfully!");
    setSignupError("");
    setSignupUsername("");
    setSignupGpa("");
    setSignupPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="auth-container">
      <div className="user-header">
        <span>
          {shownUser
            ? `Hi, ${shownUser}!  `
            : "Please log in to save your grades! :)"}
        </span>

        {shownUser && (
          <button className="logout-button" onClick={logout}>
            Log Out
          </button>
        )}
      </div>

      <div className="login-page">
        <h1>Welcome Back!</h1>

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}

        <div className="form-group">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="form-group">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button onClick={validLogin}>Login</button>
      </div>

      <div className="login-page">
        <h1>New? Sign up here!</h1>

        {signupError && <p className="error">{signupError}</p>}
        {signupSuccess && <p className="success">{signupSuccess}</p>}

        <div className="form-group">
          <input
            type="text"
            placeholder="Create Username"
            value={signupUsername}
            onChange={(e) => setSignupUsername(e.target.value)}
          />
        </div>

       {/* 
        <div className="form-group">
          <input
            type="number"
            step="0.01"
            min="0"
            max="4"
            placeholder="GPA"
            value={signupGpa}
            onChange={(e) => setSignupGpa(e.target.value)}
          />
        </div> */}

        <div className="form-group">
          <input
            type="password"
            placeholder="Create Password"
            value={signupPassword}
            onChange={(e) => setSignupPassword(e.target.value)}
          />
        </div>

        <div className="form-group">
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <button onClick={validSignup}>Sign Up</button>
      </div>
    </div>
  );
}

export default Login;