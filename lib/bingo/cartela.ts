import type { BingoCartela } from './types';

/**
 * Generates a valid Brazilian 9x3 bingo cartela.
 *
 * Rules:
 * - 9 columns x 3 rows
 * - Exactly 5 numbers per row (15 total, 12 blanks)
 * - Column ranges: col 0 = 1-9, col 1 = 10-19, ..., col 7 = 70-79, col 8 = 80-90
 * - Each column has 0-3 numbers, numbers sorted ascending within column
 */
export function generateCartela(maxAttempts = 10): BingoCartela {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const grid = tryGenerateCartela();
    if (grid) return grid;
  }
  // Fallback should never happen in practice
  throw new Error('Failed to generate valid cartela after max attempts');
}

function tryGenerateCartela(): BingoCartela | null {
  const grid: (number | null)[][] = [
    Array(9).fill(null),
    Array(9).fill(null),
    Array(9).fill(null),
  ];

  // For each column, determine which rows get numbers
  for (let col = 0; col < 9; col++) {
    const min = col === 0 ? 1 : col * 10;
    const max = col === 8 ? 90 : col * 10 + 9;

    // Get available numbers for this column
    const pool = Array.from({ length: max - min + 1 }, (_, i) => min + i);
    // Shuffle pool
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    // Randomly pick 1-3 rows to fill in this column
    const rowCount = 1 + Math.floor(Math.random() * 3); // 1, 2, or 3
    const rows = [0, 1, 2].sort(() => Math.random() - 0.5).slice(0, rowCount);
    rows.forEach((row, i) => {
      grid[row][col] = pool[i];
    });
  }

  // Adjust each row to have exactly 5 numbers
  for (let row = 0; row < 3; row++) {
    let filled = grid[row].filter(v => v !== null).length;

    // Remove excess numbers from random filled columns
    while (filled > 5) {
      const filledCols = grid[row]
        .map((v, i) => (v !== null ? i : -1))
        .filter(i => i >= 0);
      const removeCol = filledCols[Math.floor(Math.random() * filledCols.length)];
      grid[row][removeCol] = null;
      filled--;
    }

    // Add missing numbers to random empty columns
    while (filled < 5) {
      const emptyCols = grid[row]
        .map((v, i) => (v === null ? i : -1))
        .filter(i => i >= 0);
      if (emptyCols.length === 0) return null; // Should not happen
      const addCol = emptyCols[Math.floor(Math.random() * emptyCols.length)];
      const min = addCol === 0 ? 1 : addCol * 10;
      const max = addCol === 8 ? 90 : addCol * 10 + 9;
      // Pick a number not already in this column
      const colNums = grid.map(r => r[addCol]).filter(v => v !== null) as number[];
      const available = Array.from({ length: max - min + 1 }, (_, i) => min + i)
        .filter(n => !colNums.includes(n));
      if (available.length > 0) {
        grid[row][addCol] = available[Math.floor(Math.random() * available.length)];
        filled++;
      } else {
        return null; // Column exhausted, retry
      }
    }
  }

  // Sort numbers within each column (ascending top to bottom)
  for (let col = 0; col < 9; col++) {
    const nums = [0, 1, 2]
      .map(r => grid[r][col])
      .filter((v): v is number => v !== null)
      .sort((a, b) => a - b);
    let ni = 0;
    for (let row = 0; row < 3; row++) {
      if (grid[row][col] !== null) {
        grid[row][col] = nums[ni++];
      }
    }
  }

  // Post-generation assertion: each row must have exactly 5 numbers
  for (let row = 0; row < 3; row++) {
    if (grid[row].filter(v => v !== null).length !== 5) {
      return null;
    }
  }

  return grid;
}

/**
 * Validates that all 15 non-null numbers in the cartela have been drawn.
 * Returns true only if ALL cartela numbers are present in the drawn set.
 */
export function validateBingo(
  cartela: BingoCartela,
  drawnNumbers: number[]
): boolean {
  const drawnSet = new Set(drawnNumbers);
  for (const row of cartela) {
    for (const num of row) {
      if (num !== null && !drawnSet.has(num)) {
        return false;
      }
    }
  }
  return true;
}
