import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./styles.css";
import GradeCalculator from "./components/GradeCalculator";
import Login from "./pages/loginPage";

function App() {
  return (
    <BrowserRouter basename="/finalGradeCalculator">
      <Routes>
        {/* If the URL is exactly localhost:3000/, show the Login folder */}
        <Route path="/" element={<Login />} />
        
        {/* If the URL is localhost:3000/calculator, show the Calculator folder */}
        <Route path="/calculator" element={<GradeCalculator />} />
        
        {/* Safety net: If they type a random URL, kick them back to login */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
