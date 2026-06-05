import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./signUpPage.css"; 

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

function Signup() {
  const navigate = useNavigate();

  const [signupUsername, setSignupUsername] = useState("");
  const [signupGpa, setSignupGpa] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [signupError, setSignupError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState("");

  const validatePassword = (password) => {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/;

    return passwordRegex.test(password);
  };

  const validSignup = async () => {
    setSignupError("");
    setSignupSuccess("");

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
        "Invalid: Password requires at least one uppercase, lowercase, number, and symbol."
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

    if (!response.ok) {
    setSignupError(
        data.detail || "An error occurred while creating the account."
    );
    return;
    }

    const loginResponse = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            username: signupUsername,
            password: signupPassword,
        }),
    });

    const loginData = await loginResponse.json();

    if (!loginResponse.ok || !loginData.access_token) {
        setSignupError("Account created, but auto login failed.");
        return;
    }

    localStorage.setItem("username", loginData.username);
    localStorage.setItem("access_token", loginData.access_token);

    navigate("/calculator");
    } catch (error) {
      console.error("SIGNUP CRASH CAUSE:", error);
      setSignupError(
        "An error occurred while creating the account. Please try again."
      );
    }
  };

  return (
    <div className="auth-container">
      <div className="user-header">
        Create an account to start saving your grades.
      </div>

      <div className="login-page">
        <h1>Create Account</h1>

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

        <p className="auth-switch-text">
          Already have an account?{" "}
          <Link to="/login" className="auth-link">
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;