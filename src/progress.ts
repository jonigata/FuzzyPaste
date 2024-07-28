import * as vscode from "vscode";

let notificationPromise: Thenable<void> | undefined;

export async function showNotificationWithProgress<T>(
  title: string,
  task: (progress: vscode.Progress<{ message?: string; increment?: number }>, token: vscode.CancellationToken) => Promise<T>
): Promise<T> {
  // 既存の通知があれば待機
  if (notificationPromise) {
      await notificationPromise;
  }

  return new Promise<T>((resolve, reject) => {
      notificationPromise = vscode.window.withProgress({
          location: vscode.ProgressLocation.Notification,
          title: title,
          cancellable: true
      }, async (progress, token) => {
          token.onCancellationRequested(() => {
              reject(new Error("The user canceled the process"));
          });

          try {
            const result = await task(progress, token);
            resolve(result);
          } catch (error) {
              vscode.window.showErrorMessage(`The process has failed: ${error}`);
              reject(error);
          } finally {
              notificationPromise = undefined;
          }
      });

      notificationPromise.then(() => {
          notificationPromise = undefined;
      });
  });
}