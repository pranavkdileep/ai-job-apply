import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #C7D0C8, #DCE2DC)" }}>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="bg-card rounded-[28px] p-8 sm:p-12 shadow-2xl">
          <h1 className="text-3xl font-extrabold text-white mb-2">Privacy Policy</h1>
          <p className="text-sm font-medium mb-8" style={{ color: "#8A8A8A" }}>
            Last updated: June 2026
          </p>

          <div className="space-y-8 text-sm leading-relaxed" style={{ color: "#ccc" }}>
            <section>
              <h2 className="text-lg font-bold text-white mb-3">1. Introduction</h2>
              <p>
                AI Job Apply (&quot;we&quot;, &quot;our&quot;, &quot;app&quot;) is an AI-assisted job application tool
                that helps users draft and send tailored application emails via their Gmail account.
                This privacy policy explains what data we collect, how we use it, and your rights.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">2. Data We Collect</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <strong className="text-white">Google Account Information:</strong> Your name, email address,
                  and profile picture — obtained through Google OAuth for authentication.
                </li>
                <li>
                  <strong className="text-white">OAuth Tokens:</strong> Access and refresh tokens needed to
                  send emails on your behalf via the Gmail API. These are stored securely in our database.
                </li>
                <li>
                  <strong className="text-white">Resume Content:</strong> Plain-text resume you voluntarily
                  provide to personalize generated emails.
                </li>
                <li>
                  <strong className="text-white">Application Records:</strong> Metadata about emails sent
                  through the app (recipient, subject, send timestamp, Gmail message ID).
                </li>
                <li>
                  <strong className="text-white">LLM API Keys:</strong> Stored only in your browser&apos;s
                  localStorage. We never transmit these to our server database.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">3. How We Use Your Data</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>To authenticate you via Google Sign-In.</li>
                <li>To generate tailored job application emails using your resume and job details.</li>
                <li>To send application emails through your Gmail account using the Gmail API.</li>
                <li>To store your resume for future email generations.</li>
                <li>To maintain a record of sent applications for your reference.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">4. Data Storage &amp; Security</h2>
              <p>
                User data is stored in MongoDB. OAuth tokens are stored server-side and are never
                exposed to the client. Session cookies are HTTP-only and secure in production.
                LLM API keys are stored exclusively in your browser&apos;s localStorage and are
                never persisted on our servers.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">5. Data Retention</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Sessions expire after 7 days and are automatically deleted.</li>
                <li>User accounts and associated data are retained until you request deletion.</li>
                <li>Application records are retained until account deletion.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">6. Third-Party Services</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <strong className="text-white">Google OAuth &amp; Gmail API:</strong> Used for
                  authentication and sending emails. Subject to{" "}
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary-custom underline">
                    Google&apos;s Privacy Policy
                  </a>.
                </li>
                <li>
                  <strong className="text-white">MongoDB:</strong> Database hosting for user data and sessions.
                </li>
                <li>
                  <strong className="text-white">LLM Providers (user-configured):</strong> OpenAI, Anthropic,
                  Google, or Vercel — used to generate email content. Your API key is sent directly from
                  your browser; we do not proxy or store it.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">7. Your Rights</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>You may request deletion of your account and all associated data at any time.</li>
                <li>You may revoke Google access at any time via your{" "}
                  <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-primary-custom underline">
                    Google Account settings
                  </a>.
                </li>
                <li>You may request a copy of the data we hold about you.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">8. Contact</h2>
              <p>
                For privacy-related questions or deletion requests, contact us at{" "}
                <a href="mailto:pranavdileep10@gmail.com" className="text-primary-custom underline">
                  pranavdileep10@gmail.com
                </a>.
              </p>
            </section>
          </div>

          <div className="mt-10 pt-6" style={{ borderTop: "1px solid #1e1e1e" }}>
            <Link href="/" className="text-primary-custom text-sm font-bold hover:underline">
              &larr; Back to App
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
