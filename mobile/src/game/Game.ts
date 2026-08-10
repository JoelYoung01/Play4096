import type { GameState } from "@/types";
import { getInkColor, getTheme, type Theme } from "@/theme/themes";
import { BOARD_TRANSFORMS, BOARD_TRANSFORM_VALUES, DEFAULT_BOARD_SIZE, DEFAULT_STARTING_TILES, DEFAULT_WIN_TILE, DIRECTIONS, EVENT_TYPES, SLIDE_DIRECTION_VALUES, TWO_TO_FOUR_RATIO, UNDO_COOLDOWN_MOVES } from "./constants";
import { createSeededRng, generateSeed, type SeededRng } from "./rng";

export type GameEvent = Record<string, unknown>;
type UndoSnapshot = { board: number[][]; score: number; gameOver: boolean; won: boolean; canContinue: boolean; rngState: number; moveCount: number };
type GameOptions = { id?: string; boardSize?: number; startingTiles?: number; initialState?: GameState | null; seed?: number; winTile?: number };
const cloneBoard = (board: number[][]) => board.map((row) => [...row]);
const resolveMoves = (s?: GameState | null): number[] | null => !s ? [] : s.moves === null ? null : Array.isArray(s.moves) ? [...s.moves] : (s.moveCount ?? 0) === 0 ? [] : null;
const resolveCreatedOn = (s?: GameState | null) => !s ? Date.now() : typeof s.createdOn === "number" && Number.isFinite(s.createdOn) && s.createdOn > 0 ? s.createdOn : null;
export const getTileBackground = (value: number, theme: Theme = getTheme("classic")) => theme.tiles[value] ?? theme.unknownTile;
export const getTileColor = (value: number, theme: Theme = getTheme("classic")) => getInkColor(getTileBackground(value, theme), theme);

export class Game {
  id?: string;
  boardSize: number;
  winTile: number;
  board: number[][];
  score = 0;
  gameOver = false;
  won = false;
  canContinue = false;
  moveCount = 0;
  undoCooldownRemaining = 0;
  hasUndoSnapshot = false;
  moves: number[] | null;
  createdOn: number | null;
  seed: number;
  rng: SeededRng;
  #previousState: UndoSnapshot | null = null;

  constructor({ id, boardSize = DEFAULT_BOARD_SIZE, startingTiles = DEFAULT_STARTING_TILES, initialState = null, seed, winTile = DEFAULT_WIN_TILE }: GameOptions = {}) {
    this.id = id ?? initialState?.id;
    this.boardSize = boardSize;
    this.winTile = winTile;
    this.board = Array.from({ length: boardSize }, () => Array(boardSize).fill(0));
    this.moves = resolveMoves(initialState);
    this.createdOn = resolveCreatedOn(initialState);
    this.seed = seed ?? initialState?.seed ?? generateSeed();
    this.rng = createSeededRng(this.seed);
    if (initialState?.rngState != null) this.rng.state = Number(initialState.rngState);
    this.initialize(initialState, startingTiles);
  }
  get canUndo() { return this.hasUndoSnapshot && this.undoCooldownRemaining === 0; }
  get maxTile() { return this.board.flat().reduce((max, value) => Math.max(max, value), 0); }
  initialize(initialState: GameState | null, startingTiles: number) {
    if (initialState?.board?.length) {
      this.board = cloneBoard(initialState.board); this.score = Number(initialState.score ?? 0); this.boardSize = this.board.length; this.moveCount = Number(initialState.moveCount ?? 0); this.undoCooldownRemaining = Number(initialState.undoCooldownRemaining ?? 0); this.won = Boolean(initialState.won); this.gameOver = Boolean(initialState.gameOver ?? initialState.complete); this.checkWin(); this.checkGameOver(); if (this.won) this.canContinue = true; return;
    }
    for (let i = 0; i < startingTiles; i += 1) this.addNewTile();
  }
  #captureUndoSnapshot(): UndoSnapshot { return { board: cloneBoard(this.board), score: this.score, gameOver: this.gameOver, won: this.won, canContinue: this.canContinue, rngState: this.rng.state, moveCount: this.moveCount }; }
  undo() { if (!this.canUndo || !this.#previousState) return false; const s = this.#previousState; this.board = cloneBoard(s.board); this.score = s.score; this.gameOver = s.gameOver; this.won = s.won; this.canContinue = s.canContinue; this.rng.state = s.rngState; this.moveCount = s.moveCount; this.#previousState = null; this.hasUndoSnapshot = false; this.undoCooldownRemaining = UNDO_COOLDOWN_MOVES; if (this.moves) this.moves = this.moves.slice(0, -1); return true; }
  #commitRecordedAction(action: number, undoSnapshot: UndoSnapshot) { this.#previousState = undoSnapshot; this.hasUndoSnapshot = true; this.moveCount += 1; if (this.moves) this.moves = [...this.moves, action]; if (this.undoCooldownRemaining > 0) this.undoCooldownRemaining -= 1; }
  applyRecordedAction(action: number) { if (SLIDE_DIRECTION_VALUES.has(action)) return this.moveTiles(action); if (BOARD_TRANSFORM_VALUES.has(action)) return this.applyBoardTransform(action); return []; }
  applyBoardTransform(transform: number): GameEvent[] { if (this.gameOver || !BOARD_TRANSFORM_VALUES.has(transform)) return []; const undoSnapshot = this.#captureUndoSnapshot(); this.#mutateBoardTransform(transform); this.#commitRecordedAction(transform, undoSnapshot); return [{ resync: true, snapshot: cloneBoard(this.board) }]; }
  #mutateBoardTransform(transform: number) { const n = this.boardSize, src = this.board, next = Array.from({ length: n }, () => Array(n).fill(0)); for (let i = 0; i < n; i += 1) for (let j = 0; j < n; j += 1) { if (transform === BOARD_TRANSFORMS.ROTATE_CW) next[j][n - 1 - i] = src[i][j]; else if (transform === BOARD_TRANSFORMS.ROTATE_CCW) next[n - 1 - j][i] = src[i][j]; else if (transform === BOARD_TRANSFORMS.MIRROR_H) next[i][n - 1 - j] = src[i][j]; else if (transform === BOARD_TRANSFORMS.MIRROR_V) next[n - 1 - i][j] = src[i][j]; } this.board = next; }
  checkWin() { if (this.board.some((row) => row.some((cell) => cell >= this.winTile))) { this.won = true; return true; } return false; }
  addNewTile(valueInput: number | null = null) { const newTileValue = valueInput ?? (this.rng.next() < TWO_TO_FOUR_RATIO ? 2 : 4); const emptyCells: { row: number; col: number }[] = []; for (let i = 0; i < this.boardSize; i += 1) for (let j = 0; j < this.boardSize; j += 1) if (this.board[i][j] === 0) emptyCells.push({ row: i, col: j }); if (!emptyCells.length) return null; const randomCell = emptyCells[this.rng.nextInt(emptyCells.length)]; this.board[randomCell.row][randomCell.col] = newTileValue; return { end: { x: randomCell.col, y: randomCell.row }, newTileValue, type: EVENT_TYPES.SPAWN }; }
  checkGameOver() { for (let i = 0; i < this.boardSize; i += 1) for (let j = 0; j < this.boardSize; j += 1) if (this.board[i][j] === 0 || (j < this.boardSize - 1 && this.board[i][j] === this.board[i][j + 1]) || (i < this.boardSize - 1 && this.board[i][j] === this.board[i + 1][j])) return false; this.gameOver = true; return true; }
  canMove(line: number[]) { for (let i = 0; i < line.length - 1; i += 1) if ((line[i] === line[i + 1] && line[i] !== 0) || (line[i] === 0 && line[i + 1] !== 0) || (line[i] !== 0 && line[i + 1] === 0)) return true; return false; }
  collapseLine(inputLine: number[]) { let lastPlaced = 0, current = 1; const line = [...inputLine], moves: Record<string, unknown>[] = []; while (current < line.length) { const type = EVENT_TYPES.MOVE, value = line[current]; if (value === 0) {} else if (line[lastPlaced] === 0) { line[lastPlaced] = value; line[current] = 0; moves.push({ start: current, end: lastPlaced, value, type }); } else if (line[lastPlaced] === value) { line[lastPlaced] *= 2; line[current] = 0; this.score += line[lastPlaced]; moves.push({ start: current, end: lastPlaced, merged: true, value, type }); lastPlaced += 1; } else if (lastPlaced + 1 !== current) { line[lastPlaced + 1] = value; line[current] = 0; lastPlaced += 1; moves.push({ start: current, end: lastPlaced, value, type }); } else lastPlaced += 1; current += 1; } return { result: line, moves }; }
  moveTiles(direction: number): GameEvent[] {
    if (this.gameOver) return []; const moveQueue: GameEvent[] = [], undoSnapshot = this.#captureUndoSnapshot(), newBoard = cloneBoard(this.board);
    const pushMoves = (moves: Record<string, unknown>[], map: (move: Record<string, unknown>, len: number) => GameEvent, len = this.boardSize) => moveQueue.push(...moves.map((m) => map(m, len)));
    if (direction === DIRECTIONS.LEFT) for (let i = 0; i < this.boardSize; i += 1) { const row = [...newBoard[i]]; if (this.canMove(row)) { const { result, moves } = this.collapseLine(row); if (moves.length) { newBoard[i] = result; pushMoves(moves, (m) => ({ ...m, start: { x: Number(m.start ?? 0), y: i }, end: { x: Number(m.end ?? 0), y: i } })); } } }
    else if (direction === DIRECTIONS.RIGHT) for (let i = 0; i < this.boardSize; i += 1) { const row = [...newBoard[i]].reverse(); if (this.canMove(row)) { const { result, moves } = this.collapseLine(row); if (moves.length) { newBoard[i] = [...result].reverse(); pushMoves(moves, (m, len) => ({ ...m, start: { x: len - 1 - Number(m.start ?? 0), y: i }, end: { x: len - 1 - Number(m.end ?? 0), y: i } })); } } }
    else if (direction === DIRECTIONS.UP) for (let j = 0; j < this.boardSize; j += 1) { const col = Array.from({ length: this.boardSize }, (_, i) => newBoard[i][j]); if (this.canMove(col)) { const { result, moves } = this.collapseLine(col); if (moves.length) { for (let i = 0; i < this.boardSize; i += 1) newBoard[i][j] = result[i]; pushMoves(moves, (m) => ({ ...m, start: { x: j, y: Number(m.start ?? 0) }, end: { x: j, y: Number(m.end ?? 0) } })); } } }
    else if (direction === DIRECTIONS.DOWN) for (let j = 0; j < this.boardSize; j += 1) { const col = Array.from({ length: this.boardSize }, (_, i) => newBoard[this.boardSize - 1 - i][j]); if (this.canMove(col)) { const { result, moves } = this.collapseLine(col); if (moves.length) { for (let i = 0; i < this.boardSize; i += 1) newBoard[this.boardSize - 1 - i][j] = result[i]; pushMoves(moves, (m, len) => ({ ...m, start: { x: j, y: len - 1 - Number(m.start ?? 0) }, end: { x: j, y: len - 1 - Number(m.end ?? 0) } })); } } }
    if (moveQueue.length > 0) { this.#previousState = undoSnapshot; this.hasUndoSnapshot = true; moveQueue.push({ snapshot: newBoard }); this.board = newBoard; this.moveCount += 1; if (this.moves) this.moves = [...this.moves, direction]; if (this.undoCooldownRemaining > 0) this.undoCooldownRemaining -= 1; if (!this.won && this.checkWin()) moveQueue.push({ gameWon: true }); const tileAddMove = this.addNewTile(); if (tileAddMove) { moveQueue.push(tileAddMove); moveQueue.push({ snapshot: cloneBoard(this.board) }); } if (this.checkGameOver()) moveQueue.push({ gameLost: true }); }
    return moveQueue;
  }
  rotateBoard(factor: number) { const turns = ((factor % 4) + 4) % 4; if (!turns) return []; if (turns === 1) return this.applyBoardTransform(BOARD_TRANSFORMS.ROTATE_CW); if (turns === 3) return this.applyBoardTransform(BOARD_TRANSFORMS.ROTATE_CCW); return [...this.applyBoardTransform(BOARD_TRANSFORMS.ROTATE_CW), ...this.applyBoardTransform(BOARD_TRANSFORMS.ROTATE_CW)]; }
  mirrorBoardHorizontally() { return this.applyBoardTransform(BOARD_TRANSFORMS.MIRROR_H); }
  mirrorBoardVertically() { return this.applyBoardTransform(BOARD_TRANSFORMS.MIRROR_V); }
  json(): GameState { return { id: this.id, board: cloneBoard(this.board), score: this.score, complete: this.gameOver, won: this.won, gameOver: this.gameOver, seed: this.seed, rngState: this.rng.state, moveCount: this.moveCount, undoCooldownRemaining: this.undoCooldownRemaining, moves: this.moves, createdOn: this.createdOn }; }
}
