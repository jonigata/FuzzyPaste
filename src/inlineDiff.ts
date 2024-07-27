import * as vscode from "vscode";
import { diffLines, Change } from "diff";
import { DiffBlock, DiffBlockCursors } from "./diffBlock";
import { Cursor, CursorManager } from "./cursor";

let activeDecorations: vscode.TextEditorDecorationType[] = [];

type Block = {
  added: string;
  removed: string;
  others: string;
};

type Tag = "add" | "remove" | "others" | "empty";
const getDiffTag = (c: Change): Tag => {
  if (c.added) {
    return "add";
  } else if (c.removed) {
    return "remove";
  } else {
    return "others";
  }
};

export function makeDiff(originalText: string, modifiedText: string): Block[] {
  const diffs = diffLines(originalText, modifiedText, {
    ignoreWhitespace: false,
  });

  // 次にadd+removeの組み合わせを結合する
  const result: Block[] = [];
  let i = 0;
  while (i < diffs.length - 1) {
    const curr = diffs[i];
    if (getDiffTag(curr) === "add") {
      const next = diffs[i + 1];
      if (getDiffTag(next) === "remove") {
        result.push({ added: curr.value, removed: next.value, others: "" });
        i += 2;
      } else {
        result.push({ added: curr.value, removed: "", others: "" });
        i += 1;
      }
    } else if (getDiffTag(curr) === "remove") {
      const next = diffs[i + 1];
      if (getDiffTag(next) === "add") {
        result.push({ added: next.value, removed: curr.value, others: "" });
        i += 2;
      } else {
        result.push({ added: "", removed: curr.value, others: "" });
        i += 1;
      }
    } else {
      result.push({ added: "", removed: "", others: curr.value });
      i += 1;
    }
  }
  if (i < diffs.length) {
    const tag = getDiffTag(diffs[i]);
    if (tag === "add") {
      result.push({ added: diffs[i].value, removed: "", others: "" });
    } else if (tag === "remove") {
      result.push({ added: "", removed: diffs[i].value, others: "" });
    } else {
      result.push({ added: "", removed: "", others: diffs[i].value });
    }
  }

  //console.log(result);
  return result;
}

export function makePatchedText(blocks: Block[]): string {
  // Clear existing decorations
  activeDecorations.forEach((d) => d.dispose());
  activeDecorations = [];

  const markerLength = 72;
  const acceptMark = ">".repeat(markerLength) + " fd\n";
  const middleMark = "=".repeat(markerLength) + "\n";
  const rejctMark = "<".repeat(markerLength) + "\n";

  let text = "";
  blocks.forEach((block) => {
    if (block.added || block.removed) {
      text += acceptMark;
      text += block.added;
      text += middleMark;
      text += block.removed;
      text += rejctMark;
    } else {
      text += block.others;
    }
  });

  return text;
}

export function findDiffBlocks(document: vscode.TextDocument): DiffBlock[] {
  const text = document.getText();
  const diffBlockRegex =
    /^(>{10,} fd\n)([\s\S]*?)^(={10,}\n)([\s\S]*?)^(<{10,}\n)/gm;
  const diffBlocks: DiffBlock[] = [];

  // match[1] 上マーカー
  // match[2] 上部の変更
  // match[3] 中マーカー
  // match[4] 下部の変更
  // match[5] 下マーカー
  let match: RegExpExecArray | null;
  while ((match = diffBlockRegex.exec(text)) !== null) {
    const fullStartPos = match.index;
    const fullEndPos = fullStartPos + match[0].length;

    const upperStartPos = match.index + match[1].length;
    const upperEndPos = upperStartPos + match[2].length;

    const lowerStartPos = upperEndPos + match[3].length;
    const lowerEndPos = lowerStartPos + match[4].length;

    diffBlocks.push({
      fullRange: [fullStartPos, fullEndPos],
      upperBlock: [upperStartPos, upperEndPos],
      lowerBlock: [lowerStartPos, lowerEndPos],
    });
  }

  return diffBlocks;
}

export class BlockDecorator {
  private upperBlockDecorator: vscode.TextEditorDecorationType;
  private lowerBlockDecorator: vscode.TextEditorDecorationType;
  private symbolLineDecorator: vscode.TextEditorDecorationType;

  constructor() {
    this.upperBlockDecorator = vscode.window.createTextEditorDecorationType({
      backgroundColor: "rgba(0, 255, 0, 0.2)", // 薄い緑色
      isWholeLine: true,
    });

    this.lowerBlockDecorator = vscode.window.createTextEditorDecorationType({
      backgroundColor: "rgba(255, 0, 0, 0.2)", // 薄い赤色
      isWholeLine: true,
    });

    this.symbolLineDecorator = vscode.window.createTextEditorDecorationType({
      backgroundColor: "rgba(0, 0, 50, 0.3)", // 黒に近い青
      isWholeLine: true,
      opacity: "0.3", // 30%の不透明度
      color: "gray",
    });
  }

  public updateDecorations(editor: vscode.TextEditor, diffBlockCursors: DiffBlockCursors[]) {
    const upperRanges: vscode.Range[] = [];
    const lowerRanges: vscode.Range[] = [];
    const symbolLineRanges: vscode.Range[] = [];

    function isEmpty([start, end]: [Cursor, Cursor]): boolean {
      return start.index === end.index;
    }
    function addRange(ranges: vscode.Range[], [start, end]: [Cursor, Cursor]) {
      // diffBlocksは[b,e)だがライン単位のupperRangesなどは[b,e]なので、細工する
      ranges.push(
        new vscode.Range(
          editor.document.positionAt(start.index),
          editor.document.positionAt(end.index).translate(-1)
        )
      );
    }

    for (const block of diffBlockCursors) {
      if (!isEmpty(block.upperBlock)) {
        addRange(upperRanges, block.upperBlock);
      }
      if (!isEmpty(block.lowerBlock)) {
        addRange(lowerRanges, block.lowerBlock);
      }
      addRange(symbolLineRanges, [block.fullRange[0], block.upperBlock[0]]);
      addRange(symbolLineRanges, [block.upperBlock[1], block.lowerBlock[0]]);
      addRange(symbolLineRanges, [block.lowerBlock[1], block.fullRange[1]]);
    }

    editor.setDecorations(this.upperBlockDecorator, upperRanges);
    editor.setDecorations(this.lowerBlockDecorator, lowerRanges);
    editor.setDecorations(this.symbolLineDecorator, symbolLineRanges);
  }

  public dispose() {
    this.upperBlockDecorator.dispose();
    this.lowerBlockDecorator.dispose();
    this.symbolLineDecorator.dispose();
  }
}

export function makeDiffBlockCursors(
  cursorManager: CursorManager,
  diffBlocks: DiffBlock[]
): DiffBlockCursors[] {
  function makeRangeCursors(
    [start, end]: [number, number]
  ): [Cursor, Cursor] {
    const startCursor = cursorManager.createCursor(start);
    const endCursor = cursorManager.createCursor(end);
    return [startCursor, endCursor];
  }

  cursorManager.clear();

  const cursors: DiffBlockCursors[] = [];
  for (const block of diffBlocks) {
    cursors.push({
      fullRange: makeRangeCursors(block.fullRange),
      upperBlock: makeRangeCursors(block.upperBlock),
      lowerBlock: makeRangeCursors(block.lowerBlock)
    });
  }
  return cursors;
}