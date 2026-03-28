"use client";
import { useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";

type Step = "form" | "otp" | "done";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState({
    name: "", email: "", password: "",
    skillsOffered: "", skillsWanted: "", bio: "",
  });
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [formStep, setFormStep] = useState(1); // 1 or 2 within the form

  const inputStyle = {
    width: "100%", marginTop: "6px", padding: "12px 16px",
    background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "10px", color: "#f1f5f9", outline: "none", fontSize: "14px",
  };
  const labelStyle = { fontSize: "13px", fontWeight: "500", color: "rgba(255,255,255,0.6)" };

  // Step 1: Send OTP to email
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { toast.error("Please fill all required fields."); return; }
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      await axios.post("/api/auth/send-registration-otp", { email: form.email });
      toast.success("Verification OTP sent to your email!");
      setStep("otp");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to send OTP.");
    } finally { setLoading(false); }
  };

  // OTP input handler
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`reg-otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`reg-otp-${index - 1}`)?.focus();
    }
  };

  // Step 2: Verify OTP + Create Account
  const handleVerifyAndCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length < 6) { toast.error("Please enter the complete 6-digit OTP."); return; }
    setLoading(true);
    try {
      const res = await axios.post("/api/auth/register", { ...form, otp: otpValue });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      toast.success("Account created! Welcome to SkillSwap 🎉");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Something went wrong.");
    } finally { setLoading(false); }
  };

  const resendOTP = async () => {
    setLoading(true);
    try {
      await axios.post("/api/auth/send-registration-otp", { email: form.email });
      toast.success("New OTP sent to your email.");
      setOtp(["", "", "", "", "", ""]);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to resend.");
    } finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen flex items-center justify-center py-10 px-4" style={{ background: "linear-gradient(135deg, #0f1923 0%, #1a2744 50%, #0f2330 100%)" }}>
      <div className="w-full max-w-md rounded-2xl p-8" style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.1)" }}>

        {/* Logo */}
        <div className="text-center mb-7">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4" style={{ background: "linear-gradient(135deg, #4f46e5, #06b6d4)" }}>S</div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
            {step === "form" ? "Create Account" : step === "otp" ? "Verify Email" : "Account Created!"}
          </h1>
          <p className="text-white/40 text-sm mt-1">
            {step === "form" ? "Join SkillSwap — completely free" : step === "otp" ? `OTP sent to ${form.email}` : "You're all set!"}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-7">
          {["Details", "Verify", "Done"].map((s, i) => {
            const stepNum = step === "form" ? 0 : step === "otp" ? 1 : 2;
            return (
              <div key={s} className="flex items-center gap-1">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition" style={{ background: i <= stepNum ? "linear-gradient(135deg, #4f46e5, #06b6d4)" : "rgba(255,255,255,0.1)", color: i <= stepNum ? "white" : "rgba(255,255,255,0.3)" }}>
                  {i < stepNum ? "✓" : i + 1}
                </div>
                <span className="text-xs hidden sm:block" style={{ color: i <= stepNum ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)" }}>{s}</span>
                {i < 2 && <div className="w-6 h-px mx-1" style={{ background: i < stepNum ? "#4f46e5" : "rgba(255,255,255,0.1)" }} />}
              </div>
            );
          })}
        </div>

        {/* FORM STEP */}
        {step === "form" && (
          <>
            <button type="button" onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-xl font-semibold text-sm transition mb-5"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#f1f5f9" }}>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }}></div>
              <span className="text-white/30 text-xs">or sign up with email</span>
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }}></div>
            </div>

            {formStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <input type="text" placeholder="John Doe" required value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Email Address *</label>
                  <input type="email" placeholder="you@example.com" required value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Password *</label>
                  <input type="password" placeholder="At least 6 characters" required value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })} style={inputStyle} />
                </div>
                <button type="button" onClick={() => setFormStep(2)}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm transition"
                  style={{ background: "linear-gradient(135deg, #4f46e5, #06b6d4)" }}>
                  Next →
                </button>
              </div>
            )}

            {formStep === 2 && (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label style={labelStyle}>Skills You Offer</label>
                  <input type="text" placeholder="e.g. React, Python, Graphic Design" value={form.skillsOffered}
                    onChange={(e) => setForm({ ...form, skillsOffered: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Skills You Want to Learn</label>
                  <input type="text" placeholder="e.g. Marketing, Cooking, Music" value={form.skillsWanted}
                    onChange={(e) => setForm({ ...form, skillsWanted: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Short Bio</label>
                  <textarea placeholder="Tell others about yourself..." value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    rows={2} style={{ ...inputStyle, resize: "none" }} />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setFormStep(1)}
                    className="flex-1 py-3 rounded-xl font-semibold text-sm"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
                    ← Back
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #4f46e5, #06b6d4)" }}>
                    {loading ? "Sending OTP..." : "Send Verification OTP"}
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* OTP VERIFICATION STEP */}
        {step === "otp" && (
          <form onSubmit={handleVerifyAndCreate} className="space-y-6">
            <div>
              <p className="text-white/50 text-sm text-center mb-4">
                Enter the 6-digit code sent to <strong className="text-white/80">{form.email}</strong>
              </p>
              <div className="flex gap-2 justify-center">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`reg-otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="text-center text-xl font-bold transition focus:outline-none"
                    style={{
                      width: "48px", height: "56px",
                      background: digit ? "rgba(79,70,229,0.2)" : "rgba(255,255,255,0.07)",
                      border: `2px solid ${digit ? "#4f46e5" : "rgba(255,255,255,0.12)"}`,
                      borderRadius: "12px", color: "#f1f5f9",
                    }}
                  />
                ))}
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #4f46e5, #06b6d4)" }}>
              {loading ? "Creating Account..." : "Verify & Create Account"}
            </button>
            <div className="text-center">
              <button type="button" onClick={resendOTP} disabled={loading}
                className="text-indigo-400 hover:text-indigo-300 text-sm font-medium disabled:opacity-50">
                Didn't receive it? Resend OTP
              </button>
            </div>
            <button type="button" onClick={() => setStep("form")} className="w-full text-white/30 hover:text-white/60 text-sm transition">
              ← Change email
            </button>
          </form>
        )}

        <p className="text-center text-white/30 text-sm mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign In</Link>
        </p>
      </div>
    </main>
  );
}