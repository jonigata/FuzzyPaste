import * as t from 'io-ts';
import { queryFormatted, type Tool } from 'typai';
import OpenAI from 'openai';

const normalPrompt = `Please merge the following two texts appropriately:
The first document is a complete document.
Please insert the differences written in the second document into the first document 
while maintaining the first document as much as possible.
Don't insert any additional newline.
If there is no difference, please return the first document as it is.`;

const usePatchPrompt = `Please create a patch file, like the output of 'diff -u' command, using the following two documents:

The first document is the complete original document.
The second document contains the modifications to be added to the original.
If the second document includes instructions (e.g., "same as before"), apply them as appropriate.

Try to maintain the formatting, spacing, and blank lines of the original document as much as possible.`;

const normalCommand = `Please return the merged document.`;
const usePatchCommand = `Please return the 'diff -u' file.`;

let postSample = false;
// postSample = true;

export async function postToAi(
  baseURL: string,
  apiKey: string,
  model: string,
  usePatch: boolean,
  originalDocument: string, 
  clipboardContent: string): Promise<string> {

  if (!postSample) {
    if (!apiKey) {
      throw new Error('API key is not set');
    }
    console.log(model);
    const openai = new OpenAI({apiKey, baseURL});
    
    // 現在のドキュメントの全テキストを取得
    const Merge = t.type({
      mergedDocument: t.string
    });
    type MergeType = t.TypeOf<typeof Merge>;
    const tool: Tool<MergeType> = {
      name: "sendMerged",
      description: "send merge result",
      parameters: Merge
    };

    const prompt = usePatch ? usePatchPrompt : normalPrompt;
    const command = usePatch ? usePatchCommand : normalCommand;

    const r = await queryFormatted<MergeType>(
      openai,
      model,
      [
        {role: "system", content: prompt},
        {role: "user", content: "1st document:\n" + originalDocument},
        {role: "assistant", content: "ok"},
        {role: "user", content: "2nd document:\n" + clipboardContent},
        {role: "assistant", content: "ok"},
        {role: "user", content: command}
      ],
      tool,
      { verbose: {maxLength: Infinity, indent: 2} }
    );

    let mergedText = r.parameters.mergedDocument;
    if (!mergedText.endsWith("\n")) {
      mergedText += "\n";
    }
    console.log(mergedText);
    return mergedText;
  } else {
    if (usePatch) {
      return `--- foo.py
+++ bar.py
@@ -1,15 +1,15 @@
def greet(name):
    """Greets the specified name"""
    print(f"Hello, {name}!")
 
-def add_numbers(a, b):
+def add_numbers(a, b, c):
-    """Takes two numbers and returns their sum"""
+    """Takes three numbers and returns their sum"""
-    return a + b
+    return a + b + c
 
 def is_even(number):
    """Checks if the given number is even"""
    return number % 2 == 0
 
-def show_user_info(username, age):
+def show_user_info(username, age, address):
-    """Displays the user's name and age"""
+    """Displays the user's name, age and address"""
-    print(f"Username: {username}, Age: {age}")
+    print(f"Username: {username}, Age: {age}, Address: {address}")
 
 def calculate_difference(x, y):
    """Calculates the difference between two numbers and returns it"""
    return x - y

`;
    } else {
      return `def greet(name):
    """指定された名前に対して挨拶を行う"""
    print(f"Hello, {name}!")

def add_numbers(a, b, c):
    """三つの数値を受け取り、その和を返す"""
    return a + b + c

def is_even(number):
    """与えられた数が偶数かどうかを判定する"""
    return number % 2 == 0

def show_user_info(username, age, address):
    """ユーザーの名前、年齢、住所を表示する"""
    print(f"Username: {username}, Age: {age}, Address: {address}")

def calculate_difference(x, y):
    """二つの数値の差を計算して返す"""
    return x - y
`;
    }
  }

}