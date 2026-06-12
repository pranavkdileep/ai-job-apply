"use client";

import React, { useState, useEffect } from "react";
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
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
  hasResume: boolean;
}

export default function Home() {
  // Authentication & session state
  const [user, setUser] = useState<User | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Layout state
  const [activeTab, setActiveTab] = useState<"generate" | "resume" | "llm">("generate");
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // LLM Configuration state (localStorage)
  const [provider, setProvider] = useState<"openai" | "google" | "anthropic">("openai");
  const [model, setModel] = useState("gpt-4o");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  // Resume state
  const [resumeText, setResumeText] = useState("");
  const [savingResume, setSavingResume] = useState(false);

  // Email Generator Inputs
  const [jobDescription, setJobDescription] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);

  // Generated Email Output & Send form
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRaw, setGeneratedRaw] = useState("");
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [attachResume, setAttachResume] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Load session & local config on mount
  useEffect(() => {
    // 1. Check for auth errors in URL
    const urlParams = new URLSearchParams(window.location.search);
    const err = urlParams.get("auth_error");
    if (err) {
      setAuthError(err);
      // Clean URL query
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // 2. Fetch user session
    fetchSession();

    // 3. Load LLM configuration from localStorage
    const savedProvider = localStorage.getItem("ai-job-apply-provider");
    const savedModel = localStorage.getItem("ai-job-apply-model");
    const savedKey = localStorage.getItem("ai-job-apply-key");

    if (savedProvider) setProvider(savedProvider as any);
    if (savedModel) setModel(savedModel);
    if (savedKey) setApiKey(savedKey);
  }, []);

  // Update default models when provider changes
  const handleProviderChange = (newProvider: "openai" | "google" | "anthropic") => {
    setProvider(newProvider);
    if (newProvider === "openai") setModel("gpt-4o");
    if (newProvider === "google") setModel("gemini-1.5-flash");
    if (newProvider === "anthropic") setModel("claude-3-5-sonnet-20240620");
  };

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        // If user is logged in, fetch their stored resume
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
    } catch (err) {
      showNotification("error", "Logout failed.");
    }
  };

  // Save LLM Config to LocalStorage
  const saveLLMConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("ai-job-apply-provider", provider);
    localStorage.setItem("ai-job-apply-model", model);
    localStorage.setItem("ai-job-apply-key", apiKey);
    showNotification("success", "LLM configurations saved locally in browser.");
  };

  // Save resume to DB
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
    } catch (err) {
      showNotification("error", "Connection error. Failed to save resume.");
    } finally {
      setSavingResume(false);
    }
  };

  // File Upload handler (Convert to Base64)
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

  // Call API to generate email stream
  const generateEmail = async () => {
    if (!jobDescription && !image) {
      showNotification("error", "At least a job description text or a job poster image is required.");
      return;
    }

    const savedKey = localStorage.getItem("ai-job-apply-key");
    const savedProvider = localStorage.getItem("ai-job-apply-provider");
    const savedModel = localStorage.getItem("ai-job-apply-model");

    if (!savedKey || !savedProvider || !savedModel) {
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
          apiKey: savedKey,
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
        
        // Dynamically update subject and body fields for edit panel
        if (accumulatedText.includes("Subject:")) {
          const lines = accumulatedText.split("\n");
          const subjectLineIndex = lines.findIndex(l => l.startsWith("Subject:"));
          if (subjectLineIndex !== -1) {
            const extractedSubject = lines[subjectLineIndex].replace("Subject:", "").trim();
            setSubject(extractedSubject);
            
            // Collect the body following the Subject line
            const bodyLines = lines.slice(subjectLineIndex + 1);
            setEmailBody(bodyLines.join("\n").trim());
          }
        } else {
          setEmailBody(accumulatedText);
        }
      }

      showNotification("success", "Email draft generated successfully!");
    } catch (err: any) {
      console.error(err);
      showNotification("error", err.message || "Something went wrong during generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Send email via Gmail
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
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipient,
          subject,
          body: emailBody,
          attachResume: attachResume && user?.hasResume,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showNotification("success", "Email sent successfully through your Gmail!");
        // Clear outputs
        setRecipient("");
        setSubject("");
        setEmailBody("");
        setGeneratedRaw("");
      } else {
        showNotification("error", data.error || "Failed to send email.");
      }
    } catch (err) {
      showNotification("error", "Connection error. Failed to send email.");
    } finally {
      setIsSending(false);
    }
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-primary-custom animate-spin" />
          <span className="text-zinc-400 text-sm">Authenticating session...</span>
        </div>
      </div>
    );
  }

  // Not Logged In View
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col justify-between font-sans bg-background text-foreground relative overflow-hidden">
        {/* Glow backgrounds */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-500/10 blur-[120px] pointer-events-none" />

        {/* Top Header */}
        <header className="w-full border-b border-zinc-800 bg-zinc-950/60 backdrop-blur-md px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              AI Job Apply
            </span>
          </div>
        </header>

        {/* Main Content Hero */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-16 flex flex-col justify-center items-center gap-10">
          {authError && (
            <div className="w-full max-w-md p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm flex gap-3 items-center">
              <span className="text-lg">⚠️</span>
              <span>Authentication error: {authError}. Please try signing in again.</span>
            </div>
          )}

          <div className="flex flex-col items-center text-center gap-6 max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight text-white">
              Automate Job Applications <br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-500 bg-clip-text text-transparent">
                Directly from Your Gmail.
              </span>
            </h1>
            <p className="text-base md:text-xl text-zinc-400 leading-relaxed max-w-2xl">
              Paste descriptions or upload job posters. Our AI drafts context-aware application emails using your resume. Send them instantly using your Google account.
            </p>
          </div>

          <div className="w-full max-w-md bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-xl p-8 rounded-2xl flex flex-col gap-6 shadow-2xl relative">
            <h2 className="text-lg font-bold text-center text-white">Get Started Instantly</h2>
            <p className="text-zinc-400 text-sm text-center">
              Sign in with your Google Account. We will request permissions to send emails via Gmail on your behalf.
            </p>
            <button
              onClick={handleLogin}
              id="btn-google-login"
              className="w-full py-3.5 rounded-full bg-white hover:bg-zinc-100 text-black font-semibold transition-all duration-200 flex items-center justify-center gap-3 shadow-md"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-.1.35-1.92 2.58l3.1 2.4c1.8-1.66 2.87-4.11 2.87-6.83z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.1-2.4c-.86.58-1.97.92-3.21.92-3.12 0-5.76-2.11-6.71-4.96L3.73 17.58C5.71 21.49 9.77 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.29 14.65c-.24-.72-.38-1.5-.38-2.3a8.13 8.13 0 01.38-2.3L2.14 7.6C1.34 9.17.9 10.97.9 12.75s.44 3.58 1.24 5.15l3.15-2.4c.01-.25-.01.9-.05-.85z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.96 1.19 15.24 0 12 0 9.77 0 5.71 2.51 3.73 6.42l3.15 2.45c.95-2.85 3.59-4.96 6.71-4.96z"
                />
              </svg>
              Sign in with Google
            </button>
          </div>
        </main>

        <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-500">
          &copy; {new Date().getFullYear()} AI Job Apply. All rights reserved.
        </footer>
      </div>
    );
  }

  // Logged In Dashboard View
  return (
    <div className="min-h-screen flex flex-col justify-between font-sans bg-background text-foreground relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-violet-500/5 blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-500 to-violet-600 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">AI Job Apply</span>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center bg-zinc-900 border border-zinc-800 p-1 rounded-full">
            <button
              onClick={() => setActiveTab("generate")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 flex items-center gap-2 ${
                activeTab === "generate"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generate
            </button>
            <button
              onClick={() => setActiveTab("resume")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 flex items-center gap-2 ${
                activeTab === "resume"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Resume
              {user.hasResume ? (
                <span className="h-1.5 w-1.5 bg-green-500 rounded-full" />
              ) : (
                <span className="h-1.5 w-1.5 bg-yellow-500 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("llm")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 flex items-center gap-2 ${
                activeTab === "llm"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              LLM Config
            </button>
          </nav>

          {/* User profile dropdown & logout */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 bg-zinc-900/60 border border-zinc-800/80 px-3 py-1.5 rounded-full">
              <img
                src={user.picture}
                alt={user.name}
                className="h-6 w-6 rounded-full border border-zinc-700"
              />
              <span className="text-xs font-semibold text-zinc-200 hidden sm:inline">
                {user.name}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-full border border-zinc-800 hover:border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors shadow-sm"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 relative z-10 flex flex-col justify-start">
        {/* Floating Notification */}
        {notification && (
          <div
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border shadow-xl text-sm transition-all duration-300 animate-slide-in ${
              notification.type === "success"
                ? "bg-green-500/10 border-green-500/20 text-green-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}
          >
            {notification.type === "success" ? "✓" : "⚠️"}
            <span>{notification.text}</span>
          </div>
        )}

        {/* Generate Email Tab */}
        {activeTab === "generate" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Inputs Panel */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl shadow-xl flex flex-col gap-5">
                <div>
                  <h2 className="text-md font-bold text-white flex items-center gap-2">
                    <span>1.</span> Provide Job Details
                  </h2>
                  <p className="text-zinc-500 text-xs mt-1">
                    Supply a job description, upload a job poster image, or do both.
                  </p>
                </div>

                {/* Job Description Text */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-zinc-400">Job Description</label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the job description, role overview, or email prompt details..."
                    className="w-full h-40 bg-zinc-950/60 border border-zinc-800 focus:border-zinc-700 rounded-xl p-3.5 text-sm outline-none transition-colors text-zinc-200 resize-none"
                  />
                </div>

                {/* Job Poster Image Upload */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-zinc-400">Job Poster Image</label>
                  {image ? (
                    <div className="relative rounded-xl border border-zinc-800 overflow-hidden bg-zinc-950/40 p-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={image}
                          alt="Poster Preview"
                          className="h-14 w-14 object-cover rounded-lg border border-zinc-800"
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-zinc-300 truncate max-w-[150px] md:max-w-[200px]">
                            {imageName}
                          </span>
                          <span className="text-[10px] text-green-500 font-semibold uppercase tracking-wider">
                            Ready
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={clearImage}
                        className="p-1.5 rounded-full hover:bg-zinc-850 text-zinc-400 hover:text-white transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="border border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-950/20 hover:bg-zinc-950/40 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200">
                      <Upload className="h-5 w-5 text-zinc-500" />
                      <span className="text-xs text-zinc-400 font-medium">Click to upload image</span>
                      <span className="text-[10px] text-zinc-600">PNG, JPG, or WEBP up to 5MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Generate Action Button */}
                <button
                  onClick={generateEmail}
                  disabled={isGenerating || (!jobDescription.trim() && !image)}
                  className="w-full py-3 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:opacity-40 text-white font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-lg"
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

              {/* Tips / Warning */}
              {!user.hasResume && (
                <div className="bg-yellow-500/5 border border-yellow-500/15 p-4 rounded-xl text-xs text-yellow-500/80 flex items-start gap-3">
                  <span className="text-sm">⚠️</span>
                  <div>
                    <span className="font-bold">Resume is empty!</span> Go to the{" "}
                    <button onClick={() => setActiveTab("resume")} className="underline font-bold text-yellow-500">
                      Resume tab
                    </button>{" "}
                    to save a resume. The generator uses it to write a personalized application.
                  </div>
                </div>
              )}
            </div>

            {/* Right Output & Send Panel */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* If no email generated yet, show placeholder */}
              {!generatedRaw && !isGenerating ? (
                <div className="h-full min-h-[350px] rounded-2xl border border-zinc-800 bg-zinc-950/20 flex flex-col items-center justify-center gap-4 text-center p-8">
                  <div className="h-12 w-12 rounded-full bg-zinc-900 border border-zinc-850 flex items-center justify-center text-zinc-500">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-300">No email generated</h3>
                    <p className="text-xs text-zinc-500 max-w-sm mt-1">
                      Fill in the job details on the left and click generate to stream your tailored application email.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl shadow-xl flex flex-col gap-5">
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
                    <div>
                      <h2 className="text-md font-bold text-white flex items-center gap-2">
                        <span>2.</span> Review & Send Email
                      </h2>
                      <p className="text-zinc-500 text-xs mt-1">
                        Edit the generated content and send it to the hiring manager.
                      </p>
                    </div>
                    {isGenerating && (
                      <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1.5 animate-pulse">
                        <span className="h-1.5 w-1.5 bg-blue-400 rounded-full animate-ping" />
                        AI Streaming
                      </span>
                    )}
                  </div>

                  {/* Send Email Form Inputs */}
                  <div className="flex flex-col gap-4">
                    {/* Recipient */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-zinc-400">Recipient Email (To:)</label>
                      <input
                        type="email"
                        placeholder="hiring-manager@company.com"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        className="w-full bg-zinc-950/60 border border-zinc-800 focus:border-zinc-700 rounded-xl px-4 py-2.5 text-sm outline-none text-zinc-200 transition-colors"
                      />
                    </div>

                    {/* Subject */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-zinc-400">Subject</label>
                      <input
                        type="text"
                        placeholder="Application for [Position]"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full bg-zinc-950/60 border border-zinc-800 focus:border-zinc-700 rounded-xl px-4 py-2.5 text-sm outline-none text-zinc-200 transition-colors"
                      />
                    </div>

                    {/* Body */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-zinc-400">Email Body</label>
                      <textarea
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        className="w-full h-80 bg-zinc-950/60 border border-zinc-800 focus:border-zinc-700 rounded-xl p-4 text-sm outline-none text-zinc-200 transition-colors resize-y font-sans"
                      />
                    </div>

                    {/* Attach Resume Checkbox */}
                    {user.hasResume ? (
                      <label className="flex items-center gap-3 cursor-pointer bg-zinc-950/40 border border-zinc-800/80 px-4 py-3 rounded-xl hover:bg-zinc-950/70 transition-colors">
                        <input
                          type="checkbox"
                          checked={attachResume}
                          onChange={(e) => setAttachResume(e.target.checked)}
                          className="h-4 w-4 rounded border-zinc-800 text-blue-600 bg-zinc-950 focus:ring-0 focus:ring-offset-0"
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-zinc-300">
                            Attach saved resume
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            Attaches your plain-text resume as "resume.txt"
                          </span>
                        </div>
                      </label>
                    ) : (
                      <div className="bg-zinc-950/20 border border-zinc-800 px-4 py-3 rounded-xl text-[10px] text-zinc-500">
                        * Resume attachment option will appear once you save your resume in the settings tab.
                      </div>
                    )}

                    {/* Send Button */}
                    <button
                      onClick={sendEmail}
                      disabled={isSending || isGenerating || !recipient.trim()}
                      className="w-full py-3.5 rounded-full bg-white hover:bg-zinc-100 disabled:opacity-40 text-black font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-md"
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

        {/* Resume Settings Tab */}
        {activeTab === "resume" && (
          <div className="max-w-3xl w-full mx-auto bg-zinc-900/40 border border-zinc-800 p-8 rounded-2xl shadow-xl flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-zinc-400" />
                Resume Settings
              </h2>
              <p className="text-zinc-500 text-xs mt-1">
                Save your resume details in plain text. The AI uses this description to custom-match your skills to incoming jobs.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-400">Plain Text Resume</label>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your plain-text resume here... (Include Work Experience, Skills, Contact Info, Education, and Projects)"
                className="w-full h-96 bg-zinc-950/60 border border-zinc-800 focus:border-zinc-700 rounded-xl p-4 text-sm outline-none text-zinc-200 transition-colors resize-y font-mono"
              />
            </div>

            <button
              onClick={saveResume}
              disabled={savingResume}
              className="py-3 rounded-full bg-white hover:bg-zinc-100 text-black font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-md w-full"
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

        {/* LLM Configuration Tab */}
        {activeTab === "llm" && (
          <div className="max-w-xl w-full mx-auto bg-zinc-900/40 border border-zinc-800 p-8 rounded-2xl shadow-xl flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-zinc-400" />
                LLM Provider Configurations
              </h2>
              <p className="text-zinc-500 text-xs mt-1">
                Configure your API key and model choice. Keys are saved 100% locally in your browser's local storage and are never uploaded to our server database.
              </p>
            </div>

            <form onSubmit={saveLLMConfig} className="flex flex-col gap-5">
              {/* Provider Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-400">LLM Provider</label>
                <div className="grid grid-cols-3 gap-3">
                  {(["openai", "google", "anthropic"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleProviderChange(p)}
                      className={`py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                        provider === p
                          ? "bg-zinc-800 border-zinc-700 text-white shadow-sm"
                          : "bg-zinc-950/40 border-zinc-850 text-zinc-500 hover:text-zinc-350"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Model selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-400">Model Name</label>
                <input
                  type="text"
                  placeholder={
                    provider === "openai"
                      ? "gpt-4o"
                      : provider === "google"
                      ? "gemini-1.5-flash"
                      : "claude-3-5-sonnet-20240620"
                  }
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-zinc-950/60 border border-zinc-800 focus:border-zinc-700 rounded-xl px-4 py-2.5 text-sm outline-none text-zinc-200 transition-colors"
                  required
                />
                <span className="text-[10px] text-zinc-500">
                  {provider === "openai" && "* Suggested: gpt-4o, gpt-4o-mini, gpt-4-turbo"}
                  {provider === "google" && "* Suggested: gemini-1.5-flash, gemini-1.5-pro"}
                  {provider === "anthropic" && "* Suggested: claude-3-5-sonnet-20240620, claude-3-haiku-20240307"}
                </span>
              </div>

              {/* API Key */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-400">API Key</label>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    placeholder={`Paste your ${provider.toUpperCase()} API Key...`}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full bg-zinc-950/60 border border-zinc-800 focus:border-zinc-700 rounded-xl pl-4 pr-11 py-2.5 text-sm outline-none text-zinc-200 transition-colors font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3.5 top-3 text-zinc-500 hover:text-zinc-300"
                  >
                    {showKey ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="py-3 rounded-full bg-white hover:bg-zinc-100 text-black font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-md w-full mt-2"
              >
                <Check className="h-4 w-4" />
                Save configurations
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 px-6 bg-zinc-950/40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-zinc-500">
          <div>&copy; {new Date().getFullYear()} AI Job Apply. All rights reserved.</div>
          <div className="flex gap-4">
            <span className="text-zinc-600">Saved: LocalStorage & MongoDB (aijobapply)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
