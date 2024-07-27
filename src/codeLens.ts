import * as vscode from "vscode";
import { DiffBlockCursors } from "./diffBlock";
import { Cursor } from "./cursor";

export class DiffCodeLensProvider implements vscode.CodeLensProvider {
  private diffBlocks: DiffBlockCursors[] = [];

  updateDiffBlocks(newDiffBlocks: DiffBlockCursors[]) {
    this.diffBlocks = newDiffBlocks;
  }

  provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
    console.log("provideCodeLenses", this.diffBlocks.length);

    const codeLenses: vscode.CodeLens[] = [];
    function codeLens(range: vscode.Range, title: string, command: string, args: any) {
      codeLenses.push(new vscode.CodeLens(range, {
        title: title,
        command: "fuzzypaste." + command,
        arguments: args,
      }));
    }

    if (0 < this.diffBlocks.length) {
      const range = new vscode.Range(document.positionAt(0),document.positionAt(1));
      codeLens(range, "Accept All", "applyAllDiff", [true]);
      codeLens(range, "Reject All", "applyAllDiff", [false]);

      this.diffBlocks.forEach((block) => {
        const range = new vscode.Range(
          document.positionAt(block.fullRange[0].index),
          document.positionAt(block.fullRange[0].index + 1)
        );
        codeLens(range, "Accept", "applyDiff", [block, "upperBlock"]);
        codeLens(range, "Reject", "applyDiff", [block, "lowerBlock"]);
      });
    }

    return codeLenses;
  }
}
