import React from "react";

interface Props {
  provider: "together" | "gemini";
  onProviderChange: (provider: "together" | "gemini") => void;
}

export default function AIProviderSelect({
  provider,
  onProviderChange,
}: Props) {
  return (
    <div className="form-control">
      <label className="label cursor-pointer">
        <span className="label-text">AI Provider</span>
        <select
          className="select select-bordered w-full max-w-xs"
          value={provider}
          onChange={(e) =>
            onProviderChange(e.target.value as "together" | "gemini")
          }
        >
          <option value="together">Together AI</option>
          <option value="gemini">Google Gemini</option>
        </select>
      </label>
    </div>
  );
}
