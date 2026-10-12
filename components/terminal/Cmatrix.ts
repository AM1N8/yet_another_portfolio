export type MatrixScreen = {
  cols: number;
  rows: number;
  write: (text: string) => void;
};

export function startCmatrix(screen: MatrixScreen, reducedMotion: boolean) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;
  let visible = !document.hidden;
  let reduced = reducedMotion;
  let frame = 0;
  const characters = "01AFXD4CV7";
  screen.write("\x1b[?1049h\x1b[?25l\x1b[2J");
  const draw = () => {
    if (stopped || !visible) return;
    const columns = Math.min(screen.cols, 90);
    const rows = Math.max(1, Math.min(screen.rows - 2, 24));
    let output = "\x1b[H\x1b[32m";
    for (let row = 0; row < rows; row++) {
      let line = "";
      for (let column = 0; column < columns; column++) {
        const cycle = rows + 8;
        const distance =
          (((column * 17 + frame) % cycle) - row + cycle) % cycle;
        line +=
          column % 3 === 0 && distance < 8
            ? characters[(column + row + frame) % characters.length]
            : " ";
      }
      output += `\x1b[${row + 1};1H${line}\x1b[K`;
    }
    output += `\x1b[${rows + 1};1H\x1b[0mCMATRIX / CTRL+C TO STOP\x1b[K`;
    screen.write(output);
    frame++;
    if (!reduced) timer = setTimeout(draw, 100);
  };
  const setVisible = (next: boolean) => {
    visible = next;
    clearTimeout(timer);
    timer = undefined;
    if (visible) draw();
  };
  const setReducedMotion = (next: boolean) => {
    reduced = next;
    clearTimeout(timer);
    timer = undefined;
    draw();
  };
  draw();
  return {
    setVisible,
    setReducedMotion,
    dispose() {
      if (stopped) return;
      stopped = true;
      clearTimeout(timer);
      timer = undefined;
      screen.write("\x1b[0m\x1b[?25h\x1b[?1049l");
    },
  };
}
