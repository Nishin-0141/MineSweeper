// frontend/app/page.tsx
"use client";

import React, { useState } from "react";

type Cell = { open: boolean; hasMine: boolean };

export default function Home() {
  const rows = 8;
  const cols = 8;
  const [board, setBoard] = useState<Cell[][]>(
    Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({ open: false, hasMine: Math.random() < 0.1 }))
    )
  );

  const openCell = (r: number, c: number) => {
    setBoard(prev => {
      const next = prev.map(row => row.map(cell => ({ ...cell })));
      next[r][c].open = true;
      return next;
    });
  };

  return (
    <main style={{ padding: 20 }}>
      <h1>簡易マインスイーパー</h1>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 32px)`, gap: 4 }}>
        {board.map((row, r) =>
          row.map((cell, c) => (
            <button
              key={`${r}-${c}`}
              onClick={() => openCell(r, c)}
              style={{
                width: 32,
                height: 32,
                background: cell.open ? (cell.hasMine ? "red" : "#ddd") : "#666",
                border: "1px solid #333",
                color: cell.open ? "#000" : "#fff"
              }}
            >
              {cell.open && cell.hasMine ? "💣" : cell.open ? "" : ""}
            </button>
          ))
        )}
      </div>
    </main>
  );
}