import * as vscode from "vscode";
import * as t from 'io-ts';
import { queryFormatted, type Tool } from 'typai';
import OpenAI from 'openai';

const prompt = `Please merge the following two texts appropriately:
The first document is a complete document.
Please insert the differences written in the second document into the first document 
while maintaining the first document as much as possible.
Don't insert any additional newline.
If there is no difference, please return the first document as it is.
"%=%="... is a just a separator and should not be included in the final document.`;

let postSample = false;
// postSample = true;

export async function postToAi(
  config: vscode.WorkspaceConfiguration, 
  originalDocument: string, 
  clipboardContent: string): Promise<string> {

  if (!postSample) {
    const apiKey = config.get<string>('apiKey');
    if (!apiKey) {
      throw new Error('API key is not set');
    }
    const baseURL = config.get<string>('baseURL') ?? "https://api.openai.com/v1";
    const model = config.get<string>('model') ?? "gpt-4o-mini";
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

    const r = await queryFormatted<MergeType>(
      openai,
      model,
      [
        {role: "system", content: prompt},
        {role: "user", content: "1st document:\n" + originalDocument},
        {role: "assistant", content: "ok"},
        {role: "user", content: "2nd document:\n" + clipboardContent},
        {role: "assistant", content: "ok"},
        {role: "user", content: "Please return the merged result."}
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