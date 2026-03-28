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
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const inputStyle = {
    width: "100%", marginTop: "6px", padding: "12px 16px",
    background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "10px", color: "#f1f5f9", outline: "none", fontSize: "14px",
  };

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

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value) || value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) document.getElementById(`fp-otp-${index + 1}`)?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      document.getElementById(`fp-otp-${index - 1}`)?.focus();
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length < 6) { toast.error("Enter the complete 6-digit OTP."); return; }
    setLoading(true);
    try {
      await axios.post("/api/auth/verify-otp", { email, otp: otpValue });
      toast.success("OTP verified!");
      setStep("newPassword");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Invalid OTP.");
    } finally { setLoading(false); }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error("Passwords don't match."); return; }
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      await axios.post("/api/auth/reset-password", { email, otp: otp.join(""), newPassword });
      toast.success("Password reset successfully!");
      setStep("done");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Reset failed.");
    } finally { setLoading(false); }
  };

  const stepIndex = step === "email" ? 0 : step === "otp" ? 1 : step === "newPassword" ? 2 : 3;
  const steps = ["Email", "OTP", "New Password"];

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(135deg, #0f1923 0%, #1a2744 50%, #0f2330 100%)" }}>
      <div className="w-full max-w-md rounded-2xl p-8" style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.1)" }}>
        <Link href="/login" className="flex items-center gap-1 text-white/30 hover:text-white/60 text-sm mb-6 transition">← Back to Login</Link>

        {step !== "done" && (
          <div className="flex items-center gap-2 mb-7">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: i <= stepIndex ? "linear-gradient(135deg, #4f46e5, #06b6d4)" : "rgba(255,255,255,0.1)", color: i <= stepIndex ? "white" : "rgba(255,255,255,0.3)" }}>
                  {i < stepIndex ? "✓" : i + 1}
                </div>
                <span className="text-xs" style={{ color: i <= stepIndex ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)" }}>{s}</span>
                {i < steps.length - 1 && <div className="w-8 h-px" style={{ background: i < stepIndex ? "#4f46e5" : "rgba(255,255,255,0.1)" }} />}
              </div>
            ))}
          </div>
        )}

        {step === "email" && (
          <>
            <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>Forgot Password?</h1>
            <p className="text-white/40 text-sm mb-6">Enter your email and we'll send a 6-digit OTP code.</p>
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", fontWeight: "500" }}>Email Address</label>
                <input type="email" placeholder="your@email.com" required value={email}
                  onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #4f46e5, #06b6d4)" }}>
                {loading ? "Sending OTP..." : "Send OTP Code"}
              </button>
            </form>
          </>
        )}

        {step === "otp" && (
          <>
            <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>Enter OTP</h1>
            <p className="text-white/40 text-sm mb-6">6-digit code sent to <strong className="text-white/70">{email}</strong></p>
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="flex gap-2 justify-center">
                {otp.map((digit, index) => (
                  <input key={index} id={`fp-otp-${index}`} type="text" inputMode="numeric" maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="text-center text-xl font-bold"
                    style={{ width: "48px", height: "56px", background: digit ? "rgba(79,70,229,0.2)" : "rgba(255,255,255,0.07)", border: `2px solid ${digit ? "#4f46e5" : "rgba(255,255,255,0.12)"}`, borderRadius: "12px", color: "#f1f5f9", outline: "none" }}
                  />
                ))}
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #4f46e5, #06b6d4)" }}>
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
              <p className="text-center text-sm text-white/30">
                Didn't receive it?{" "}
                <button type="button" onClick={() => { setStep("email"); setOtp(["","","","","",""]); }} className="text-indigo-400 hover:text-indigo-300">
                  Try again
                </button>
              </p>
            </form>
          </>
        )}

        {step === "newPassword" && (
          <>
            <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>New Password</h1>
            <p className="text-white/40 text-sm mb-6">Choose a strong new password.</p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", fontWeight: "500" }}>New Password</label>
                <input type="password" placeholder="At least 6 characters" required value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", fontWeight: "500" }}>Confirm Password</label>
                <input type="password" placeholder="Repeat new password" required value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} style={inputStyle} />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #4f46e5, #06b6d4)" }}>
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </>
        )}

        {step === "done" && (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-white mb-2">Password Reset!</h2>
            <p className="text-white/40 text-sm">Redirecting you to login...</p>
          </div>
        )}
      </div>
    </main>
  );
}