// frontend/app/page.tsx
"use client";

import React, { useState } from "react";

/**
 * Cell: 単一のマス（セル）を表す型
 * @property {boolean} open - セルが開かれているか
 * @property {boolean} hasMine - セルに地雷があるか
 * @property {number} adjacent - 周囲8マスにある地雷の数
 * @property {boolean} [flagged] - プレイヤーが旗を立てたか（任意）
 */
type Cell = {
  open: boolean;
  hasMine: boolean;
  adjacent: number;
  flagged?: boolean;
};

const ROWS: number = 8;
const COLS: number = 8;
const MINE_PROB: number = 0.12; // 地雷の確率（12%）

/**
 * createBoard
 * 指定サイズのボードを作成し、ランダムに地雷を配置して
 * 各セルの `adjacent`（隣接地雷数）を計算して返す
 *
 * @param {number} rows - 行数
 * @param {number} cols - 列数
 * @param {number} mineProb - 各セルが地雷になる確率（0..1）
 * @returns {Cell[][]} 初期化済みのボード
 */
function createBoard(rows = ROWS, cols = COLS, mineProb = MINE_PROB): Cell[][] {
  // ボードの初期化と地雷の設定
  const board: Cell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ open: false, hasMine: Math.random() < mineProb, adjacent: 0 }))
  );

  // 各セルについて周囲の地雷数を計算する
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      board[row][col].adjacent = countAdjacentMines(board, row, col);
    }
  }

  return board;
}

/**
 * countAdjacentMines
 * 指定セル (r,c) の周囲8マスにある地雷の数を返す
 *
 * @param {Cell[][]} board - ボード
 * @param {number} r - 行インデックス
 * @param {number} c - 列インデックス
 * @returns {number} 周囲にある地雷の数
 */
function countAdjacentMines(board: Cell[][], r: number, c: number) {
  const rows = board.length;
  const cols = board[0].length;
  let count = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const rr = r + dr;
      const cc = c + dc;
      if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) {
        if (board[rr][cc].hasMine) count++;
      }
    }
  }
  return count;
}
 
/**
 * Home コンポーネント
 * - 内部 state: `board`(Cell[][]), `lost`(boolean)
 * - ユーザー操作: クリックでセルを開く、右クリックで旗を立てる、リセットボタン
 */
export default function Home() {
    // ゲームボードの状態を保持
    const [board, setBoard] = useState<Cell[][]>(() => createBoard());
    // ゲームオーバー状態
    const [lost, setLost] = useState(false);

    /**
     * revealAllMines
     * ボード上のすべての地雷セルを開く（ゲームオーバー表示用）
     * @param {Cell[][]} next - 更新対象のボードコピー
     */
    const revealAllMines = (next: Cell[][]) => {
      for (let r = 0; r < next.length; r++) {
        for (let c = 0; c < next[0].length; c++) {
          if (next[r][c].hasMine) next[r][c].open = true;
        }
      }
    };

    /**
     * openCell
     * セルを開くハンドラ。主な処理:
     * - 既に開いている or 旗がある場合は何もしない
     * - 地雷を開いたら全地雷を表示して `lost` を true にする
     * - 隣接地雷数が0のセルなら周囲を再帰的（ここではスタックで反復）に開く（flood fill）
     * - 最後に勝利条件（非地雷セルがすべて開かれているか）を判定
     *
     * @param {number} r - 行インデックス
     * @param {number} c - 列インデックス
     */
    const openCell = (r: number, c: number) => {
      if (lost) return;
      setBoard(prev => {
        const next = prev.map(row => row.map(cell => ({ ...cell })));
        const start = next[r][c];
        if (start.open || start.flagged) return prev;

        if (start.hasMine) {
          // 地雷を開いた -> 全地雷を表示してゲーム終了
          next[r][c].open = true;
          revealAllMines(next);
          setLost(true);
          return next;
        }

        // flood fill (スタックを使った反復的実装)
        const stack: [number, number][] = [[r, c]];
        while (stack.length) {
          const [rr, cc] = stack.pop()!;
          const cell = next[rr][cc];
          if (cell.open || cell.flagged) continue;
          cell.open = true;
          // 隣接0なら周囲を追加して連続開放
          if (cell.adjacent === 0) {
            for (let dr = -1; dr <= 1; dr++) {
              for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = rr + dr;
                const nc = cc + dc;
                if (nr >= 0 && nr < next.length && nc >= 0 && nc < next[0].length) {
                  const neighbor = next[nr][nc];
                  if (!neighbor.open && !neighbor.hasMine) {
                    stack.push([nr, nc]);
                  }
                }
              }
            }
          }
        }

        // 勝利判定: 地雷でないセルがすべて開かれているか
        const allCleared = next.every(row => row.every(cell => cell.hasMine || cell.open));
        if (allCleared) {
          // TODO: 勝利表示やスコア処理を追加する
        }

        return next;
      });
    };

    /**
     * toggleFlag
     * 右クリックでセルに旗を立てる/外す（デフォルトの右クリックメニューは抑制する）
     * @param {number} r - 行インデックス
     * @param {number} c - 列インデックス
     * @param {React.MouseEvent} [e] - イベント（preventDefault用）
     */
    const toggleFlag = (r: number, c: number, e?: React.MouseEvent) => {
      if (e) e.preventDefault();
      if (lost) return;
      setBoard(prev => {
        const next = prev.map(row => row.map(cell => ({ ...cell })));
        const cell = next[r][c];
        if (cell.open) return prev;
        cell.flagged = !cell.flagged;
        return next;
      });
    };

    /**
     * reset
     * 新しいボードを生成してゲームをリセットする
     */
    const reset = () => {
      setBoard(createBoard());
      setLost(false);
    };

    const totalMines = board.flat().filter(c => c.hasMine).length;
    const flagged = board.flat().filter(c => c.flagged).length;

    return (
      <main style={{ padding: 20 }}>
        <h1>簡易マインスイーパー</h1>
        <div style={{ marginBottom: 8 }}>
          <button
            onClick={reset}
            style={{
              marginRight: 8,
              border: "1px solid #333",
              color: "#fff",
            }}
          >
            リセット
          </button>
          <strong>残り（概算）:</strong> {Math.max(0, totalMines - flagged)}  
          {lost && <span style={{ color: "red", marginLeft: 12 }}>ゲームオーバー</span>}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: `repeat(${COLS}, 36px)`, gap: 6 }}>
          {board.map((row, r) =>
            row.map((cell, c) => (
              <button
                key={`${r}-${c}`}
                onClick={() => openCell(r, c)}
                onContextMenu={(e) => toggleFlag(r, c, e)}
                style={{
                  width: 36,
                  height: 36,
                  background: cell.open ? (cell.hasMine ? "#ff9999" : "#eee") : "#666",
                  border: "1px solid #333",
                  color: cell.open ? "#000" : "#fff",
                  fontSize: 14,
                  padding: 0
                }}
              >
                {cell.open ? (cell.hasMine ? "💣" : (cell.adjacent > 0 ? cell.adjacent : "")) : (cell.flagged ? "🚩" : "")}
              </button>
            ))
          )}
        </div>
      </main>
    );
  }