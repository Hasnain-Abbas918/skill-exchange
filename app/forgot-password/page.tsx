"use client";
import { useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type Step = "email" | "otp" | "newPassword" | "done";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]); // 6 digits
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const containerStyle = {
    background: "linear-gradient(135deg, #0f1923 0%, #1a2744 50%, #0f2330 100%)",
    minHeight: "100vh",
  };

  const cardStyle = {
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(24px)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "20px",
    padding: "36px",
    width: "100%",
    maxWidth: "420px",
  };

  const inputStyle = {
    width: "100%", marginTop: "6px", padding: "12px 16px",
    background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "10px", color: "#f1f5f9", outline: "none", fontSize: "14px",
  };

  const btnStyle = {
    width: "100%", padding: "13px",
    background: "linear-gradient(135deg, #4f46e5, #06b6d4)",
    borderRadius: "12px", color: "white",
    fontWeight: "700", fontSize: "14px", cursor: "pointer",
    border: "none", marginTop: "8px",
  };

  // Step 1: Send OTP
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post("/api/auth/forgot-password", { email });
      toast.success("OTP sent! Check your email.");
      setStep("otp");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to send OTP.");
    } finally { setLoading(false); }
  };

  // Handle OTP input (auto-advance to next box)
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      prev?.focus();
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length < 6) { toast.error("Please enter the complete 6-digit OTP."); return; }
    setLoading(true);
    try {
      await axios.post("/api/auth/verify-otp", { email, otp: otpValue });
      toast.success("OTP verified!");
      setStep("newPassword");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Invalid OTP.");
    } finally { setLoading(false); }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error("Passwords don't match."); return; }
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      await axios.post("/api/auth/reset-password", { email, otp: otp.join(""), newPassword });
      toast.success("Password reset successfully!");
      setStep("done");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Reset failed.");
    } finally { setLoading(false); }
  };

  // Step indicator
  const steps = ["Email", "OTP", "New Password"];
  const stepIndex = step === "email" ? 0 : step === "otp" ? 1 : step === "newPassword" ? 2 : 3;

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={containerStyle}
    >
      <div style={cardStyle}>
        {/* Back to Login */}
        <Link href="/login" className="flex items-center gap-1 text-white/30 hover:text-white/60 text-sm mb-6 transition">
          ← Back to Login
        </Link>

        {/* Step Indicator */}
        {step !== "done" && (
          <div className="flex items-center gap-2 mb-8">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition"
                  style={{
                    background: i <= stepIndex
                      ? "linear-gradient(135deg, #4f46e5, #06b6d4)"
                      : "rgba(255,255,255,0.1)",
                    color: i <= stepIndex ? "white" : "rgba(255,255,255,0.3)",
                  }}
                >
                  {i < stepIndex ? "✓" : i + 1}
                </div>
                <span className="text-xs" style={{ color: i <= stepIndex ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)" }}>
                  {s}
                </span>
                {i < steps.length - 1 && (
                  <div className="flex-1 h-px w-8" style={{ background: i < stepIndex ? "#4f46e5" : "rgba(255,255,255,0.1)" }} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* STEP 1 — Enter Email */}
        {step === "email" && (
          <>
            <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
              Forgot Password?
            </h1>
            <p className="text-white/40 text-sm mb-6">
              Enter your email and we'll send you a 6-digit OTP code.
            </p>
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", fontWeight: "500" }}>
                  Email Address
                </label>
                <input
                  type="email" placeholder="your@email.com" required
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <button type="submit" disabled={loading} style={btnStyle}>
                {loading ? "Sending OTP..." : "Send OTP Code"}
              </button>
            </form>
          </>
        )}

        {/* STEP 2 — Enter OTP */}
        {step === "otp" && (
          <>
            <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
              Enter OTP
            </h1>
            <p className="text-white/40 text-sm mb-2">
              We sent a 6-digit code to
            </p>
            <p className="text-indigo-400 font-semibold text-sm mb-6">{email}</p>
            <form onSubmit={handleVerifyOTP}>
              <div className="flex gap-3 mb-6 justify-center">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="text-center text-xl font-bold"
                    style={{
                      width: "48px", height: "56px",
                      background: "rgba(255,255,255,0.08)",
                      border: digit ? "2px solid #4f46e5" : "2px solid rgba(255,255,255,0.12)",
                      borderRadius: "12px", color: "#f1f5f9",
                      outline: "none",
                    }}
                  />
                ))}
              </div>
              <button type="submit" disabled={loading} style={btnStyle}>
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
              <button
                type="button"
                onClick={() => { setOtp(["","","","","",""]); setStep("email"); }}
                className="w-full mt-3 text-sm"
                style={{ color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer" }}
              >
                Didn't receive it? Go back & resend
              </button>
            </form>
          </>
        )}

        {/* STEP 3 — New Password */}
        {step === "newPassword" && (
          <>
            <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
              Create New Password
            </h1>
            <p className="text-white/40 text-sm mb-6">Choose a strong password for your account.</p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", fontWeight: "500" }}>
                  New Password
                </label>
                <input
                  type="password" placeholder="Min. 6 characters" required
                  value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", fontWeight: "500" }}>
                  Confirm Password
                </label>
                <input
                  type="password" placeholder="Re-enter password" required
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <button type="submit" disabled={loading} style={btnStyle}>
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </>
        )}

        {/* DONE */}
        {step === "done" && (
          <div className="text-center py-6">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>
              Password Reset!
            </h1>
            <p className="text-white/40 text-sm mb-8">
              Your password has been successfully updated. You can now log in.
            </p>
            <button
              onClick={() => router.push("/login")}
              style={btnStyle}
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    </main>
  );
}