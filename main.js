import m from "mithril";
import tagl from "tagl-mithril";

const { div, h1, p } = tagl(m);

const use = (v, f) => f(v);
const range = (n) => Array.from({ length: n }, (_, i) => i);

const coords = (i) => ({ row: i % 8, column: Math.trunc(i / 8) });

const state = { field: [] };

const newGame = () => {
  state.field = range(64).map((i) =>
    use(coords(i), (c) =>
      (c.row + c.column) % 2 && i < 24
        ? 1
        : (c.row + c.column) % 2 && i > 39
        ? 2
        : 0
    )
  );
};

newGame();

const stone = (vnode) => ({
  view: (vnode) =>
    m(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 100 100",
        width: "min(10vw, 10vh)",
        height: "min(10vw, 10vh)",
        style: { color: `${vnode.attrs.color}` },
      },
      m("circle", { cx: "50", cy: "50", r: "40", fill: `${vnode.attrs.color}` })
    ),
});

m.mount(document.body, {
  view: () =>
    div.board(
      state.field.map((i, idx) =>
        div.field[
          use(coords(idx), (c) => ((c.row + c.column) % 2 ? "black" : "white"))
        ](
          i > 0
            ? div(
                { onclick: (e) => console.log(idx) },
                m(stone, { color: i === 1 ? "white" : "black" })
              )
            : undefined
        )
      )
    ),
});
