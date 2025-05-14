import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Couriers from "./pages/Couriers";
import Orders from "./pages/Orders";
import Customers from "./pages/Customers";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import TrackOrder from "./components/TrackOrder";
import Profile from "./pages/Profile";

const App = () => {
  const role = localStorage.getItem("userRole");

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {role === "admin" && (
          <>
            <Route path="/orders" element={<Orders />} />
            <Route path="/couriers" element={<Couriers />} />
            <Route path="/customers" element={<Customers />} />
          </>
        )}
        {role === "courier" && <Route path="/orders" element={<Orders />} />}
        {role === "customer" && <Route path="/orders" element={<Orders />} />}
        {role && <Route path="/profile" element={<Profile />} />}
        {/*
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />*/}
        <Route path="/track/:id" element={<TrackOrder />} />
      </Routes>
    </Router>
  );
};

export default App;
