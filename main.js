import m from "mithril";
import tagl from "tagl-mithril";

const { div, h1, p, button, svg, circle } = tagl(m);

const use = (v, f) => f(v);
const range = (n) => Array.from({ length: n }, (_, i) => i);

const coords = (i) => ({ column: i % 8, row: Math.trunc(i / 8) });
const index = ({ row, column }) => column + row * 8;
const WHITE = 2;
const WHITE_QUEEN = 2 * WHITE;
const BLACK = 3;
const BLACK_QUEEN = 2 * BLACK;

const state = {
  field: [],
  currentPlayer: undefined,
  selected: -1,
  possibleMoves: [],
};

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
  row >= 0 && row < 8 && column >= 0 && column < 8;

const pawnMatcher = /(^_$)|(^o_$)/;
const queenMatcher = /^(_*)(o_){0,1}$/;

const directions = [
  ({ row, column }) => ({ row: row - 1, column: column - 1 }),
  ({ row, column }) => ({ row: row - 1, column: column + 1 }),
  ({ row, column }) => ({ row: row + 1, column: column - 1 }),
  ({ row, column }) => ({ row: row + 1, column: column + 1 }),
];

const defaultDirections = (color) =>
  isWhite(color || current()) ? directions.slice(0, 2) : directions.slice(2, 4);

const genWord = (coords, dir, length, result = { word: "", idx: -1, xidx: -1  }) => {
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
  const max = isQueen(at(idx)) ? 7 : 2;
  const matcher = isQueen(at(idx)) ? queenMatcher : pawnMatcher;

  const words = flatMap(
    flatMap(
      dirs.map((dir) =>
        range(max)
          .map((length) =>
            range(length + 1)
              .map((l) => l + 1)
              .map((l) =>
                use(genWord(coords(idx), dir, l), (pos) =>
                  pos && matcher.test(pos.word) ? pos : undefined
                )
              )
              .filter((e) => e !== undefined)
          )
          .filter((e) => e.length > 0)
      )
    )
  );

  return words;
};

const newGame = () => {
  state.field = range(64).map((i) =>
    isField(i) && i < 24 ? BLACK : isField(i) && i > 39 ? WHITE : 0
  );
  state.currentPlayer = WHITE;
};

newGame();

const select = (idx) => {
  if (state.selected === idx) {
    state.selected = -1;
    state.possibleMoves = [];
    return;
  }
  if (state.selected === -1) {
    if (!isCurrent(at(idx))) return;
    state.selected = idx;
    state.possibleMoves = possibleMoves(state.selected);
    return;
  }
  let move = state.possibleMoves.find(p=>p.idx === idx);
  if (move) {
    const type = state.field[state.selected];
    state.field[state.selected] = 0;
    if (move.xidx>-1)
        state.field[move.xidx] = 0 
    state.field[idx] = type;
    state.selected = -1;
    state.possibleMoves = [];
    nextPlayer();
  }
};

const stone = (vnode) => ({
  view: (vnode) =>
    svg(
      { viewBox: "0 0 100 100" },
      circle({ cx: "50", cy: "50", r: "40", fill: `${vnode.attrs.color}` }),
      vnode.attrs.queen
        ? circle({ cx: "50", cy: "50", r: "14", fill: `${"white"}` })
        : null
    ),
});

m.mount(document.body, {
  view: () => [
    div.board(
      state.field.map((i, idx) =>
        div.field[use(coords(idx), (c) => (isField(idx) ? "black" : "white"))][
          state.selected === idx ? "selected" : ""
        ][
          state.possibleMoves.map((p) => p.idx).includes(idx) ? "possible" : ""
        ](
          { onclick: () => select(idx) },
          i > 0
            ? div(
                m(stone, {
                  color: i === 2 ? "salmon" : "black",
                  queen: i > BLACK,
                })
              )
            : undefined // use(coords(idx), (c) => c.row + "," + c.column)
        )
      )
    ),
  ],
});
