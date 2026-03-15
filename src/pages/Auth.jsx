import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import { authAPI } from "../services/api";

export default function Auth({ initialMode = "login" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSignup, setIsSignup] = useState(initialMode === "signup");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({ name: "", email: "", password: "" });

  useEffect(() => {
    setIsSignup(initialMode === "signup");
  }, [initialMode]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await authAPI.login({
        email: loginForm.email,
        password: loginForm.password,
      });
      // authAPI.login stores token and user for us
      const redirectTo = location.state?.from || "/";
      alert("Login Successful!");
      navigate(redirectTo);
    } catch (err) {
      alert(err.message || "Invalid Credentials");
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await authAPI.register({
        name: signupForm.name,
        email: signupForm.email,
        password: signupForm.password,
      });
      alert("Signup Successful! Please log in.");
      setIsSignup(false);
    } catch (err) {
      alert(err.message || "Signup failed");
    }
  };

  return (
    <>
      <Navbar showAuthButtons={false} showProfileIcon={true} />

      <section
        className="relative min-h-[calc(100vh-96px)] bg-no-repeat px-4 py-6 sm:px-6"
        style={{
          backgroundImage: "url('/auth_bg.png')",
          backgroundSize: "contain",
          backgroundPosition: "center center",
          backgroundColor: "#5f878c",
        }}
      >
        <div className="absolute inset-0 bg-white/10" />

        <div className="relative mx-auto flex min-h-[calc(100vh-96px)] w-full max-w-7xl items-center justify-center md:justify-end md:pr-8 lg:pr-16">
          <div className="w-full max-w-md rounded-3xl border border-white/25 bg-white/10 p-3 backdrop-blur-sm shadow-[0_18px_60px_rgba(12,24,18,0.45)]">
            <div className="mb-4 grid grid-cols-2 rounded-2xl bg-white/20 p-1 text-sm font-semibold text-white">
              <button
                type="button"
                onClick={() => setIsSignup(false)}
                className={`rounded-xl px-3 py-2 transition ${!isSignup ? "bg-white text-emerald-700" : "text-white/85"}`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setIsSignup(true)}
                className={`rounded-xl px-3 py-2 transition ${isSignup ? "bg-white text-emerald-700" : "text-white/85"}`}
              >
                Sign Up
              </button>
            </div>

            <div className="auth-scene">
              <div className={`auth-flip-card ${isSignup ? "is-signup" : ""}`}>
                <form onSubmit={handleLogin} className="auth-face auth-face-front">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700/80">MediShop Access</p>
                  <h2 className="mt-2 text-3xl font-extrabold text-slate-900">Welcome back</h2>
                  <p className="mt-2 text-sm text-slate-500">Log in to continue.</p>

                  <div className="mt-6 space-y-4">
                    <input
                      type="email"
                      placeholder="Email address"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      required
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      required
                    />
                  </div>

                  <button className="mt-6 w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-700">
                    Login
                  </button>

                  <p className="mt-4 text-center text-sm text-slate-600">
                    New here?{" "}
                    <button type="button" onClick={() => setIsSignup(true)} className="font-semibold text-emerald-700 hover:text-emerald-800">
                      Create account
                    </button>
                  </p>
                </form>

                <form onSubmit={handleSignup} className="auth-face auth-face-back">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700/80">Join MediShop</p>
                  <h2 className="mt-2 text-3xl font-extrabold text-slate-900">Create account</h2>
                  <p className="mt-2 text-sm text-slate-500">Sign up to get started.</p>

                  <div className="mt-6 space-y-4">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={signupForm.name}
                      onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      required
                    />
                    <input
                      type="email"
                      placeholder="Email address"
                      value={signupForm.email}
                      onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      required
                    />
                    <input
                      type="password"
                      placeholder="Create password"
                      value={signupForm.password}
                      onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      required
                    />
                  </div>

                  <button className="mt-6 w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-700">
                    Sign Up
                  </button>

                  <p className="mt-4 text-center text-sm text-slate-600">
                    Already have an account?{" "}
                    <button type="button" onClick={() => setIsSignup(false)} className="font-semibold text-emerald-700 hover:text-emerald-800">
                      Login
                    </button>
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}