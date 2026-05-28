const STORAGE_KEY = 'debugra_custom_snippets';

function loadCustomSnippets() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export const registerSnippets = (monaco) => {
  // Helper to get range for replacing the typed snippet keyword
  const getRange = (model, position) => {
    const word = model.getWordUntilPosition(position);
    return {
      startLineNumber: position.lineNumber,
      endLineNumber: position.lineNumber,
      startColumn: word.startColumn,
      endColumn: word.endColumn,
    };
  };

  // Monaco Enums: InsertAsSnippet = 4, Snippet kind = 27
  const insertSnippet = 4;
  const snippetKind = 27;

  // ─── Built-in snippets per language ───────────────────────────────────────

  const builtinSnippets = {
    java: [
      { label: 'sysout', insertText: 'System.out.println($1);', documentation: 'Print to standard output' },
      { label: 'syserr', insertText: 'System.err.println($1);', documentation: 'Print to standard error' },
      { label: 'printf', insertText: 'System.out.printf("$1\\n", $2);', documentation: 'Print formatted string' },
      { label: 'main',   insertText: 'public static void main(String[] args) {\n\t$1\n}', documentation: 'Main method' },
      { label: 'fori',   insertText: 'for (int i = 0; i < $1; i++) {\n\t$2\n}', documentation: 'For loop' },
    ],
    cpp: [
      { label: 'cout', insertText: 'cout << $1 << endl;', documentation: 'Print to console' },
      { label: 'cin',  insertText: 'cin >> $1;', documentation: 'Read from console' },
      { label: 'fori', insertText: 'for (int i = 0; i < $1; i++) {\n\t$2\n}', documentation: 'For loop' },
      { label: 'main', insertText: 'int main() {\n\t$1\n\treturn 0;\n}', documentation: 'Main function' },
    ],
    c: [
      { label: 'printf', insertText: 'printf("$1\\n", $2);', documentation: 'Print to console' },
      { label: 'scanf',  insertText: 'scanf("%d", &$1);', documentation: 'Read from console' },
      { label: 'main',   insertText: 'int main() {\n\t$1\n\treturn 0;\n}', documentation: 'Main function' },
    ],
    javascript: [
      { label: 'clg',  insertText: 'console.log($1);', documentation: 'console.log' },
      { label: 'cerr', insertText: 'console.error($1);', documentation: 'console.error' },
      { label: 'fn',   insertText: 'function $1($2) {\n\t$3\n}', documentation: 'Function' },
      { label: 'afn',  insertText: 'const $1 = ($2) => {\n\t$3\n};', documentation: 'Arrow Function' },
      { label: 'fori', insertText: 'for (let i = 0; i < $1; i++) {\n\t$2\n}', documentation: 'For loop' },
    ],
    typescript: [
      { label: 'clg',  insertText: 'console.log($1);', documentation: 'console.log' },
      { label: 'cerr', insertText: 'console.error($1);', documentation: 'console.error' },
      { label: 'fn',   insertText: 'function $1($2) {\n\t$3\n}', documentation: 'Function' },
      { label: 'afn',  insertText: 'const $1 = ($2) => {\n\t$3\n};', documentation: 'Arrow Function' },
      { label: 'fori', insertText: 'for (let i = 0; i < $1; i++) {\n\t$2\n}', documentation: 'For loop' },
    ],
    python: [
      { label: 'pr',   insertText: 'print($1)', documentation: 'Print' },
      { label: 'def',  insertText: 'def $1($2):\n\t$3', documentation: 'Function definition' },
      { label: 'fori', insertText: 'for i in range($1):\n\t$2', documentation: 'For loop' },
      { label: 'main', insertText: 'if __name__ == "__main__":\n\t$1', documentation: 'Main block' },
    ],
    csharp: [
      { label: 'cw',   insertText: 'Console.WriteLine($1);', documentation: 'Console.WriteLine' },
      { label: 'cr',   insertText: 'Console.ReadLine();', documentation: 'Console.ReadLine' },
      { label: 'main', insertText: 'static void Main() {\n\t$1\n}', documentation: 'Main method' },
    ],
    go: [
      { label: 'fp',   insertText: 'fmt.Println($1)', documentation: 'fmt.Println' },
      { label: 'ff',   insertText: 'fmt.Printf("$1\\n", $2)', documentation: 'fmt.Printf' },
      { label: 'fn',   insertText: 'func $1($2) {\n\t$3\n}', documentation: 'Function' },
      { label: 'main', insertText: 'func main() {\n\t$1\n}', documentation: 'Main func' },
    ],
    rust: [
      { label: 'pl',   insertText: 'println!("$1");', documentation: 'println!' },
      { label: 'fn',   insertText: 'fn $1($2) {\n\t$3\n}', documentation: 'Function' },
      { label: 'main', insertText: 'fn main() {\n\t$1\n}', documentation: 'Main function' },
    ],
    php: [
      { label: 'ec', insertText: 'echo $1;', documentation: 'echo' },
      { label: 'pr', insertText: 'print_r($1);', documentation: 'print_r' },
      { label: 'fn', insertText: 'function $1($2) {\n\t$3\n}', documentation: 'Function' },
    ],
    ruby: [
      { label: 'pu',  insertText: 'puts $1', documentation: 'puts' },
      { label: 'def', insertText: 'def $1\n\t$2\nend', documentation: 'Function' },
    ],
    swift: [
      { label: 'pr', insertText: 'print($1)', documentation: 'print' },
      { label: 'fn', insertText: 'func $1($2) {\n\t$3\n}', documentation: 'Function' },
    ],
  };

  // ─── Register per language ─────────────────────────────────────────────────

  Object.entries(builtinSnippets).forEach(([lang, items]) => {
    monaco.languages.registerCompletionItemProvider(lang, {
      provideCompletionItems: (model, position) => {
        const range = getRange(model, position);

        // Merge built-in snippets with custom snippets for this language
        const custom = loadCustomSnippets().filter((s) => s.language === lang);

        const builtinSuggestions = items.map((s) => ({
          label: s.label,
          kind: snippetKind,
          insertText: s.insertText,
          insertTextRules: insertSnippet,
          documentation: s.documentation,
          range,
        }));

        const customSuggestions = custom.map((s) => ({
          label: s.label,
          kind: snippetKind,
          insertText: s.insertText,
          insertTextRules: insertSnippet,
          documentation: `★ ${s.documentation} (custom)`,
          range,
          sortText: `0_${s.label}`, // Sort custom snippets to the top
        }));

        return { suggestions: [...customSuggestions, ...builtinSuggestions] };
      },
    });
  });
};

// ─── Re-register custom snippets after user adds/edits them ─────────────────
// Call this after the user saves a new custom snippet to refresh completions
export const refreshCustomSnippets = (monaco) => {
  // Monaco completion providers are additive and cannot be removed individually,
  // so custom snippets are loaded fresh from localStorage on every provideCompletionItems
  // call above — no extra work needed here. This export is kept for future use.
};
