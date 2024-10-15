import m from "mithril";
import tagl from "tagl-mithril";

const { div, h1, p, button } = tagl(m);

const use = (v, f) => f(v);
const range = (n) => Array.from({ length: n }, (_, i) => i);

const coords = (i) => ({ row: i % 8, column: Math.trunc(i / 8) });
const index = ({ row, column }) => row + column * 8;
const WHITE = 2;
const BLACK = 3;

const state = { field: [], currentPlayer: 2, selected: -1, possibleMoves: [] };

const current = () => state.currentPlayer;
const opponent = () => (current() === 2 ? 3 : 2);

const isCurrent = (color) => color > 0 && color % current() === 0;
const isOpponent = (color) => color > 0 && color % opponent() === 0;
const nextPlayer = () => (state.currentPlayer = opponent());
const at = (i) => state.field[i];
const onBoard = ({ row, column }) => row >= 0 && row < 8 && column >= 0 && column < 8;

const directions = [
  ({ row, column }) => ({ row: row - 1, column: column - 1 }),
  ({ row, column }) => ({ row: row - 1, column: column + 1 }),
  ({ row, column }) => ({ row: row + 1, column: column - 1 }),
  ({ row, column }) => ({ row: row + 1, column: column + 1 }),
];

const defaultDirections = () =>
  current() === 2 ? directions.slice(0, 2) : directions.slice(2, 4);

const possibleMoves = (idx) => {
  if (!isCurrent(at(idx))) return [];
  if (at(idx) <= 3) {
    return defaultDirections()
      .map((f) => f(coords(idx)))
      .filter(onBoard)
      .map((c) => index(c))
      .filter((i) => at(i) === 0);
  }
};

const newGame = () => {
  state.field = range(64).map((i) =>
    use(coords(i), (c) =>
      (c.row + c.column) % 2 && i < 24
        ? 3
        : (c.row + c.column) % 2 && i > 39
        ? 2
        : 0
    )
  );
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
};

const stone = (vnode) => ({
  view: (vnode) =>
    m(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 100 100",
        // width: "min(10vw, 10vh)",
        // height: "min(10vw, 10vh)",
        style: { color: `${vnode.attrs.color}` },
      },
      m("circle", { cx: "50", cy: "50", r: "40", fill: `${vnode.attrs.color}` })
    ),
});

m.mount(document.body, {
  view: () => [
    div.board(
      state.field.map((i, idx) =>
        div.field[
          use(coords(idx), (c) => ((c.row + c.column) % 2 ? "black" : "white"))
        ][state.selected === idx ? "selected" : ""][state.possibleMoves.includes(idx)?"possible":""](
          i > 0
            ? div(
                { onclick: () => select(idx) },
                m(stone, { color: i === 2 ? "salmon" : "black" })
              )
            : undefined // use(coords(idx), (c) => c.row +","+ c.column)
        )
      )
    ),
    button({ onclick: nextPlayer }, "Next player"),
  ],
});
