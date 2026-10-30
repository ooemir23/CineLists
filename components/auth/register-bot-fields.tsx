"use client";

import { useEffect, useState } from "react";

export function RegisterBotFields() {
  const [loadedAt, setLoadedAt] = useState("");

  useEffect(() => {
    setLoadedAt(String(Date.now()));
  }, []);

  return (
    <>
      {/* Honeypot field: invisible to human users, bots fill it automatically */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          top: "-9999px",
          opacity: 0,
          pointerEvents: "none",
          height: 0,
          width: 0,
          overflow: "hidden",
        }}
      >
        <label htmlFor="user_website_field">Website</label>
        <input
          id="user_website_field"
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Form timing protection: catches instant submission bots */}
      <input type="hidden" name="formLoadedAt" value={loadedAt} />
    </>
  );
}
