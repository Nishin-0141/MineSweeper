"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * 簡易ログインページ
 * - 本実装はサンプル: フロントエンド側で擬似トークンを localStorage に保存します
 * - 実際の認証（バックエンド連携、JWT、OAuth）は別途実装してください
 */
export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // ここではダミー認証: username が空でないことだけをチェック
    await new Promise((r) => setTimeout(r, 500));
    if (!username) {
      setError("ユーザー名を入力してください");
      setLoading(false);
      return;
    }

    // 擬似トークンを localStorage に保存
    const fakeToken = `token:${username}:${Date.now()}`;
    try {
      localStorage.setItem("msw_token", fakeToken);
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
    // 成功後はホームへ遷移
    router.push("/");
  };

  return (
    <main style={{ padding: 24, maxWidth: 520, margin: "0 auto" }}>
      <h1>ログイン</h1>
      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "block" }}>
          <div style={{ fontSize: 13, marginBottom: 6 }}>ユーザー名</div>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            style={{ width: "100%", padding: "8px 10px", fontSize: 14 }}
          />
        </label>

        <label style={{ display: "block" }}>
          <div style={{ fontSize: 13, marginBottom: 6 }}>パスワード</div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            style={{ width: "100%", padding: "8px 10px", fontSize: 14 }}
          />
        </label>

        {error && <div style={{ color: "#b00020" }}>{error}</div>}

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="submit"
            disabled={loading}
            style={{ padding: "8px 12px", cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Loading..." : "ログイン"}
          </button>

          <Link href="/">
            <a style={{ alignSelf: "center", color: "#0366d6" }}>キャンセル</a>
          </Link>
        </div>
      </form>

      <p style={{ marginTop: 18, fontSize: 13, color: "#666" }}>
        This is a sample login page. Replace with real auth as needed.
      </p>
    </main>
  );
}
