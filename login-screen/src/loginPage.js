import React, { useState } from "react";
import { useForm } from "react-hook-form";
import "./loginPage.css";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const validLogin = () => {
    if (!username || !password) {
      setError("Username or password cannot be left blank.");
      return;
    }

    if (username === "user" && password === "password") {
      setError("");
      alert("Success!");
    } else {
      setError("Invalid username or password. Please try again.");
    }
  };

  return (
    <div className="login-page">
      <h1>Welcome Back!</h1>
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
      {error && <p className="error">{error}</p>}
      <button onClick={validLogin}>Login</button>
    </div>
  );
}

export default Login;
