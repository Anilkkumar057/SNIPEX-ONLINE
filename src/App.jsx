import React, { useState } from "react";
import "./style.css";

export default function App() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="snipex-shell">
      {!loaded && (
        <div className="snipex-loader">
          <div className="snipex-loader-card">
            <div className="snipex-loader-title">SnipeX</div>
            <div className="snipex-loader-sub">Loading original trading UI...</div>
          </div>
        </div>
      )}

      <iframe
        title="SnipeX Trading UI"
        src="/SnipeX_UI.html"
        onLoad={() => setLoaded(true)}
        className="snipex-frame"
      />
    </div>
  );
}
