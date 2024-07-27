import * as vscode from "vscode";

export class Cursor {
  constructor(private _index: number) {}

  get index(): number {
    return this._index;
  }

  updateIndex(change: number): void {
    this._index += change;
  }
}

export class CursorManager {
  private cursors: Cursor[] = [];

  createCursor(initialIndex: number): Cursor {
    const cursor = new Cursor(initialIndex);
    this.cursors.push(cursor);
    return cursor;
  }

  updateCursors(event: vscode.TextDocumentChangeEvent): void {
    const changes = event.contentChanges;
    for (const change of changes) {
      const startOffset = change.rangeOffset;
      const lengthDelta = change.text.length - change.rangeLength;

      this.cursors.forEach((cursor) => {
        if (cursor.index > startOffset) {
          cursor.updateIndex(lengthDelta);
        }
      });
    }
  }

  clear(): void {
    this.cursors = [];
  }
}
