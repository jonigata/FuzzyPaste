import * as vscode from "vscode";
import { DiffBlockCursors } from "./diffBlock";

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

    this.diffBlocks.forEach((block, index) => {
      const range = new vscode.Range(
        document.positionAt(block.fullRange[0].index),
        document.positionAt(block.fullRange[0].index + 1)
      );

      codeLenses.push(
        new vscode.CodeLens(range, {
          title: "Accept",
          command: "fuzzypaste.applyDiff",
          arguments: [block, "upperBlock"],
        })
      );

      codeLenses.push(
        new vscode.CodeLens(range, {
          title: "Reject",
          command: "fuzzypaste.applyDiff",
          arguments: [block, "lowerBlock"],
        })
      );
    });

    return codeLenses;
  }
}
