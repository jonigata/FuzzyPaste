import * as vscode from "vscode";
import * as t from 'io-ts';
import { queryFormatted, type Tool } from 'typai';
import OpenAI from 'openai';

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "fuzzypaste.fuzzyPaste",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("No active text editor");
        return;
      }

      try {
        const config = vscode.workspace.getConfiguration('fuzzyPaste');
        const apiKey = config.get<string>('apiKey');
        if (!apiKey) {
          throw new Error('API key is not set');
        }
        const baseURL = config.get<string>('baseURL') ?? "https://api.openai.com/v1";
        const model = config.get<string>('model') ?? "gpt-4-0125-preview";
        const openai = new OpenAI({apiKey, baseURL});
        
        // 現在のドキュメントの全テキストを取得
        const fullText = editor.document.getText();
        
        // クリップボードの内容を取得
        const clipboardContent = await vscode.env.clipboard.readText();
        
        const Merge = t.type({
          mergedDocument: t.string,
        });
        type MergeType = t.TypeOf<typeof Merge>;
        const tool: Tool<MergeType> = {
          name: "sendMerged",
          description: "send merge result",
          parameters: Merge
        };

        // AIにマージを依頼
        const r = await queryFormatted<MergeType>(
          openai,
          model,
          `Please merge the following two texts appropriately:
          The first document is a complete document.
          The second document is a document with potential ambiguity.
          Interpret the notes in the second document and insert/overwrite them into the first document as necessary.
          

          1. Current document:
          %=%=%=%=%=%=%=%=%=%=%=%=%=%=%=%=%=%=%=%=%=%=%
          ${fullText}
          %=%=%=%=%=%=%=%=%=%=%=%=%=%=%=%=%=%=%=%=%=%=%

          2. Clipboard document:
          %=%=%=%=%=%=%=%=%=%=%=%=%=%=%=%=%=%=%=%=%=%=%
          ${clipboardContent}
          %=%=%=%=%=%=%=%=%=%=%=%=%=%=%=%=%=%=%=%=%=%=%

          Please return the merged result.`, 
          tool
        );

        const mergedText = r.parameters.mergedDocument;

        // マージ結果で全テキストを置き換え
        await editor.edit((editBuilder) => {
          const fullRange = new vscode.Range(
            editor.document.positionAt(0),
            editor.document.positionAt(editor.document.getText().length)
          );
          editBuilder.replace(fullRange, mergedText);
        });

        vscode.window.showInformationMessage("Content merged successfully");
      } catch (error) {
        console.error('Error in fuzzyPaste:', error);
        let errorMessage = 'An unexpected error occurred';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        // エラーの種類に応じて異なるメッセージを表示
        if (errorMessage.includes('API key')) {
          vscode.window.showErrorMessage('Please set your OpenAI API key in the extension settings.');
        } else if (errorMessage.includes('Rate limit')) {
          vscode.window.showErrorMessage('OpenAI API rate limit exceeded. Please try again later.');
        } else if (errorMessage.includes('network')) {
          vscode.window.showErrorMessage('Network error occurred. Please check your internet connection.');
        } else {
          vscode.window.showErrorMessage(`Error: ${errorMessage}`);
        }
      }
    }
  );
  context.subscriptions.push(disposable);
}

export function deactivate() {}