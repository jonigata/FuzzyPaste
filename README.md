# SmoothPaste

SmoothPaste is a VSCode extension that enhances your pasting experience by intelligently merging clipboard content with your current document using AI. It provides an interactive diff view, allowing you to easily review and apply changes.

## Key Feature

SmoothPaste excels at applying partial code changes while intelligently preserving the rest of your document. Here's a quick example:

### Original Document (DocumentA.txt):
```python
def process_data(data):
    result = []
    for item in data:
        if item > 0:
            result.append(item * 2)
    return result

# Usage
data = [1, -2, 3, -4, 5]
processed = process_data(data)
print(processed)
```

### Clipboard Content:
```python
def process_data(data):
    result = []
    for item in data:
        result.append(abs(item) * 2)  # Handle both positive and negative numbers
    return result
# The rest remains the same
```

### Result After Using SmoothPaste:
```python
def process_data(data):
    result = []
    for item in data:
        result.append(abs(item) * 2)  # Handle both positive and negative numbers
    return result

# Usage
data = [1, -2, 3, -4, 5]
processed = process_data(data)
print(processed)
```

SmoothPaste intelligently applies the changes from your clipboard, understanding that "The rest remains the same" means preserving the unmodified parts of your original document.

## Features

- AI-powered merging of clipboard content with the current document
- Interactive diff view for easy review of changes
- Apply changes selectively or all at once
- Undo/Redo support
- Progress indicator during AI processing

![SmoothPaste in action](https://raw.githubusercontent.com/jonigata/SmoothPaste/main/smoothpaste.gif)

## Requirements

- VSCode version 1.60.0 or higher
- An active internet connection for AI-powered merging
- OpenAI (or openrouter) API key

## Installation

1. Open VSCode
2. Go to the Extensions view (Ctrl+Shift+X)
3. Search for "SmoothPaste"
4. Click Install

## Usage

SmoothPaste can be activated in two ways:

1. Command Palette: Open the Command Palette (Ctrl+Shift+P or Cmd+Shift+P on Mac) and search for "SmoothPaste: Smooth Paste".

2. Keyboard Shortcut: By default, SmoothPaste is bound to `Ctrl+Shift+Alt+V`.

To use SmoothPaste:

1. Copy some text to your clipboard
2. In VSCode, place your cursor where you want to paste
3. Use the keyboard shortcut `Ctrl+Shift+Alt+V` or the Command Palette to activate SmoothPaste
4. The extension will merge the clipboard content with your document using AI
5. Review the changes in the diff view
6. Use the CodeLens actions to apply or reject changes

### Customizing the Keyboard Shortcut

If you wish to change the default keyboard shortcut:

1. Open the Command Palette (Ctrl+Shift+P or Cmd+Shift+P on Mac)
2. Type "Preferences: Open Keyboard Shortcuts"
3. Search for "smoothpaste.smoothPaste"
4. Click on the pencil icon next to the current binding and enter your preferred shortcut

### Commands

- `smoothpaste.smoothPaste`: Initiate the smooth paste process

## Extension Settings

This extension contributes the following settings:

* `smoothPaste.apiKey`: API Key for OpenAI (required)
* `smoothPaste.baseURL`: Base URL for OpenAI API (default: "https://api.openai.com/v1")
* `smoothPaste.model`: OpenAI model to use (default: "gpt-4o-mini")

To configure these settings:

1. Open VSCode Settings (File > Preferences > Settings)
2. Search for "SmoothPaste"
3. Enter your OpenAI API key in the "API Key" field
4. Optionally, adjust the base URL and model as needed

## OpenRouter Support

SmoothPaste now supports OpenRouter, allowing you to use a variety of AI models beyond OpenAI's offerings.

To use OpenRouter:

1. Sign up for an account at [OpenRouter](https://openrouter.ai/)
2. Obtain your API key from OpenRouter
3. Update your SmoothPaste settings:
   - Set `smoothPaste.baseURL` to "https://openrouter.ai/api/v1"
   - Set `smoothPaste.apiKey` to your OpenRouter API key
   - Choose your preferred model and set it in `smoothPaste.model`

Example configuration for using OpenRouter:

```json
{
  "smoothPaste.baseURL": "https://openrouter.ai/api/v1",
  "smoothPaste.apiKey": "your-openrouter-api-key",
  "smoothPaste.model": "openai/gpt-3.5-turbo"
}
```

Note: Available models may vary. Check OpenRouter's documentation for the latest list of supported models.

## Known Issues

- The extension may slow down on very large files
- Occasionally, the AI might produce unexpected merge results

## Release Notes

### 1.0.0

Initial release of SmoothPaste

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` file for more information.

---

For more information, please visit the [GitHub repository](https://github.com/jonigata/SmoothPaste).

**Enjoy using SmoothPaste!**