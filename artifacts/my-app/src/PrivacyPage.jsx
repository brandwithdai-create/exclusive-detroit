import React from "react";

const C = {
  black: "#0A0A0A", deep: "#111111", card: "#161616", border: "#242424",
  gold: "#C9A84C", goldL: "#E2C97E", goldD: "#8A6F30",
  smoke: "#6A6A6A", ash: "#9A9A9A", bone: "#E8E0D4", white: "#F5F2EE",
};

const SECTIONS = [
  {
    heading: "Information We Collect",
    body: "We do not collect, store, or share any personal information. The app does not require account creation or login.",
  },
  {
    heading: "Location Data",
    body: "The app may request access to your device's location to show venues near you. Your location is used only on your device and is never stored, transmitted, or shared with us or any third party.",
  },
  {
    heading: "Saved Spots",
    body: "Any venues you save are stored locally on your device only. We do not have access to or store this information.",
  },
  {
    heading: "Third-Party Services",
    body: "We use third-party map services to display venue locations. These services may collect limited technical data in accordance with their own privacy policies.",
  },
  {
    heading: "Children's Privacy",
    body: "This app is not intended for children under the age of 13. We do not knowingly collect personal information from children.",
  },
  {
    heading: "Changes to This Policy",
    body: "We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated date.",
  },
  {
    heading: "Contact Us",
    body: "If you have any questions about this Privacy Policy, please contact us at: brandwithdai@gmail.com",
  },
];

export default function PrivacyPage() {
  return (
    <div style={{ background: C.black, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: C.bone }}>
      <div style={{ background: C.deep, borderBottom: "1px solid " + C.border, padding: "24px 22px" }}>
        <a
          href="/"
          style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.5rem", letterSpacing: "0.22em", textTransform: "uppercase", color: C.gold, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 32 }}
        >
          ← Back to Exclusive Detroit
        </a>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.53rem", letterSpacing: "0.22em", textTransform: "uppercase", color: C.gold, marginBottom: 8, marginTop: 0 }}>
          Legal
        </p>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2rem, 6vw, 3.2rem)", fontWeight: 400, color: C.white, margin: "0 0 8px" }}>
          Privacy Policy
        </h1>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.52rem", letterSpacing: "0.1em", color: C.smoke, margin: 0 }}>
          Last updated: April 8, 2026
        </p>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 22px 80px", display: "flex", flexDirection: "column", gap: 40 }}>
        {SECTIONS.map(({ heading, body }) => (
          <div key={heading}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.35rem", fontWeight: 400, color: C.white, margin: "0 0 12px", borderBottom: "1px solid " + C.border, paddingBottom: 10 }}>
              {heading}
            </h2>
            <p style={{ fontSize: "0.88rem", fontWeight: 300, color: C.ash, lineHeight: 1.8, margin: 0 }}>
              {body}
            </p>
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px solid " + C.border, padding: "20px 22px", textAlign: "center" }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.48rem", letterSpacing: "0.14em", textTransform: "uppercase", color: C.smoke }}>
          2026 Exclusive City Guides · Detroit Edition
        </span>
      </div>
    </div>
  );
}
