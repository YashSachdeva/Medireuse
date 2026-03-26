import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import authAPI from "../services/api";

export default function Navbar({
  showAuthButtons = true,
  showProfileIcon = false,
  mode = "default",
  disableAnimations = false,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const user = authAPI.getStoredUser();
  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    authAPI.logout();
    setIsProfileMenuOpen(false);
    navigate("/");
  };

  const dashboardLinks = [
    { label: "Dashboard", path: "/" },
    { label: "Buy Medicine", path: "/buy-medicine" },
    { label: "Track & Verify", path: "/track-verify" },
    { label: "My Listings", path: "/my-listings" },
  ];

  if (isAdmin) {
    // additional link for admins
    dashboardLinks.push({ label: 'Admin', path: '/admin' });
  }

  return (
    <nav className="sticky top-0 z-50 px-4 md:px-8 pt-4">
      <div
        className={`max-w-7xl mx-auto flex items-center justify-between border border-[#d8e7e0] px-4 md:px-6 py-3 ${
          mode === "dashboard"
            ? "rounded-3xl bg-[#f5fbf9]/95 backdrop-blur-sm shadow-none"
            : "rounded-2xl bg-white/90 backdrop-blur-md shadow-[0_10px_28px_rgba(24,42,38,0.08)]"
        }`}
      >
        <h1 className="text-2xl font-bold text-[#0f5132]">
          <Link to="/" className="flex items-center gap-2">
            {mode === "dashboard" ? (
              <span className="relative h-10 w-10 rounded-full bg-[conic-gradient(from_180deg,#59cc6a_0_45%,#56b8f2_45%_100%)]">
                <span className="absolute inset-[7px] rounded-full bg-[#f5fbf9]" />
              </span>
            ) : (
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 text-white text-sm flex items-center justify-center">
                M
              </span>
            )}
            {mode === "dashboard" ? "MediReuse" : "MediShop"}
          </Link>
        </h1>

        {mode === "dashboard" ? (
          <ul className="hidden lg:flex items-center gap-10 text-[15px] text-[#526770] font-medium">
            {dashboardLinks.map((link) => {
              const isActive = location.pathname === link.path;

              return (
                <li key={link.label}>
                  <Link
                    to={link.path}
                    className={`relative pb-3 transition-colors ${
                      isActive ? "text-[#2d9d7f]" : "hover:text-[#2d9d7f]"
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute left-0 right-0 -bottom-1 h-[3px] rounded-full bg-[#2d9d7f]" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <ul className="hidden md:flex items-center gap-2 rounded-full border border-[#d8e7e0] bg-[#f4fbf7] p-1 text-gray-600 font-medium">
            <li>
              <Link
                to="/"
                className="px-4 py-2 rounded-full transition duration-200 hover:bg-white hover:text-[#0f5132] inline-block"
              >
                Home
              </Link>
            </li>
            <li>
              <a
                href="#about"
                className="px-4 py-2 rounded-full transition duration-200 hover:bg-white hover:text-[#0f5132] inline-block"
              >
                About
              </a>
            </li>
            <li>
              <a
                href="#features"
                className="px-4 py-2 rounded-full transition duration-200 hover:bg-white hover:text-[#0f5132] inline-block"
              >
                Features
              </a>
            </li>
            <li>
              <a
                href="#contact"
                className="px-4 py-2 rounded-full transition duration-200 hover:bg-white hover:text-[#0f5132] inline-block"
              >
                Contact
              </a>
            </li>
          </ul>
        )}

        {showAuthButtons && (
          <div className="flex items-center gap-2 md:gap-3">
            <Link
              to="/login"
              className={`px-4 md:px-5 py-2 rounded-xl border border-[#b9d7c6] text-[#0f5132] hover:bg-[#eef8f2] ${
                disableAnimations ? "" : "transform transition duration-200 hover:scale-105"
              }`}
            >
              Login
            </Link>

            <Link
              to="/signup"
              className={`bg-gradient-to-r from-green-600 to-emerald-500 text-white px-5 md:px-6 py-2 rounded-xl hover:from-green-700 hover:to-emerald-600 shadow-[0_8px_18px_rgba(16,185,129,0.35)] ${
                disableAnimations ? "" : "transform transition duration-200 hover:scale-105"
              }`}
            >
              Sign Up
            </Link>
          </div>
        )}

        {!showAuthButtons && showProfileIcon && (
          <div className="flex items-center gap-3 relative">
            {/* Profile Avatar Button */}
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition transform hover:scale-105 font-bold text-lg"
              title={user?.name}
            >
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </button>

            {/* Dropdown Menu */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* User Info Section */}
                <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-slate-50 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-lg">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 truncate">{user?.name || "User"}</p>
                      <p className="text-sm text-slate-600 truncate">{user?.email}</p>
                      <span className="inline-block mt-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold capitalize">
                        {user?.role || "user"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <Link
                    to="/profile"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-3 px-6 py-3 text-slate-700 hover:bg-slate-100 transition"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-5 w-5 text-emerald-600"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6.75a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.125a7.5 7.5 0 0115 0" />
                    </svg>
                    <span className="font-medium">View Profile</span>
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center gap-3 px-6 py-3 text-slate-700 hover:bg-slate-100 transition"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-5 w-5 text-blue-600"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="font-medium">Admin Dashboard</span>
                    </Link>
                  )}

                  <hr className="my-2" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-6 py-3 text-red-600 hover:bg-red-50 transition text-left font-medium"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-5 w-5"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            )}

            {/* Close menu when clicking outside */}
            {isProfileMenuOpen && (
              <button
                onClick={() => setIsProfileMenuOpen(false)}
                className="fixed inset-0 z-40"
              />
            )}

            {mode === "dashboard" && (
              <span className="hidden md:inline-flex items-center gap-1 text-[15px] text-[#526770] font-medium">
                {user?.name?.split(" ")[0]}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-4 w-4"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                </svg>
              </span>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}