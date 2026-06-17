"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  FileText,
  Settings,
  Mail,
  LogOut,
  Upload,
  X,
  Check,
  Loader2,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
  hasResume: boolean;
}

type LLMProvider = "public" | "openai" | "google" | "anthropic" | "vercel";

const LLM_PROVIDERS: LLMProvider[] = ["public", "openai", "google", "anthropic", "vercel"];

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"generate" | "resume" | "llm">("generate");
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [provider, setProvider] = useState<LLMProvider>("public");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  const [resumeText, setResumeText] = useState("");
  const [savingResume, setSavingResume] = useState(false);

  const [jobDescription, setJobDescription] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRaw, setGeneratedRaw] = useState("");
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [resumePdf, setResumePdf] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const err = urlParams.get("auth_error");
    if (err) {
      setAuthError(err);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    fetchSession();
    const savedProvider = localStorage.getItem("ai-job-apply-provider");
    const savedModel = localStorage.getItem("ai-job-apply-model");
    const savedKey = localStorage.getItem("ai-job-apply-key");
    if (savedProvider && LLM_PROVIDERS.includes(savedProvider as LLMProvider)) {
      setProvider(savedProvider as LLMProvider);
    } else {
      setProvider("public");
      localStorage.setItem("ai-job-apply-provider", "public");
    }
    if (savedModel) setModel(savedModel);
    if (savedKey) setApiKey(savedKey);
  }, []);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (activeTab !== "generate") return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (!item.type.startsWith("image/")) continue;
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) break;
        setImageName(`clipboard-${Date.now()}-${file.name || "image.png"}`);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImage(reader.result as string);
        };
        reader.readAsDataURL(file);
        break;
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [activeTab]);

  const handleProviderChange = (newProvider: LLMProvider) => {
    setProvider(newProvider);
    if (newProvider === "openai") setModel("gpt-4o");
    if (newProvider === "google") setModel("gemini-1.5-flash");
    if (newProvider === "anthropic") setModel("claude-3-5-sonnet-20240620");
    if (newProvider === "vercel") setModel("openai/gpt-5.5");
  };

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        fetchResume();
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Session load error", err);
    } finally {
      setLoadingSession(false);
    }
  };

  const fetchResume = async () => {
    try {
      const res = await fetch("/api/resume");
      const data = await res.json();
      if (data.resume) {
        setResumeText(data.resume);
      }
    } catch (err) {
      console.error("Resume load error", err);
    }
  };

  const showNotification = (type: "success" | "error", text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleLogin = () => {
    window.location.href = "/api/auth/login";
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      showNotification("success", "Logged out successfully.");
    } catch {
      showNotification("error", "Logout failed.");
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This will permanently remove all your data including resume, sent applications, and OAuth tokens. This action cannot be undone.")) {
      return;
    }
    setIsDeleting(true);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (res.ok) {
        setUser(null);
        setResumeText("");
        setResumePdf(null);
        setGeneratedRaw("");
        showNotification("success", "Account deleted successfully.");
      } else {
        const data = await res.json();
        showNotification("error", data.error || "Failed to delete account.");
      }
    } catch {
      showNotification("error", "Connection error. Failed to delete account.");
    } finally {
      setIsDeleting(false);
    }
  };

  const saveLLMConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("ai-job-apply-provider", provider);
    localStorage.setItem("ai-job-apply-model", model);
    localStorage.setItem("ai-job-apply-key", apiKey);
    showNotification("success", "LLM configurations saved locally in browser.");
  };

  const saveResume = async () => {
    setSavingResume(true);
    try {
      const res = await fetch("/api/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume: resumeText }),
      });
      if (res.ok) {
        showNotification("success", "Resume saved successfully.");
        if (user) {
          setUser({ ...user, hasResume: !!resumeText.trim() });
        }
      } else {
        const data = await res.json();
        showNotification("error", data.error || "Failed to save resume.");
      }
    } catch {
      showNotification("error", "Connection error. Failed to save resume.");
    } finally {
      setSavingResume(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImage(null);
    setImageName(null);
  };

  const handleResumePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      showNotification("error", "Please upload a PDF resume.");
      e.target.value = "";
      return;
    }
    setResumePdf(file);
  };

  const clearResumePdf = () => {
    setResumePdf(null);
  };

  const generateEmail = async () => {
    if (!jobDescription && !image) {
      showNotification("error", "At least a job description text or a job poster image is required.");
      return;
    }
    const savedKey = localStorage.getItem("ai-job-apply-key");
    const savedProvider = localStorage.getItem("ai-job-apply-provider");
    const savedModel = localStorage.getItem("ai-job-apply-model");
    if (!savedProvider || (savedProvider !== "vercel" && savedProvider !== "public" && !savedKey)) {
      showNotification("error", "Please configure and save your LLM Settings first.");
      setActiveTab("llm");
      return;
    }
    setIsGenerating(true);
    setGeneratedRaw("");
    setSubject("");
    setEmailBody("");
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription,
          image,
          provider: savedProvider,
          model: savedModel,
          apiKey: savedKey || undefined,
        }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to initiate generation.");
      }
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body stream reader.");
      const decoder = new TextDecoder();
      let accumulatedText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        accumulatedText += chunk;
        setGeneratedRaw(accumulatedText);
        if (accumulatedText.includes("Subject:") || accumulatedText.includes("To:")) {
          const lines = accumulatedText.split("\n");
          const recipientLineIndex = lines.findIndex((l) => l.startsWith("To:"));
          const subjectLineIndex = lines.findIndex((l) => l.startsWith("Subject:"));
          if (recipientLineIndex !== -1) {
            const extractedRecipient = lines[recipientLineIndex].replace("To:", "").trim();
            if (extractedRecipient) setRecipient(extractedRecipient);
          }
          if (subjectLineIndex !== -1) {
            const extractedSubject = lines[subjectLineIndex].replace("Subject:", "").trim();
            setSubject(extractedSubject);
            const bodyLines = lines.slice(subjectLineIndex + 1);
            setEmailBody(bodyLines.join("\n").trim());
          }
        } else {
          setEmailBody(accumulatedText);
        }
      }
      showNotification("success", "Email draft generated successfully!");
    } catch (err: unknown) {
      console.error(err);
      showNotification("error", err instanceof Error ? err.message : "Something went wrong during generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  const sendEmail = async () => {
    if (!recipient) {
      showNotification("error", "Recipient email is required.");
      return;
    }
    if (!subject) {
      showNotification("error", "Subject is required.");
      return;
    }
    if (!emailBody) {
      showNotification("error", "Email body content is required.");
      return;
    }
    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append("to", recipient);
      formData.append("subject", subject);
      formData.append("body", emailBody);
      if (resumePdf) {
        formData.append("resumePdf", resumePdf);
      }
      const res = await fetch("/api/send-email", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        showNotification("success", "Email sent successfully through your Gmail!");
        setRecipient("");
        setSubject("");
        setEmailBody("");
        setGeneratedRaw("");
        setResumePdf(null);
      } else {
        showNotification("error", data.error || "Failed to send email.");
      }
    } catch {
      showNotification("error", "Connection error. Failed to send email.");
    } finally {
      setIsSending(false);
    }
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #C7D0C8, #DCE2DC)" }}>
        <div className="bg-card rounded-[28px] p-8 flex flex-col items-center gap-4 shadow-2xl">
          <Loader2 className="h-10 w-10 text-primary-custom animate-spin" />
          <span className="text-muted-foreground text-sm font-medium">Authenticating session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col justify-between font-sans relative overflow-hidden" style={{ background: "linear-gradient(135deg, #C7D0C8, #DCE2DC)" }}>
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] pointer-events-none" style={{ backgroundColor: "rgba(125, 201, 94, 0.12)" }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] pointer-events-none" style={{ backgroundColor: "rgba(205, 197, 107, 0.08)" }} />

        <header className="w-full px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary-custom flex items-center justify-center shadow-lg" style={{ boxShadow: "0 8px 24px rgba(125, 201, 94, 0.3)" }}>
              <img src="/icon.png" alt="" className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-card">
              AI Job Apply
            </span>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 flex flex-col justify-center items-center gap-10">
          {authError && (
            <div className="w-full max-w-md p-5 rounded-[20px] border border-coral-custom/30 bg-card text-coral-custom text-sm flex gap-3 items-center shadow-xl">
              <span className="text-lg">⚠️</span>
              <span>Authentication error: {authError}. Please try signing in again.</span>
            </div>
          )}

          <div className="flex flex-col items-center text-center gap-6 max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-card">
              Automate Job Applications <br />
              <span className="text-primary-custom">
                Directly from Your Gmail.
              </span>
            </h1>
            <p className="text-base md:text-lg font-medium leading-relaxed max-w-2xl" style={{ color: "#5a5f5a" }}>
              Paste descriptions or upload job posters. Our AI drafts context-aware application emails using your resume. Send them instantly using your Google account.
            </p>
          </div>

          <div className="w-full max-w-md bg-card p-8 rounded-[28px] flex flex-col gap-6 shadow-2xl relative">
            <h2 className="text-lg font-bold text-center text-white">Get Started Instantly</h2>
            <p className="text-sm text-center" style={{ color: "#8A8A8A" }}>
              Sign in with your Google Account. We will request permission to send emails via Gmail on your behalf.
            </p>
            <div className="text-[11px] text-center px-3 py-2.5 rounded-[16px] font-medium" style={{ backgroundColor: "#1a1a1a", color: "#666" }}>
              <strong className="text-zinc-400">Why we need Gmail access:</strong> The app uses the{" "}
              <code className="text-primary-custom">gmail.send</code> scope solely to send job application
              emails you draft through the app. We never read, delete, or manage your inbox.
              <br />
              <Link href="/privacy" className="text-primary-custom underline mt-1 inline-block">Privacy Policy</Link>
              {" · "}
              <Link href="/terms" className="text-primary-custom underline inline-block">Terms of Service</Link>
            </div>
            <button
              onClick={handleLogin}
              id="btn-google-login"
              className="w-full py-4 rounded-full bg-white hover:bg-zinc-100 text-card font-bold transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-.1.35-1.92 2.58l3.1 2.4c1.8-1.66 2.87-4.11 2.87-6.83z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.1-2.4c-.86.58-1.97.92-3.21.92-3.12 0-5.76-2.11-6.71-4.96L3.73 17.58C5.71 21.49 9.77 24 12 24z" />
                <path fill="#FBBC05" d="M5.29 14.65c-.24-.72-.38-1.5-.38-2.3a8.13 8.13 0 01.38-2.3L2.14 7.6C1.34 9.17.9 10.97.9 12.75s.44 3.58 1.24 5.15l3.15-2.4c.01-.25-.01.9-.05-.85z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.96 1.19 15.24 0 12 0 9.77 0 5.71 2.51 3.73 6.42l3.15 2.45c.95-2.85 3.59-4.96 6.71-4.96z" />
              </svg>
              Sign in with Google
            </button>
          </div>
        </main>

        <footer className="py-8 text-center text-xs font-medium" style={{ color: "#8A8A8A" }}>
          &copy; {new Date().getFullYear()} AI Job Apply. All rights reserved.
          <span className="mx-2">·</span>
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <span className="mx-2">·</span>
          <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between font-sans relative overflow-hidden" style={{ background: "linear-gradient(135deg, #C7D0C8, #DCE2DC)" }}>
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[100px] pointer-events-none" style={{ backgroundColor: "rgba(125, 201, 94, 0.06)" }} />

      <header className="sticky top-0 z-50 w-full px-4 sm:px-6 py-3 sm:py-4 backdrop-blur-xl" style={{ backgroundColor: "rgba(14, 14, 14, 0.85)" }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-2xl bg-primary-custom flex items-center justify-center shadow-lg">
              <img src="/icon.png" alt="" className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
            </div>
            <span className="text-base sm:text-lg font-bold text-white tracking-tight">AI Job Apply</span>
          </div>

          <nav className="hidden sm:flex items-center p-1.5 rounded-full" style={{ backgroundColor: "#1a1a1a" }}>
            <button
              onClick={() => setActiveTab("generate")}
              className={`px-5 py-2 text-xs font-bold rounded-full transition-all duration-200 flex items-center gap-2 ${
                activeTab === "generate"
                  ? "bg-primary-custom text-card shadow-lg"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generate
            </button>
            <button
              onClick={() => setActiveTab("resume")}
              className={`px-5 py-2 text-xs font-bold rounded-full transition-all duration-200 flex items-center gap-2 ${
                activeTab === "resume"
                  ? "bg-primary-custom text-card shadow-lg"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Resume
              {user.hasResume ? (
                <span className="h-1.5 w-1.5 bg-primary-custom rounded-full" />
              ) : (
                <span className="h-1.5 w-1.5 bg-yellow-custom rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("llm")}
              className={`px-5 py-2 text-xs font-bold rounded-full transition-all duration-200 flex items-center gap-2 ${
                activeTab === "llm"
                  ? "bg-primary-custom text-card shadow-lg"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              LLM Config
            </button>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full" style={{ backgroundColor: "#1a1a1a" }}>
              <img
                src={user.picture}
                alt={user.name}
                className="h-6 w-6 sm:h-7 sm:w-7 rounded-full border-2 border-primary-custom"
              />
              <span className="text-xs font-bold text-white hidden sm:inline">
                {user.name}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 sm:p-2.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="p-2 sm:p-2.5 rounded-full hover:bg-red-900/30 text-zinc-500 hover:text-coral-custom transition-colors"
              title="Delete Account"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 relative z-10 flex flex-col justify-start pb-28">
        {notification && (
          <div
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3.5 rounded-[20px] border shadow-2xl text-sm font-semibold transition-all duration-300 animate-slide-in ${
              notification.type === "success"
                ? "bg-primary-custom/15 border-primary-custom/30 text-primary-custom"
                : "bg-coral-custom/15 border-coral-custom/30 text-coral-custom"
            }`}
          >
            {notification.type === "success" ? "✓" : "⚠️"}
            <span>{notification.text}</span>
          </div>
        )}

        {activeTab === "generate" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="bg-card p-7 rounded-[28px] shadow-2xl flex flex-col gap-5">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="text-primary-custom">1.</span> Provide Job Details
                  </h2>
                  <p className="text-xs mt-1.5 font-medium" style={{ color: "#8A8A8A" }}>
                    Supply a job description, upload a job poster image, or do both.
                  </p>
                </div>

                <div className="flex flex-col gap-2.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Job Description</label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the job description, role overview, or email prompt details..."
                    className="w-full h-40 rounded-[20px] p-4 text-sm outline-none transition-all text-white resize-none border-2 border-transparent focus:border-primary-custom/50"
                    style={{ backgroundColor: "#1a1a1a" }}
                  />
                </div>

                <div className="flex flex-col gap-2.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Job Poster Image</label>
                  {image ? (
                    <div className="relative rounded-[20px] overflow-hidden p-3 flex items-center justify-between border-2 border-primary-custom/30" style={{ backgroundColor: "#1a1a1a" }}>
                      <div className="flex items-center gap-3">
                        <img
                          src={image}
                          alt="Poster Preview"
                          className="h-14 w-14 object-cover rounded-xl"
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white truncate max-w-[150px] md:max-w-[200px]">
                            {imageName}
                          </span>
                          <span className="text-[10px] text-primary-custom font-bold uppercase tracking-wider">
                            Ready
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={clearImage}
                        className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-zinc-700 hover:border-primary-custom/50 rounded-[20px] p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 hover:bg-primary-custom/5" style={{ backgroundColor: "rgba(26, 26, 26, 0.5)" }}>
                      <Upload className="h-5 w-5 text-zinc-500" />
                      <span className="text-xs text-zinc-400 font-semibold">Click to upload image</span>
                      <span className="text-[10px]" style={{ color: "#666" }}>PNG, JPG, or WEBP — or paste from clipboard (Ctrl+V / ⌘V)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <button
                  onClick={generateEmail}
                  disabled={isGenerating || (!jobDescription.trim() && !image)}
                  className="w-full py-4 rounded-full bg-primary-custom hover:bg-primary-custom/90 disabled:opacity-40 text-card font-bold flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Streaming Email Draft...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate Application Email
                    </>
                  )}
                </button>
              </div>

              {!user.hasResume && (
                <div className="bg-yellow-custom/10 border border-yellow-custom/20 p-5 rounded-[20px] text-xs font-medium flex items-start gap-3" style={{ color: "#CDC56B" }}>
                  <span className="text-sm">⚠️</span>
                  <div>
                    <span className="font-bold">Resume is empty!</span> Go to the{" "}
                    <button onClick={() => setActiveTab("resume")} className="underline font-bold" style={{ color: "#CDC56B" }}>
                      Resume tab
                    </button>{" "}
                    to save a resume. The generator uses it to write a personalized application.
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-7 flex flex-col gap-6">
              {!generatedRaw && !isGenerating ? (
                <div className="h-full min-h-[350px] rounded-[28px] bg-card flex flex-col items-center justify-center gap-4 text-center p-8 shadow-xl">
                  <div className="h-14 w-14 rounded-full flex items-center justify-center" style={{ backgroundColor: "#1a1a1a" }}>
                    <Mail className="h-6 w-6 text-zinc-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-300">No email generated</h3>
                    <p className="text-xs max-w-sm mt-1.5" style={{ color: "#8A8A8A" }}>
                      Fill in the job details on the left and click generate to stream your tailored application email.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-card p-7 rounded-[28px] shadow-2xl flex flex-col gap-5">
                  <div className="flex items-center justify-between pb-4" style={{ borderBottom: "1px solid #1e1e1e" }}>
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="text-primary-custom">2.</span> Review & Send Email
                      </h2>
                      <p className="text-xs mt-1.5 font-medium" style={{ color: "#8A8A8A" }}>
                        Edit the generated content and send it to the hiring manager.
                      </p>
                    </div>
                    {isGenerating && (
                      <span className="text-xs bg-primary-custom/15 text-primary-custom px-3 py-1 rounded-full font-bold flex items-center gap-1.5 animate-pulse">
                        <span className="h-1.5 w-1.5 bg-primary-custom rounded-full animate-ping" />
                        AI Streaming
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Recipient Email (To:)</label>
                      <input
                        type="email"
                        placeholder="hiring-manager@company.com"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        className="w-full rounded-[20px] px-5 py-3 text-sm outline-none text-white transition-all border-2 border-transparent focus:border-primary-custom/50"
                        style={{ backgroundColor: "#1a1a1a" }}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Subject</label>
                      <input
                        type="text"
                        placeholder="Application for [Position]"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full rounded-[20px] px-5 py-3 text-sm outline-none text-white transition-all border-2 border-transparent focus:border-primary-custom/50"
                        style={{ backgroundColor: "#1a1a1a" }}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Email Body</label>
                      <textarea
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        className="w-full h-80 rounded-[20px] p-5 text-sm outline-none text-white transition-all resize-y font-sans border-2 border-transparent focus:border-primary-custom/50"
                        style={{ backgroundColor: "#1a1a1a" }}
                      />
                    </div>

                    <div className="flex flex-col gap-2.5">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Resume PDF Attachment</label>
                      {resumePdf ? (
                        <div className="flex items-center justify-between gap-3 px-5 py-3.5 rounded-[20px] border-2 border-primary-custom/30" style={{ backgroundColor: "#1a1a1a" }}>
                          <div className="min-w-0 flex items-center gap-3">
                            <FileText className="h-4 w-4 text-zinc-400 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate">{resumePdf.name}</p>
                              <p className="text-[10px]" style={{ color: "#8A8A8A" }}>Will be attached as a PDF</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={clearResumePdf}
                            className="text-zinc-500 hover:text-coral-custom transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center gap-3 cursor-pointer border-2 border-dashed border-zinc-700 px-5 py-3.5 rounded-[20px] hover:border-primary-custom/50 transition-all hover:bg-primary-custom/5" style={{ backgroundColor: "rgba(26, 26, 26, 0.5)" }}>
                          <Upload className="h-4 w-4 text-zinc-500" />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-zinc-300">Upload resume PDF</span>
                            <span className="text-[10px]" style={{ color: "#8A8A8A" }}>Optional. Attached only to this email.</span>
                          </div>
                          <input
                            type="file"
                            accept="application/pdf,.pdf"
                            onChange={handleResumePdfUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    <button
                      onClick={sendEmail}
                      disabled={isSending || isGenerating || !recipient.trim()}
                      className="w-full py-4 rounded-full bg-white hover:bg-zinc-100 disabled:opacity-40 text-card font-bold flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending Email via Gmail API...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4" />
                          Send Application Email
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "resume" && (
          <div className="max-w-3xl w-full mx-auto bg-card p-8 rounded-[28px] shadow-2xl flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary-custom" />
                Resume Settings
              </h2>
              <p className="text-xs mt-1.5 font-medium" style={{ color: "#8A8A8A" }}>
                Save your resume details in plain text. The AI uses this description to custom-match your skills to incoming jobs.
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Plain Text Resume</label>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your plain-text resume here... (Include Work Experience, Skills, Contact Info, Education, and Projects)"
                className="w-full h-96 rounded-[20px] p-5 text-sm outline-none text-white transition-all resize-y font-mono border-2 border-transparent focus:border-primary-custom/50"
                style={{ backgroundColor: "#1a1a1a" }}
              />
            </div>

            <button
              onClick={saveResume}
              disabled={savingResume}
              className="py-4 rounded-full bg-white hover:bg-zinc-100 text-card font-bold flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] w-full"
            >
              {savingResume ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Resume...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Save Resume Details
                </>
              )}
            </button>
          </div>
        )}

        {activeTab === "llm" && (
          <div className="max-w-xl w-full mx-auto bg-card p-8 rounded-[28px] shadow-2xl flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary-custom" />
                LLM Provider Configurations
              </h2>
              <p className="text-xs mt-1.5 font-medium" style={{ color: "#8A8A8A" }}>
                Configure your API key and model choice. Keys are saved 100% locally in your browser&apos;s local storage and are never uploaded to our server database.
              </p>
            </div>

            <form onSubmit={saveLLMConfig} className="flex flex-col gap-5">
              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">LLM Provider</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {LLM_PROVIDERS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleProviderChange(p)}
                      className={`py-3.5 rounded-[20px] border-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                        provider === p
                          ? "border-primary-custom bg-primary-custom/15 text-primary-custom"
                          : "border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
                      }`}
                      style={{ backgroundColor: provider === p ? undefined : "#1a1a1a" }}
                    >
                      {p === "public" ? "Public" : p === "vercel" ? "Vercel" : p}
                    </button>
                  ))}
                </div>
                {provider === "public" && (
                  <span className="text-[11px] font-medium" style={{ color: "#8A8A8A" }}>
                    Uses the server-configured OpenAI-compatible API. No API key needed from you.
                  </span>
                )}
              </div>

              {provider !== "public" && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Model Name</label>
                <input
                  type="text"
                  placeholder={
                    provider === "openai"
                      ? "gpt-4o"
                      : provider === "google"
                      ? "gemini-1.5-flash"
                      : provider === "anthropic"
                      ? "claude-3-5-sonnet-20240620"
                      : "openai/gpt-5.5"
                  }
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full rounded-[20px] px-5 py-3 text-sm outline-none text-white transition-all border-2 border-transparent focus:border-primary-custom/50"
                  style={{ backgroundColor: "#1a1a1a" }}
                  required
                />
                <span className="text-[10px] font-medium" style={{ color: "#8A8A8A" }}>
                  {provider === "openai" && "* Suggested: gpt-4o, gpt-4o-mini, gpt-4-turbo"}
                  {provider === "google" && "* Suggested: gemini-1.5-flash, gemini-1.5-pro"}
                  {provider === "anthropic" && "* Suggested: claude-3-5-sonnet-20240620, claude-3-haiku-20240307"}
                  {provider === "vercel" && "* Suggested: openai/gpt-5.5, anthropic/claude-sonnet-4.5, google/gemini-2.5-pro"}
                </span>
              </div>
              )}

              {provider !== "public" && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    API Key{provider === "vercel" ? " (optional with server AI_GATEWAY_API_KEY)" : ""}
                  </label>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    placeholder={`Paste your ${provider === "vercel" ? "Vercel AI Gateway" : provider.toUpperCase()} API Key...`}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full rounded-[20px] pl-5 pr-12 py-3 text-sm outline-none text-white transition-all font-mono border-2 border-transparent focus:border-primary-custom/50"
                    style={{ backgroundColor: "#1a1a1a" }}
                    required={provider !== "vercel"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-4 top-3.5 text-zinc-500 hover:text-zinc-300"
                  >
                    {showKey ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>
              )}

              <button
                type="submit"
                className="py-4 rounded-full bg-white hover:bg-zinc-100 text-card font-bold flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] w-full mt-2"
              >
                <Check className="h-4 w-4" />
                Save configurations
              </button>
            </form>
          </div>
        )}
      </main>

      <footer className="hidden sm:block py-8 px-6" style={{ backgroundColor: "rgba(14, 14, 14, 0.6)" }}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 text-xs font-medium" style={{ color: "#8A8A8A" }}>
          <div>&copy; {new Date().getFullYear()} AI Job Apply. All rights reserved.</div>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <span style={{ color: "#666" }}>Saved: LocalStorage & MongoDB (aijobapply)</span>
          </div>
        </div>
      </footer>

      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 p-1.5 rounded-full shadow-2xl sm:hidden" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 -4px 30px rgba(0,0,0,0.15)" }}>
        <button
          onClick={() => setActiveTab("generate")}
          className={`relative flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold transition-all duration-200 ${
            activeTab === "generate"
              ? "bg-card text-primary-custom shadow-lg"
              : "text-zinc-500"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="hidden min-[380px]:inline">Generate</span>
        </button>
        <button
          onClick={() => setActiveTab("resume")}
          className={`relative flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold transition-all duration-200 ${
            activeTab === "resume"
              ? "bg-card text-primary-custom shadow-lg"
              : "text-zinc-500"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span className="hidden min-[380px]:inline">Resume</span>
          {user.hasResume ? (
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-primary-custom rounded-full" />
          ) : (
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-yellow-custom rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("llm")}
          className={`relative flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold transition-all duration-200 ${
            activeTab === "llm"
              ? "bg-card text-primary-custom shadow-lg"
              : "text-zinc-500"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span className="hidden min-[380px]:inline">Config</span>
        </button>
      </nav>
    </div>
  );
}
