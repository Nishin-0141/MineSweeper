// frontend/app/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import LoginPage from "./login/page";

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

type RankingEntry = {
  name: string;
  score: number;
  date?: string;
};

// SVG アイコンを React コンポーネント化（fill は currentColor を使って色をコントロール）
function BombIcon({ size = 18, color = "#000" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 -960 960 960"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", color }}
      role="img"
      aria-label="bomb"
    >
      <path fill="currentColor" d="M346-48q-125 0-212.5-88.5T46-350q0-125 86.5-211.5T344-648h13l27-47q12-22 36-28.5t46 6.5l30 17 5-8q23-43 72-56t92 12l35 20-40 69-35-20q-14-8-30.5-3.5T570-668l-5 8 40 23q21 12 27.5 36t-5.5 45l-27 48q23 36 34.5 76.5T646-348q0 125-87.5 212.5T346-48Zm0-80q91 0 155.5-64.5T566-348q0-31-8.5-61T532-466l-26-41 42-72-104-60-42 72h-44q-94 0-163.5 60T125-350q0 92 64.5 157T346-128Zm454-480v-80h120v80H800ZM580-828v-120h80v120h-80Zm195 81-56-56 85-85 56 56-85 85ZM346-348Z" />
    </svg>
  );
}

function FlagIcon({ size = 16, color = "#000" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 -960 960 960"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", color }}
      role="img"
      aria-label="flag"
    >
      <path fill="currentColor" d="M200-120v-680h360l16 80h224v400H520l-16-80H280v280h-80Zm300-440Zm86 160h134v-240H510l-16-80H280v240h290l16 80Z" />
    </svg>
  );
}

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
    // クライアント側で簡易認証チェック: localStorage のトークン有無で表示を切り替える
    // const [authChecked, setAuthChecked] = useState(false);
    // const [authenticated, setAuthenticated] = useState(false);

    // useEffect(() => {
    //   try {
    //     const t = localStorage.getItem("msw_token");
    //     setAuthenticated(!!t);
    //   } catch (e) {
    //     setAuthenticated(false);
    //   } finally {
    //     setAuthChecked(true);
    //   }
    // }, []);

    // // 認証チェックが終わるまでは簡易ローディングを表示
    // if (!authChecked) {
    //   return <main style={{ padding: 20 }}>Loading...</main>;
    // }

    // // トークンがなければログインページを表示
    // if (!authenticated) {
    //   return <LoginPage />;
    // }
    // ゲームボードの状態を保持
    const [board, setBoard] = useState<Cell[][]>(() => createBoard());
    // ゲームオーバー状態
    const [lost, setLost] = useState(false);

    // ランキング取得関連
    const [rankings, setRankings] = useState<RankingEntry[]>([]);
    const [rankLoading, setRankLoading] = useState(false);
    const [rankError, setRankError] = useState<string | null>(null);

    useEffect(() => {
      let mounted = true;
      const sample: RankingEntry[] = [
        { name: "alice", score: 120, date: "2025-11-01" },
        { name: "bob", score: 95, date: "2025-10-28" },
        { name: "carol", score: 80, date: "2025-10-15" },
      ];

      const fetchRank = async () => {
        setRankLoading(true);
        setRankError(null);
        try {
          const res = await fetch("https://5p5x5xbtt5.execute-api.ap-northeast-1.amazonaws.com/prod/ranking", {
            method: "GET",
            headers: {
              "x-api-key": "Y4RjV3bEjK2ETKjdAwaUG3CX8Hkdut396pwuPOy0" // 適切な API キーに置き換えてください
            }
          });
          // レスポンスをコンソールに出力（デバッグ用）
          console.log('Ranking API response:', res);

          if (!mounted) return;
          if (!res.ok) {
            // API が無ければサンプルを利用
            setRankings(sample);
            setRankError(`ランキング取得失敗: ${res.status}`);
            return;
          }
          const data = await res.json();
          if (!mounted) return;
          // 想定: data = [{ name, score, date }, ...]
          setRankings(Array.isArray(data) ? data : sample);
        } catch (e) {
          if (!mounted) return;
          setRankings(sample);
          setRankError('ランキングを取得できませんでした。サンプルを表示します');
        } finally {
          if (mounted) setRankLoading(false);
        }
      };

      fetchRank();
      return () => {
        mounted = false;
      };
    }, []);

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

        <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${COLS}, 36px)`, gap: 4 }}>
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
                      padding: 0,
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden"
                    }}
                    >
                    {cell.open ? (
                      cell.hasMine ? (
                        <BombIcon size={18}/>
                      ) : (
                        (cell.adjacent > 0 ? <span style={{ fontWeight: 600 }}>{cell.adjacent}</span> : "")
                      )
                    ) : (
                      (cell.flagged ? (
                        <FlagIcon size={18} color="#0c6404ff" />
                      ) : "")
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          <aside style={{ width: 320, padding: 12, borderRadius: 6, background: "#fafafa", border: "1px solid #e6e6e6" }}>
            <h2 style={{ marginTop: 0 }}>ランキング</h2>
            {rankLoading ? (
              <div>Loading...</div>
            ) : rankError ? (
              <div style={{ color: "#b00020" }}>{rankError}</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                    <th style={{ padding: "6px 4px", width: 36 }}>#</th>
                    <th style={{ padding: "6px 4px" }}>名前</th>
                    <th style={{ padding: "6px 4px", textAlign: "right" }}>スコア</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.slice(0, 10).map((r, i) => (
                    <tr key={`${r.name}-${i}`} style={{ borderBottom: "1px solid #f0f0f0" }}>
                      <td style={{ padding: "6px 4px" }}>{i + 1}</td>
                      <td style={{ padding: "6px 4px" }}>{r.name}</td>
                      <td style={{ padding: "6px 4px", textAlign: "right" }}>{r.score}</td>
                    </tr>
                  ))}
                  {rankings.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ padding: "8px 4px", color: "#666" }}>ランキングがありません</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </aside>
        </div>
      </main>
    );
  }