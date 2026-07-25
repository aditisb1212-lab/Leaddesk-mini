import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../api.js";

export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState("checking"); // checking | authed | anon

  useEffect(() => {
    api
      .me()
      .then(() => setStatus("authed"))
      .catch(() => setStatus("anon"));
  }, []);

  if (status === "checking") {
    return <div style={{ padding: "3rem", fontFamily: "var(--font-body)" }}>Checking session…</div>;
  }

  if (status === "anon") {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
