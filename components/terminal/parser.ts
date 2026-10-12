export function parseCommand(input: string): string[] {
  const words: string[] = [];
  let word = "";
  let quote = "";
  let escaped = false;
  let started = false;
  for (const character of input) {
    if (escaped) {
      word += character;
      escaped = false;
      started = true;
    } else if (character === "\\" && quote !== "'") {
      escaped = true;
      started = true;
    } else if (quote) {
      if (character === quote) quote = "";
      else word += character;
    } else if (character === "'" || character === '"') {
      quote = character;
      started = true;
    } else if (/\s/.test(character)) {
      if (started) words.push(word);
      word = "";
      started = false;
    } else {
      word += character;
      started = true;
    }
  }
  if (quote) throw new Error("Unclosed quote.");
  if (escaped) word += "\\";
  if (started) words.push(word);
  return words;
}
