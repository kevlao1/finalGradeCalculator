import React, { useState } from "react";
import "./loginPage.css";

function Login() {
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
  const validLogin = () => {
    if (setError !== "") {
      setSuccess("");
    }

    if (!username || !password) {
      setError("Login username or password cannot be left blank.");
      return;
    }

    if (!validatePassword(password)) {
      setError(
        "Invalid: Password requires at least one uppercase, lowercase, number, and symbol"
      );
      setPassword("");
      return;
    }

    const storedAccount = account.find(
      (account) =>
        account.username === username && account.password === password
    );

    if (storedAccount) {
      setError("");
      setSuccess("Login successful!");
      setShownUser(storedAccount.username);
      setUsername("");
      setPassword("");
    } else {
      setError("Account not found. Please sign up or try again.");
      setPassword("");
    }
  };

  // Handle signing up
  const validSignup = () => {
    if (setSignupError !== "") {
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
