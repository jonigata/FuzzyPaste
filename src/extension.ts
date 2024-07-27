import * as vscode from "vscode";
import { postToAi } from "./postToAi";
import { BlockDecorator, makeDiff, makePatchedText, findDiffBlocks, makeDiffBlockCursors } from "./inlineDiff";
import { DiffCodeLensProvider } from "./codeLens";
import { DiffBlockCursors } from "./diffBlock";
import { CursorManager } from "./cursor";
import { showNotificationWithProgress } from "./progress";

export function activate(context: vscode.ExtensionContext) {
  let diffBlockCursors: DiffBlockCursors[] = [];
  const cursorManager = new CursorManager();
  const blockDecorator = new BlockDecorator();
  const diffCodeLensProvider = new DiffCodeLensProvider();

  // cursormanager
  vscode.workspace.onDidChangeTextDocument(
    (event: vscode.TextDocumentChangeEvent) => {
      if (event.reason === vscode.TextDocumentChangeReason.Undo ||
          event.reason === vscode.TextDocumentChangeReason.Redo) {
        updateDiffBlockCursors(vscode.window.activeTextEditor!);
      } else {
        cursorManager.updateCursors(event);
      }
    },
    null,
    context.subscriptions
  );

  // codelens
  context.subscriptions.push(
      vscode.languages.registerCodeLensProvider(
          { scheme: 'file' },
          diffCodeLensProvider
      )
  );

  function updateDiffBlockCursors(editor: vscode.TextEditor) {
    const diffBlocks = findDiffBlocks(editor.document);
    diffBlockCursors = makeDiffBlockCursors(cursorManager, diffBlocks);

    blockDecorator.updateDecorations(editor, diffBlockCursors);
    diffCodeLensProvider.updateDiffBlocks(diffBlockCursors);
  }

  let disposable = vscode.commands.registerCommand(
    "smartpaste.smartPaste",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("No active text editor");
        return;
      }

      try {
        const originalDocument = editor.document.getText();
        const clipboardContent = await vscode.env.clipboard.readText();

        const mergedText = await showNotificationWithProgress(
          `AI merging...`, 
          async (progress: vscode.Progress<{ message?: string; increment?: number }>, token: vscode.CancellationToken) => {
            return postToAi(
              vscode.workspace.getConfiguration('smartPaste'), 
              originalDocument, 
              clipboardContent);
          });

        const blocks = makeDiff(originalDocument, mergedText!);
        const patchedText = makePatchedText(blocks);

        // マージされたテキストでドキュメントを置き換え
        const fullRange = new vscode.Range(
          editor.document.positionAt(0),
          editor.document.positionAt(editor.document.getText().length)
        );
        await editor.edit(editBuilder => {
          editBuilder.replace(fullRange, patchedText);
        });
        updateDiffBlockCursors(editor);

        vscode.window.showInformationMessage("Content merged successfully");
      } catch (error) {
        console.error('Error in smartPaste:', error);
        let errorMessage = 'An unexpected error occurred';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        vscode.window.showErrorMessage(errorMessage);
      }
    }
  );
  context.subscriptions.push(disposable);

  context.subscriptions.push(
    vscode.commands.registerCommand('smartpaste.applyDiff', async (block: DiffBlockCursors, which: string) => {
      // 削除して追加
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("No active text editor");
        return;
      }

      const fullRange = new vscode.Range(
        editor.document.positionAt(block.fullRange[0].index),
        editor.document.positionAt(block.fullRange[1].index)
      );
      const adoptBlock = which === "upperBlock" ? block.upperBlock : block.lowerBlock;
      const adoptRange = new vscode.Range(
        editor.document.positionAt(adoptBlock[0].index),
        editor.document.positionAt(adoptBlock[1].index)
      );

      await editor.edit(editBuilder => {
        editBuilder.replace(fullRange, editor.document.getText(adoptRange));
      });

      updateDiffBlockCursors(editor);
    })
  );

  // apply all
  context.subscriptions.push(
    vscode.commands.registerCommand('smartpaste.applyAllDiff', async (isAccept: boolean) => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("No active text editor");
        return;
      }

      const a = diffBlockCursors;
      a.reverse();
      const editing: {fullRange: vscode.Range, adoptRange: vscode.Range}[] = [];
      for (const block of a) {
        const fullRange = new vscode.Range(
          editor.document.positionAt(block.fullRange[0].index),
          editor.document.positionAt(block.fullRange[1].index)
        );
          const adoptBlock = isAccept ? block.upperBlock : block.lowerBlock;
        const adoptRange = new vscode.Range(
          editor.document.positionAt(adoptBlock[0].index),
          editor.document.positionAt(adoptBlock[1].index)
        );
  
        editing.push({fullRange, adoptRange});
      }
      await editor.edit(editBuilder => {
        for (const {fullRange, adoptRange} of editing) {
          editBuilder.replace(fullRange, editor.document.getText(adoptRange));
        }
      });

      updateDiffBlockCursors(editor);
    })
  );
  

}

export function deactivate() {}