/*
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./styles.css";
import GradeCalculator from "./components/GradeCalculator";
import VisualPage from "./pages/visualPage";
import Login from "./pages/loginPage";

function App() {
  return (
    <BrowserRouter basename="/finalGradeCalculator">
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/calculator" element={<GradeCalculator />} />

        <Route path="/course-report" element={<VisualPage />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App; */

import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import "./styles.css";

import GradeCalculator from "./components/GradeCalculator";
import VisualPage from "./pages/visualPage";
import Login from "./pages/loginPage";
import Signup from "./pages/signUpPage";

function App() {
  return (
    <HashRouter basename="/finalGradeCalculator">
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/calculator" element={<GradeCalculator />} />
        <Route path="/course-report" element={<VisualPage />} />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </HashRouter>
  );
}

export default App;