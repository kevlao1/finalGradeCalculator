import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./loginPage.css";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [signupUsername, setSignupUsername] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [signupError, setSignupError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState("");

  const [account, setAccount] = useState([]);
  const [shownUser, setShownUser] = useState(null);

  const validatePassword = (password) => {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/;

    return passwordRegex.test(password);
  };

  // Logging out
  const logout = () => {
    setShownUser(null);
  };

  // Handling login
  const validLogin = async () => {
    if (error !== "") {
      setSuccess("");
    }

    if (!username || !password) {
      setError("Login username or password cannot be left blank.");
      return;
    }

    // Do we need to validate password format for login? 
    // Cause we have checked it when signing up, so if the account exists, the password must be valid.
    // Decide to annote it for now, but can be added back if needed.
    /*
    if (!validatePassword(password)) {
      setError(
        "Invalid: Password requires at least one uppercase, lowercase, number, and symbol"
      );
      setPassword("");
      return;
    }
    */

    try {
      const response = await fetch("http://localhost:8000/login", {
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
        setError(data.detail || "Log failed. Please check your username and password and try again.");
        return;
      }

      localStorage.setItem("username", data.username);
      localStorage.setItem("access_token", data.access_token);

      setError("");
      setSuccess("Login successful!");
      setShownUser(data.username);
      setUsername("");
      setPassword("");

      // Redirect to home page after successful login
      navigate("/calculator");

    } catch (error) { 
      setSuccess("");
      setError("An error occurred while logging in. Please try again.");
      return;
    }

    /* const storedAccount = account.find(
      (account) =>
        account.username === username && account.password === password
    ); */

    /* if (!data.username && !data.password && !data.access_token) {
      
    } else {
      setError("Account not found. Please sign up or try again.");
      setPassword("");
    } */
  };

  // Handle signing up
  const validSignup = async () => {
    if (signupError !== "") {
      setSignupSuccess("");
    }

    if (!signupUsername || !signupPassword || !confirmPassword) {
      setSignupError("Username or password cannot be left blank.");
      return;
    }

    const usernameTaken = account.some(
      (account) => account.username === signupUsername
    );

    if (usernameTaken) {
      setSignupError("This username is already taken.");
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

    // Send POST request to backend to create new user account and write to database
    try {
      const response = await fetch("http://localhost:8000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: signupUsername,
          password: signupPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSignupSuccess("");
        setSignupError(data.detail || "An error occurred while creating the account.");
        return;
      }
    } catch (error) { 
      setSignupSuccess("");
      setSignupError("An error occurred while creating the account. Please try again.");
      return;
    }

    setAccount([
      ...account,
      {
        username: signupUsername,
        password: signupPassword,
      },
    ]);

    setSignupSuccess("Account created successfully!");
    setSignupError("");
    setSignupUsername("");
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
