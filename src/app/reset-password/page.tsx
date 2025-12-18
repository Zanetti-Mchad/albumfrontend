"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiMail, FiPhone, FiLock, FiKey } from "react-icons/fi";

export default function ResetPassword() {
  const router = useRouter();
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4210/api/v1';
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<"request" | "otp" | "password">("request");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const sendOtpViaEgoSms = async (to: string, code: string, expiryMinutes: number) => {
    const res = await fetch('/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, code, expiryMinutes }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok) {
      throw new Error(data?.error || 'Failed to send SMS via EgoSMS');
    }
    return data;
  };

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!identifier.trim()) {
      setError("Please enter your email or phone.");
      return;
    }
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/auth/request-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ identifier })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.status?.returnMessage || data?.message || 'Failed to initiate password reset');
      }

      setStep("otp");
      const delivery = data?.data?.delivery || (/^\d/.test(identifier) ? 'sms' : 'email');
      const expiry = typeof data?.data?.expiresInSeconds === 'number' ? data.data.expiresInSeconds : 300;
      setMessage(`OTP sent via ${delivery}. Expires in ${Math.ceil(expiry / 60)} min.`);

      // Debug: log OTP/token if backend returns it (useful in dev/test)
      const possibleOtp = data?.data?.otp || data?.data?.token || data?.otp || data?.token;
      if (possibleOtp) {
        console.log('Received OTP from backend (dev only):', possibleOtp);
      }

      // If user typed a phone number and backend returned the OTP, also send via EgoSMS
      if (/^\d/.test(identifier) && possibleOtp) {
        try {
          await sendOtpViaEgoSms(identifier, possibleOtp, Math.ceil(expiry / 60));
          setMessage(`OTP sent via SMS. Expires in ${Math.ceil(expiry / 60)} min.`);
        } catch (smsErr) {
          console.error('Failed to send OTP via EgoSMS:', smsErr);
          setMessage(`OTP sent. SMS delivery failed, please check your messages or retry.`);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate password reset');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!otp || otp.length !== 6) {
      setError("OTP must be 6 digits.");
      return;
    }
    // Move to password step; verification happens on reset request
    setStep("password");
    setMessage(null);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }
    if (confirmPassword.length < 4) {
      setError("Confirm password must be at least 4 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: otp,
          newPassword,
          // identifier is optional per controller; include if present
          ...(identifier ? { identifier } : {})
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.status?.returnMessage || data?.message || 'Failed to reset password');
      }

      setMessage("Password reset successful! You can now sign in.");
      // Optional: could auto-verify by logging in, but we'll redirect to login
      setTimeout(() => {
        router.push("/");
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-blue-50 p-4">
      <div className="bg-white/90 rounded-2xl shadow-xl p-8 w-full max-w-md flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-2 text-indigo-700">Reset Password</h2>
        <p className="text-gray-500 mb-6 text-center text-sm">
          Enter your email or phone to receive a one-time password (OTP).
        </p>
        {error && (
          <div className="mb-2 text-center text-red-600 font-medium text-sm">{error}</div>
        )}
        {message && (
          <div className="mb-4 text-center text-green-600 font-medium text-sm">{message}</div>
        )}
        {step === "request" && (
          <form onSubmit={handleRequest} className="w-full space-y-6">
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1">
                Email or Phone
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {/^\d/.test(identifier) ? (
                    <FiPhone className="h-5 w-5 text-gray-400" />
                  ) : (
                    <FiMail className="h-5 w-5 text-gray-400" />
                  )}
                </span>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  required
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                  placeholder="you@example.com or 0712345678"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-60"
            >
              {isLoading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}
        {step === "otp" && (
          <form onSubmit={handleOtp} className="w-full space-y-6">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                OTP
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiKey className="h-5 w-5 text-gray-400" />
                </span>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  required
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                  placeholder="Enter OTP"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-60"
            >
              {isLoading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        )}
        {step === "password" && (
          <form onSubmit={handleReset} className="w-full space-y-6">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </span>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  minLength={4}
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                  placeholder="Enter new password"
                />
              </div>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </span>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  minLength={4}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                  placeholder="Confirm new password"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-60"
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
