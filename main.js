import m from "mithril";
import tagl from "tagl-mithril";

const { div, h1, p, button, svg, circle } = tagl(m);

const use = (v, f) => f(v);
const range = (n) => Array.from({ length: n }, (_, i) => i);

const coords = (i) => ({ column: i % 8, row: Math.trunc(i / 8) });
const index = ({ row, column }) => column + row * 8;
const WHITE = 2;
const BLACK = 3;

const state = {
  field: [],
  currentPlayer: undefined,
  selected: -1,
  possibleMoves: [],
};

const current = () => state.currentPlayer;
const opponent = () => (current() === WHITE ? BLACK : WHITE);

const isField = (i) => use(coords(i), (c) => (c.row + c.column) % 2);
const isCurrent = (color) => color > 0 && color % current() === 0;
const isOpponent = (color) => color > 0 && color % opponent() === 0;
const nextPlayer = () => (state.currentPlayer = opponent());
const at = (i) => state.field[i];
const onBoard = ({ row, column }) =>
  row >= 0 && row < 8 && column >= 0 && column < 8;

const directions = [
  ({ row, column }) => ({ row: row - 1, column: column - 1 }),
  ({ row, column }) => ({ row: row - 1, column: column + 1 }),
  ({ row, column }) => ({ row: row + 1, column: column - 1 }),
  ({ row, column }) => ({ row: row + 1, column: column + 1 }),
];

const defaultDirections = () =>
  current() === WHITE ? directions.slice(0, 2) : directions.slice(2, 4);

const possibleMoves = (idx) => {
  if (!isCurrent(at(idx))) return [];
  if (at(idx) <= BLACK) {
    return defaultDirections()
      .map((f) => f(coords(idx)))
      .filter(onBoard)
      .map((c) => index(c))
      .filter((i) => at(i) === 0);
  }
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
  if (state.possibleMoves.includes(idx)) {
    state.field[state.selected] = 0;
    state.field[idx] = current();
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
        ][state.possibleMoves.includes(idx) ? "possible" : ""](
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
