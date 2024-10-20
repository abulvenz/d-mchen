import m from "mithril";
import tagl from "tagl-mithril";

const { div, h1, p, button, svg, circle, input, img } = tagl(m);

const use = (v, f) => f(v);
const range = (n) => Array.from({ length: n }, (_, i) => i);
const CONFIG_KEY = "checker_config";
const QUEEN_MULTIPLIER = 5;
const EMPTY = 0;
const WHITE = 2;
const WHITE_QUEEN = QUEEN_MULTIPLIER * WHITE;
const BLACK = 3;
const BLACK_QUEEN = QUEEN_MULTIPLIER * BLACK;
const showPossibleMovesImage = new URL(
  "showPossibleMoves.png?as=webp&width=250",
  import.meta.url
);
const captureOwnImage = new URL(
  "captureOwn.png?as=webp&width=250",
  import.meta.url
);

const config = use(localStorage.getItem(CONFIG_KEY), (storage) =>
  storage
    ? JSON.parse(storage)
    : {
        showPossibleMoves: true,
        captureOwnAfterIllegalMove: false,
      }
);

const state = {
  N: 8,
  M: 8,
  FIGURES_PER_USER: 12,
  field: [],
  currentPlayer: undefined,
  selected: -1,
  possibleMoves: [],
  config,
};

const saveConfig = () =>
  localStorage.setItem(CONFIG_KEY, JSON.stringify(state.config));

let showOptions = false;
const toggleOptions = () => (showOptions = !showOptions);
const coords = (i) => ({ column: i % state.N, row: Math.trunc(i / state.N) });
const index = ({ row, column }) => column + row * state.N;

const current = () => state.currentPlayer;
const opponent = () => (current() === WHITE ? BLACK : WHITE);
const isWhite = (color) => color > 0 && color % WHITE === 0;
const isBlack = (color) => color > 0 && color % BLACK === 0;
const isField = (i) => use(coords(i), (c) => (c.row + c.column) % 2);
const isCurrent = (color) => color > 0 && color % current() === 0;
const isOpponent = (color) => color > 0 && color % opponent() === 0;
const nextPlayer = () => (state.currentPlayer = opponent());
const isQueen = (color) => color > BLACK;
const at = (i) => state.field[i];
const flatMap = (arr, m = (e) => e) =>
  arr.reduce((acc, v) => acc.concat(m(v)), []);
const onBoard = ({ row, column }) =>
  row >= 0 && row < state.M && column >= 0 && column < state.N;
const currentStones = () =>
  state.field
    .map((e, i) => (isCurrent(e) ? i : undefined))
    .filter((e) => e !== undefined);
const canCapture = (moves) => moves.find((move) => move.xidx > 0);
const pawnMatcher = /(^_$)|(^o_$)/;
const queenMatcher = /^(_*)(o_){0,1}$/;
const onForeignShores = (idx) =>
  use(coords(idx), (p) =>
    isWhite(at(idx)) ? p.row === 0 : p.row === state.M - 1
  );
const queenify = (idx) => (state.field[idx] = state.field[idx] * 5);
const resetSelection = () => {
  state.possibleMoves = [];
  state.selected = -1;
};
const capturesOpponent = (move) => move && move.xidx > -1;
const capture = (idx) => (state.field[idx] = 0);
const directions = [
  ({ row, column }) => ({ row: row - 1, column: column - 1 }),
  ({ row, column }) => ({ row: row - 1, column: column + 1 }),
  ({ row, column }) => ({ row: row + 1, column: column - 1 }),
  ({ row, column }) => ({ row: row + 1, column: column + 1 }),
];

const defaultDirections = (color) =>
  isWhite(color || current()) ? directions.slice(0, 2) : directions.slice(2, 4);

const genWord = (
  coords,
  dir,
  length,
  result = { word: "", idx: -1, xidx: -1, sidx: index(coords) }
) => {
  if (length === 0) {
    result.idx = index(coords);
    return result;
  }
  const next = dir(coords);
  if (!onBoard(next)) return undefined;
  const color = at(index(next));
  const value = isOpponent(color) ? "o" : isCurrent(color) ? "x" : "_";
  if (isOpponent(color)) result.xidx = index(next);
  result.word += value;
  return genWord(next, dir, length - 1, result);
};

const possibleMoves = (idx) => {
  if (!isCurrent(at(idx))) return [];
  const dirs = isQueen(at(idx)) ? directions : defaultDirections();
  const lengthes = (isQueen(at(idx)) ? range(7) : range(2)).map((l) => l + 1);
  const matcher = isQueen(at(idx)) ? queenMatcher : pawnMatcher;

  const words = flatMap(
    dirs
      .map((dir) =>
        lengthes
          .map((l) =>
            use(genWord(coords(idx), dir, l), (pos) =>
              pos && matcher.test(pos.word) ? pos : undefined
            )
          )
          .filter((e) => e !== undefined)
      )
      .filter((e) => e.length > 0)
  );

  return words;
};

const newGame = () => {
  resetSelection();
  state.field = range(state.N * state.M).map((i) =>
    isField(i) && i < state.FIGURES_PER_USER * 2
      ? BLACK
      : isField(i) && i > state.N * state.M - state.FIGURES_PER_USER * 2 - 1
      ? WHITE
      : EMPTY
  );
  state.currentPlayer = WHITE;
};

newGame();

const select = (idx) => {
  if (state.selected === idx) return resetSelection();
  if (state.selected === -1) {
    if (!isCurrent(at(idx))) return;
    state.selected = idx;
    state.possibleMoves = possibleMoves(state.selected);
    return;
  }
  let move = state.possibleMoves.find((p) => p.idx === idx);
  if (move) {
    const type = state.field[state.selected];
    if (capturesOpponent(move)) {
      capture(move.xidx);
    } else {
      const allPossibleMoves = flatMap(currentStones(), possibleMoves);
      const canCapturePos = canCapture(allPossibleMoves);
      if (canCapturePos) {
        if (state.config.captureOwnAfterIllegalMove)
          capture(canCapturePos.sidx);
        resetSelection();
        if (state.config.captureOwnAfterIllegalMove) return nextPlayer();
        else return;
      }
    }
    state.field[state.selected] = 0;
    state.field[idx] = type;
    resetSelection();
    if (onForeignShores(idx) && !isQueen(at(idx))) queenify(idx);
    const allPossibleMoves = possibleMoves(idx);
    const canCapturePos = canCapture(allPossibleMoves);
    if (move.xidx > -1 && canCapturePos) {
      // continue;
    } else nextPlayer();
  }
};

const stone = (vnode) => ({
  view: (vnode) =>
    svg(
      { viewBox: "0 0 100 100" },
      circle({ cx: "50", cy: "50", r: "40", fill: `${vnode.attrs.color}` }),
      vnode.attrs.queen
        ? circle({ cx: "50", cy: "50", r: "14", fill: `${"gray"}` })
        : null
    ),
});

m.mount(document.body, {
  view: () => [
    showOptions
      ? div(
          div(
            input({
              type: "checkbox",
              checked: state.config.showPossibleMoves,
              onchange: (s) =>
                saveConfig((state.config.showPossibleMoves = s.target.checked)),
            }),
            img({ src: showPossibleMovesImage })
          ),
          div(
            input({
              type: "checkbox",
              checked: state.config.captureOwnAfterIllegalMove,
              onchange: (s) =>
                saveConfig(
                  (state.config.captureOwnAfterIllegalMove = s.target.checked)
                ),
            }),
            img({ src: captureOwnImage })
          )
        )
      : div.board(
          { style: `--N:${state.N};--M:${state.M}` },
          state.field.map((i, idx) =>
            div.field[
              use(coords(idx), (c) => (isField(idx) ? "black" : "white"))
            ][state.selected === idx ? "selected" : ""][
              state.config.showPossibleMoves &&
              state.possibleMoves.map((p) => p.idx).includes(idx)
                ? "possible"
                : ""
            ](
              { onclick: () => select(idx) },
              i > 0
                ? div(
                    m(stone, {
                      color: isWhite(i) ? "salmon" : "black",
                      queen: isQueen(i),
                    })
                  )
                : undefined // use(coords(idx), (c) => c.row + "," + c.column)
            )
          )
        ),
    div.ampel(
      { onclick: () => toggleOptions() },
      m(stone, { color: isWhite(current()) ? "salmon" : "black" })
    ),
  ],
});
