import { Routes, Route, useLocation } from "react-router-dom";

import Navbar from "./components/navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import WhyChoose from "./components/WhyChoose";
import Footer from "./components/Footer";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import BrowseMedicine from "./pages/BrowseMedicine";
import OrderHistory from "./pages/OrderHistory";
import Admin from "./pages/Admin";

function Home() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <WhyChoose />
    </>
  );
}

export default function App() {
  const location = useLocation();
  const isAuthRoute = location.pathname === "/login" || location.pathname === "/signup";
  const isProfileRoute = location.pathname === "/profile";
  const isBrowseMedicineRoute = location.pathname === "/buy-medicine";
  const isOrderHistoryRoute = location.pathname === "/orders";
  const isAdminRoute = location.pathname === "/admin";

  return (
    <>
      {!isAuthRoute && <Navbar disableAnimations={isBrowseMedicineRoute || isOrderHistoryRoute || isProfileRoute} />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/buy-medicine" element={<BrowseMedicine />} />
        <Route path="/orders" element={<OrderHistory />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>

      {/* hide footer on auth, browse-medicine, orders, profile and admin pages */}
      {!isAuthRoute && !isBrowseMedicineRoute && !isOrderHistoryRoute && !isProfileRoute && !isAdminRoute && <Footer />}
    </>
  );
}