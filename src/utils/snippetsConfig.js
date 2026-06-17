let registeredProviders = [];

export const registerSnippets = (monaco) => {
  // Clean up any existing providers to prevent duplicates (e.g. during HMR or multiple calls)
  if (registeredProviders.length > 0) {
    registeredProviders.forEach((provider) => provider.dispose());
    registeredProviders = [];
  }

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

  const register = (lang, provider) => {
    const disposable = monaco.languages.registerCompletionItemProvider(lang, provider);
    registeredProviders.push(disposable);
  };

  // --- JAVA ---
  register('java', {
    provideCompletionItems: (model, position) => ({
      suggestions: [
        {
          label: 'sysout',
          kind: snippetKind,
          detail: 'Console Snippet',
          insertText: 'System.out.println($1);',
          insertTextRules: insertSnippet,
          documentation: 'Print to standard output',
          range: getRange(model, position),
        },
        {
          label: 'syserr',
          kind: snippetKind,
          detail: 'Console Snippet',
          insertText: 'System.err.println($1);',
          insertTextRules: insertSnippet,
          documentation: 'Print to standard error',
          range: getRange(model, position),
        },
        {
          label: 'printf',
          kind: snippetKind,
          detail: 'Console Snippet',
          insertText: 'System.out.printf("$1\\n", $2);',
          insertTextRules: insertSnippet,
          documentation: 'Print formatted string',
          range: getRange(model, position),
        },
        {
          label: 'main',
          kind: snippetKind,
          detail: 'Structure Snippet',
          insertText: 'public static void main(String[] args) {\n\t$1\n}',
          insertTextRules: insertSnippet,
          documentation: 'Main method',
          range: getRange(model, position),
        },
        {
          label: 'fori',
          kind: snippetKind,
          detail: 'Loop Snippet',
          insertText: 'for (int i = 0; i < $1; i++) {\n\t$2\n}',
          insertTextRules: insertSnippet,
          documentation: 'For loop',
          range: getRange(model, position),
        },
        {
          label: 'binary_search',
          kind: snippetKind,
          detail: 'Algorithm Snippet',
          insertText: [
            'int ${1:binarySearch}(int[] ${2:arr}, int ${3:target}) {',
            '\tint ${4:left} = 0, ${5:right} = ${2:arr}.length - 1;',
            '\twhile (${4:left} <= ${5:right}) {',
            '\t\tint ${6:mid} = ${4:left} + (${5:right} - ${4:left}) / 2;',
            '\t\tif (${2:arr}[${6:mid}] == ${3:target}) return ${6:mid};',
            '\t\tif (${2:arr}[${6:mid}] < ${3:target}) ${4:left} = ${6:mid} + 1;',
            '\t\telse ${5:right} = ${6:mid} - 1;',
            '\t}',
            '\treturn -1;',
            '}',
          ].join('\n'),
          insertTextRules: insertSnippet,
          documentation: 'Binary Search Algorithm (Java)',
          range: getRange(model, position),
        },
        {
          label: 'dfs',
          kind: snippetKind,
          detail: 'Algorithm Snippet',
          insertText: [
            'void ${1:dfs}(int ${2:node}, List<List<Integer>> ${3:adj}, boolean[] ${4:visited}) {',
            '\t${4:visited}[${2:node}] = true;',
            '\tfor (int ${5:neighbor} : ${3:adj}.get(${2:node})) {',
            '\t\tif (!${4:visited}[${5:neighbor}]) {',
            '\t\t\t${1:dfs}(${5:neighbor}, ${3:adj}, ${4:visited});',
            '\t\t}',
            '\t}',
            '}',
          ].join('\n'),
          insertTextRules: insertSnippet,
          documentation: 'Depth-First Search (DFS) Graph Traversal (Java)',
          range: getRange(model, position),
        },
        {
          label: 'bfs',
          kind: snippetKind,
          detail: 'Algorithm Snippet',
          insertText: [
            'void ${1:bfs}(int ${2:start}, List<List<Integer>> ${3:adj}) {',
            '\tboolean[] ${4:visited} = new boolean[${3:adj}.size()];',
            '\tQueue<Integer> ${5:q} = new LinkedList<>();',
            '\t${4:visited}[${2:start}] = true;',
            '\t${5:q}.add(${2:start});',
            '\twhile (!${5:q}.isEmpty()) {',
            '\t\tint ${6:curr} = ${5:q}.poll();',
            '\t\tfor (int ${7:neighbor} : ${3:adj}.get(${6:curr})) {',
            '\t\t\tif (!${4:visited}[${7:neighbor}]) {',
            '\t\t\t\t${4:visited}[${7:neighbor}] = true;',
            '\t\t\t\t${5:q}.add(${7:neighbor});',
            '\t\t\t}',
            '\t\t}',
            '\t}',
            '}',
          ].join('\n'),
          insertTextRules: insertSnippet,
          documentation: 'Breadth-First Search (BFS) Graph Traversal (Java)',
          range: getRange(model, position),
        },
        {
          label: 'quick_sort',
          kind: snippetKind,
          detail: 'Algorithm Snippet',
          insertText: [
            'int ${1:partition}(int[] ${2:arr}, int ${3:low}, int ${4:high}) {',
            '\tint ${5:pivot} = ${2:arr}[${4:high}];',
            '\tint ${6:i} = ${3:low} - 1;',
            '\tfor (int ${7:j} = ${3:low}; ${7:j} < ${4:high}; ${7:j}++) {',
            '\t\tif (${2:arr}[${7:j}] < ${5:pivot}) {',
            '\t\t\t${6:i}++;',
            '\t\t\tint temp = ${2:arr}[${6:i}];',
            '\t\t\t${2:arr}[${6:i}] = ${2:arr}[${7:j}];',
            '\t\t\t${2:arr}[${7:j}] = temp;',
            '\t\t}',
            '\t}',
            '\tint temp = ${2:arr}[${6:i} + 1];',
            '\t${2:arr}[${6:i} + 1] = ${2:arr}[${4:high}];',
            '\t${2:arr}[${4:high}] = temp;',
            '\treturn ${6:i} + 1;',
            '}',
            '',
            'void ${8:quickSort}(int[] ${2:arr}, int ${3:low}, int ${4:high}) {',
            '\tif (${3:low} < ${4:high}) {',
            '\t\tint ${9:pi} = ${1:partition}(${2:arr}, ${3:low}, ${4:high});',
            '\t\t${8:quickSort}(${2:arr}, ${3:low}, ${9:pi} - 1);',
            '\t\t${8:quickSort}(${2:arr}, ${9:pi} + 1, ${4:high});',
            '\t}',
            '}',
          ].join('\n'),
          insertTextRules: insertSnippet,
          documentation: 'Quick Sort Algorithm (Java)',
          range: getRange(model, position),
        },
      ],
    }),
  });

  // --- C++ ---
  register('cpp', {
    provideCompletionItems: (model, position) => ({
      suggestions: [
        {
          label: 'cout',
          kind: snippetKind,
          detail: 'Console Snippet',
          insertText: 'cout << $1 << endl;',
          insertTextRules: insertSnippet,
          documentation: 'Print to console',
          range: getRange(model, position),
        },
        {
          label: 'cin',
          kind: snippetKind,
          detail: 'Console Snippet',
          insertText: 'cin >> $1;',
          insertTextRules: insertSnippet,
          documentation: 'Read from console',
          range: getRange(model, position),
        },
        {
          label: 'fori',
          kind: snippetKind,
          detail: 'Loop Snippet',
          insertText: 'for (int i = 0; i < $1; i++) {\n\t$2\n}',
          insertTextRules: insertSnippet,
          documentation: 'For loop',
          range: getRange(model, position),
        },
        {
          label: 'main',
          kind: snippetKind,
          detail: 'Structure Snippet',
          insertText: 'int main() {\n\t$1\n\treturn 0;\n}',
          insertTextRules: insertSnippet,
          documentation: 'Main function',
          range: getRange(model, position),
        },
        {
          label: 'binary_search',
          kind: snippetKind,
          detail: 'Algorithm Snippet',
          insertText: [
            'int ${1:binarySearch}(const vector<int>& ${2:arr}, int ${3:target}) {',
            '\tint ${4:left} = 0, ${5:right} = ${2:arr}.size() - 1;',
            '\twhile (${4:left} <= ${5:right}) {',
            '\t\tint ${6:mid} = ${4:left} + (${5:right} - ${4:left}) / 2;',
            '\t\tif (${2:arr}[${6:mid}] == ${3:target}) return ${6:mid};',
            '\t\tif (${2:arr}[${6:mid}] < ${3:target}) ${4:left} = ${6:mid} + 1;',
            '\t\telse ${5:right} = ${6:mid} - 1;',
            '\t}',
            '\treturn -1;',
            '}',
          ].join('\n'),
          insertTextRules: insertSnippet,
          documentation: 'Binary Search Algorithm (C++)',
          range: getRange(model, position),
        },
        {
          label: 'dfs',
          kind: snippetKind,
          detail: 'Algorithm Snippet',
          insertText: [
            'void ${1:dfs}(int ${2:node}, const vector<vector<int>>& ${3:adj}, vector<bool>& ${4:visited}) {',
            '\t${4:visited}[${2:node}] = true;',
            '\tfor (int ${5:neighbor} : ${3:adj}[${2:node}]) {',
            '\t\tif (!${4:visited}[${5:neighbor}]) {',
            '\t\t\t${1:dfs}(${5:neighbor}, ${3:adj}, ${4:visited});',
            '\t\t}',
            '\t}',
            '}',
          ].join('\n'),
          insertTextRules: insertSnippet,
          documentation: 'Depth-First Search (DFS) Graph Traversal (C++)',
          range: getRange(model, position),
        },
        {
          label: 'bfs',
          kind: snippetKind,
          detail: 'Algorithm Snippet',
          insertText: [
            'void ${1:bfs}(int ${2:start}, const vector<vector<int>>& ${3:adj}) {',
            '\tvector<bool> ${4:visited}(${3:adj}.size(), false);',
            '\tqueue<int> ${5:q};',
            '\t${4:visited}[${2:start}] = true;',
            '\t${5:q}.push(${2:start});',
            '\twhile (!${5:q}.empty()) {',
            '\t\tint ${6:curr} = ${5:q}.front();',
            '\t\t${5:q}.pop();',
            '\t\tfor (int ${7:neighbor} : ${3:adj}[${6:curr}]) {',
            '\t\t\tif (!${4:visited}[${7:neighbor}]) {',
            '\t\t\t\t${4:visited}[${7:neighbor}] = true;',
            '\t\t\t\t${5:q}.push(${7:neighbor});',
            '\t\t\t}',
            '\t\t}',
            '\t}',
            '}',
          ].join('\n'),
          insertTextRules: insertSnippet,
          documentation: 'Breadth-First Search (BFS) Graph Traversal (C++)',
          range: getRange(model, position),
        },
        {
          label: 'quick_sort',
          kind: snippetKind,
          detail: 'Algorithm Snippet',
          insertText: [
            'int ${1:partition}(vector<int>& ${2:arr}, int ${3:low}, int ${4:high}) {',
            '\tint ${5:pivot} = ${2:arr}[${4:high}];',
            '\tint ${6:i} = ${3:low} - 1;',
            '\tfor (int ${7:j} = ${3:low}; ${7:j} < ${4:high}; ${7:j}++) {',
            '\t\tif (${2:arr}[${7:j}] < ${5:pivot}) {',
            '\t\t\t${6:i}++;',
            '\t\t\tswap(${2:arr}[${6:i}], ${2:arr}[${7:j}]);',
            '\t\t}',
            '\t}',
            '\tswap(${2:arr}[${6:i} + 1], ${2:arr}[${4:high}]);',
            '\treturn ${6:i} + 1;',
            '}',
            '',
            'void ${8:quickSort}(vector<int>& ${2:arr}, int ${3:low}, int ${4:high}) {',
            '\tif (${3:low} < ${4:high}) {',
            '\t\tint ${9:pi} = ${1:partition}(${2:arr}, ${3:low}, ${4:high});',
            '\t\t${8:quickSort}(${2:arr}, ${3:low}, ${9:pi} - 1);',
            '\t\t${8:quickSort}(${2:arr}, ${9:pi} + 1, ${4:high});',
            '\t}',
            '}',
          ].join('\n'),
          insertTextRules: insertSnippet,
          documentation: 'Quick Sort Algorithm (C++)',
          range: getRange(model, position),
        },
      ],
    }),
  });

  // --- C ---
  register('c', {
    provideCompletionItems: (model, position) => ({
      suggestions: [
        {
          label: 'printf',
          kind: snippetKind,
          detail: 'Console Snippet',
          insertText: 'printf("$1\\n", $2);',
          insertTextRules: insertSnippet,
          documentation: 'Print to console',
          range: getRange(model, position),
        },
        {
          label: 'scanf',
          kind: snippetKind,
          detail: 'Console Snippet',
          insertText: 'scanf("%d", &$1);',
          insertTextRules: insertSnippet,
          documentation: 'Read from console',
          range: getRange(model, position),
        },
        {
          label: 'main',
          kind: snippetKind,
          detail: 'Structure Snippet',
          insertText: 'int main() {\n\t$1\n\treturn 0;\n}',
          insertTextRules: insertSnippet,
          documentation: 'Main function',
          range: getRange(model, position),
        },
      ],
    }),
  });

  // --- JAVASCRIPT & TYPESCRIPT ---
  const jsSnippets = {
    provideCompletionItems: (model, position) => ({
      suggestions: [
        {
          label: 'clg',
          kind: snippetKind,
          detail: 'Console Snippet',
          insertText: 'console.log($1);',
          insertTextRules: insertSnippet,
          documentation: 'console.log',
          range: getRange(model, position),
        },
        {
          label: 'cerr',
          kind: snippetKind,
          detail: 'Console Snippet',
          insertText: 'console.error($1);',
          insertTextRules: insertSnippet,
          documentation: 'console.error',
          range: getRange(model, position),
        },
        {
          label: 'fn',
          kind: snippetKind,
          detail: 'Structure Snippet',
          insertText: 'function $1($2) {\n\t$3\n}',
          insertTextRules: insertSnippet,
          documentation: 'Function',
          range: getRange(model, position),
        },
        {
          label: 'afn',
          kind: snippetKind,
          detail: 'Structure Snippet',
          insertText: 'const $1 = ($2) => {\n\t$3\n};',
          insertTextRules: insertSnippet,
          documentation: 'Arrow Function',
          range: getRange(model, position),
        },
        {
          label: 'fori',
          kind: snippetKind,
          detail: 'Loop Snippet',
          insertText: 'for (let i = 0; i < $1; i++) {\n\t$2\n}',
          insertTextRules: insertSnippet,
          documentation: 'For loop',
          range: getRange(model, position),
        },
        {
          label: 'binary_search',
          kind: snippetKind,
          detail: 'Algorithm Snippet',
          insertText: [
            'function ${1:binarySearch}(${2:arr}, ${3:target}) {',
            '\tlet ${4:left} = 0, ${5:right} = ${2:arr}.length - 1;',
            '\twhile (${4:left} <= ${5:right}) {',
            '\t\tconst ${6:mid} = ${4:left} + Math.floor((${5:right} - ${4:left}) / 2);',
            '\t\tif (${2:arr}[${6:mid}] === ${3:target}) return ${6:mid};',
            '\t\tif (${2:arr}[${6:mid}] < ${3:target}) ${4:left} = ${6:mid} + 1;',
            '\t\telse ${5:right} = ${6:mid} - 1;',
            '\t}',
            '\treturn -1;',
            '}',
          ].join('\n'),
          insertTextRules: insertSnippet,
          documentation: 'Binary Search Algorithm (JavaScript)',
          range: getRange(model, position),
        },
        {
          label: 'dfs',
          kind: snippetKind,
          detail: 'Algorithm Snippet',
          insertText: [
            'function ${1:dfs}(${2:node}, ${3:adj}, ${4:visited}) {',
            '\t${4:visited}[${2:node}] = true;',
            '\tfor (const ${5:neighbor} of ${3:adj}[${2:node}]) {',
            '\t\tif (!${4:visited}[${5:neighbor}]) {',
            '\t\t\t${1:dfs}(${5:neighbor}, ${3:adj}, ${4:visited});',
            '\t\t}',
            '\t}',
            '}',
          ].join('\n'),
          insertTextRules: insertSnippet,
          documentation: 'Depth-First Search (DFS) Graph Traversal (JavaScript)',
          range: getRange(model, position),
        },
        {
          label: 'bfs',
          kind: snippetKind,
          detail: 'Algorithm Snippet',
          insertText: [
            'function ${1:bfs}(${2:start}, ${3:adj}) {',
            '\tconst ${4:visited} = new Array(${3:adj}.length).fill(false);',
            '\tconst ${5:queue} = [${2:start}];',
            '\t${4:visited}[${2:start}] = true;',
            '\twhile (${5:queue}.length > 0) {',
            '\t\tconst ${6:curr} = ${5:queue}.shift();',
            '\t\tfor (const ${7:neighbor} of ${3:adj}[${6:curr}]) {',
            '\t\t\tif (!${4:visited}[${7:neighbor}]) {',
            '\t\t\t\t${4:visited}[${7:neighbor}] = true;',
            '\t\t\t\t${5:queue}.push(${7:neighbor});',
            '\t\t\t}',
            '\t\t}',
            '\t}',
            '}',
          ].join('\n'),
          insertTextRules: insertSnippet,
          documentation: 'Breadth-First Search (BFS) Graph Traversal (JavaScript)',
          range: getRange(model, position),
        },
        {
          label: 'quick_sort',
          kind: snippetKind,
          detail: 'Algorithm Snippet',
          insertText: [
            'function quickSort(arr) {',
            '\tif (arr.length <= 1) return arr;',
            '\tconst pivot = arr[Math.floor(arr.length / 2)];',
            '\tconst left = arr.filter(x => x < pivot);',
            '\tconst middle = arr.filter(x => x === pivot);',
            '\tconst right = arr.filter(x => x > pivot);',
            '\treturn [...quickSort(left), ...middle, ...right];',
            '}',
          ].join('\n'),
          insertTextRules: insertSnippet,
          documentation: 'Quick Sort Algorithm (JavaScript)',
          range: getRange(model, position),
        },
      ],
    }),
  };
  register('javascript', jsSnippets);
  register('typescript', jsSnippets);

  // --- PYTHON ---
  register('python', {
    provideCompletionItems: (model, position) => ({
      suggestions: [
        {
          label: 'pr',
          kind: snippetKind,
          detail: 'Console Snippet',
          insertText: 'print($1)',
          insertTextRules: insertSnippet,
          documentation: 'Print',
          range: getRange(model, position),
        },
        {
          label: 'def',
          kind: snippetKind,
          detail: 'Structure Snippet',
          insertText: 'def $1($2):\n\t$3',
          insertTextRules: insertSnippet,
          documentation: 'Function definition',
          range: getRange(model, position),
        },
        {
          label: 'fori',
          kind: snippetKind,
          detail: 'Loop Snippet',
          insertText: 'for i in range($1):\n\t$2',
          insertTextRules: insertSnippet,
          documentation: 'For loop',
          range: getRange(model, position),
        },
        {
          label: 'main',
          kind: snippetKind,
          detail: 'Structure Snippet',
          insertText: 'if __name__ == "__main__":\n\t$1',
          insertTextRules: insertSnippet,
          documentation: 'Main block',
          range: getRange(model, position),
        },
        {
          label: 'binary_search',
          kind: snippetKind,
          detail: 'Algorithm Snippet',
          insertText: [
            'def ${1:binary_search}(${2:arr}, ${3:target}):',
            '\t${4:left}, ${5:right} = 0, len(${2:arr}) - 1',
            '\twhile ${4:left} <= ${5:right}:',
            '\t\t${6:mid} = ${4:left} + (${5:right} - ${4:left}) // 2',
            '\t\tif ${2:arr}[${6:mid}] == ${3:target}:',
            '\t\t\treturn ${6:mid}',
            '\t\telif ${2:arr}[${6:mid}] < ${3:target}:',
            '\t\t\t${4:left} = ${6:mid} + 1',
            '\t\telse:',
            '\t\t\tright = mid - 1',
            '\treturn -1',
          ].join('\n'),
          insertTextRules: insertSnippet,
          documentation: 'Binary Search Algorithm (Python)',
          range: getRange(model, position),
        },
        {
          label: 'dfs',
          kind: snippetKind,
          detail: 'Algorithm Snippet',
          insertText: [
            'def dfs(node, adj, visited):',
            '\tvisited[node] = True',
            '\tfor neighbor in adj[node]:',
            '\t\tif not visited[neighbor]:',
            '\t\t\tdfs(neighbor, adj, visited)',
          ].join('\n'),
          insertTextRules: insertSnippet,
          documentation: 'Depth-First Search (DFS) Graph Traversal (Python)',
          range: getRange(model, position),
        },
        {
          label: 'bfs',
          kind: snippetKind,
          detail: 'Algorithm Snippet',
          insertText: [
            'from collections import deque',
            '',
            'def bfs(start, adj):',
            '\tvisited = [False] * len(adj)',
            '\tq = deque([start])',
            '\tvisited[start] = True',
            '\twhile q:',
            '\t\tcurr = q.popleft()',
            '\t\tfor neighbor in adj[curr]:',
            '\t\t\tif not visited[neighbor]:',
            '\t\t\t\tvisited[neighbor] = True',
            '\t\t\t\tq.append(neighbor)',
          ].join('\n'),
          insertTextRules: insertSnippet,
          documentation: 'Breadth-First Search (BFS) Graph Traversal (Python)',
          range: getRange(model, position),
        },
        {
          label: 'quick_sort',
          kind: snippetKind,
          detail: 'Algorithm Snippet',
          insertText: [
            'def quick_sort(arr):',
            '\tif len(arr) <= 1:',
            '\t\treturn arr',
            '\tpivot = arr[len(arr) // 2]',
            '\tleft = [x for x in arr if x < pivot]',
            '\tmiddle = [x for x in arr if x == pivot]',
            '\tright = [x for x in arr if x > pivot]',
            '\treturn quick_sort(left) + middle + right',
          ].join('\n'),
          insertTextRules: insertSnippet,
          documentation: 'Quick Sort Algorithm (Python)',
          range: getRange(model, position),
        },
      ],
    }),
  });

  // --- C# ---
  register('csharp', {
    provideCompletionItems: (model, position) => ({
      suggestions: [
        {
          label: 'cw',
          kind: snippetKind,
          detail: 'Console Snippet',
          insertText: 'Console.WriteLine($1);',
          insertTextRules: insertSnippet,
          documentation: 'Console.WriteLine',
          range: getRange(model, position),
        },
        {
          label: 'cr',
          kind: snippetKind,
          detail: 'Console Snippet',
          insertText: 'Console.ReadLine();',
          insertTextRules: insertSnippet,
          documentation: 'Console.ReadLine',
          range: getRange(model, position),
        },
        {
          label: 'main',
          kind: snippetKind,
          detail: 'Structure Snippet',
          insertText: 'static void Main() {\n\t$1\n}',
          insertTextRules: insertSnippet,
          documentation: 'Main method',
          range: getRange(model, position),
        },
      ],
    }),
  });

  // --- GO ---
  register('go', {
    provideCompletionItems: (model, position) => ({
      suggestions: [
        {
          label: 'fp',
          kind: snippetKind,
          detail: 'Console Snippet',
          insertText: 'fmt.Println($1)',
          insertTextRules: insertSnippet,
          documentation: 'fmt.Println',
          range: getRange(model, position),
        },
        {
          label: 'ff',
          kind: snippetKind,
          detail: 'Console Snippet',
          insertText: 'fmt.Printf("$1\\n", $2)',
          insertTextRules: insertSnippet,
          documentation: 'fmt.Printf',
          range: getRange(model, position),
        },
        {
          label: 'fn',
          kind: snippetKind,
          detail: 'Structure Snippet',
          insertText: 'func $1($2) {\n\t$3\n}',
          insertTextRules: insertSnippet,
          documentation: 'Function',
          range: getRange(model, position),
        },
        {
          label: 'main',
          kind: snippetKind,
          detail: 'Structure Snippet',
          insertText: 'func main() {\n\t$1\n}',
          insertTextRules: insertSnippet,
          documentation: 'Main func',
          range: getRange(model, position),
        },
      ],
    }),
  });

  // --- RUST ---
  register('rust', {
    provideCompletionItems: (model, position) => ({
      suggestions: [
        {
          label: 'pl',
          kind: snippetKind,
          detail: 'Console Snippet',
          insertText: 'println!("$1");',
          insertTextRules: insertSnippet,
          documentation: 'println!',
          range: getRange(model, position),
        },
        {
          label: 'fn',
          kind: snippetKind,
          detail: 'Structure Snippet',
          insertText: 'fn $1($2) {\n\t$3\n}',
          insertTextRules: insertSnippet,
          documentation: 'Function',
          range: getRange(model, position),
        },
        {
          label: 'main',
          kind: snippetKind,
          detail: 'Structure Snippet',
          insertText: 'fn main() {\n\t$1\n}',
          insertTextRules: insertSnippet,
          documentation: 'Main function',
          range: getRange(model, position),
        },
      ],
    }),
  });

  // --- PHP ---
  register('php', {
    provideCompletionItems: (model, position) => ({
      suggestions: [
        {
          label: 'ec',
          kind: snippetKind,
          detail: 'Console Snippet',
          insertText: 'echo $1;',
          insertTextRules: insertSnippet,
          documentation: 'echo',
          range: getRange(model, position),
        },
        {
          label: 'pr',
          kind: snippetKind,
          detail: 'Console Snippet',
          insertText: 'print_r($1);',
          insertTextRules: insertSnippet,
          documentation: 'print_r',
          range: getRange(model, position),
        },
        {
          label: 'fn',
          kind: snippetKind,
          detail: 'Structure Snippet',
          insertText: 'function $1($2) {\n\t$3\n}',
          insertTextRules: insertSnippet,
          documentation: 'Function',
          range: getRange(model, position),
        },
      ],
    }),
  });

  // --- RUBY ---
  register('ruby', {
    provideCompletionItems: (model, position) => ({
      suggestions: [
        {
          label: 'pu',
          kind: snippetKind,
          detail: 'Console Snippet',
          insertText: 'puts $1',
          insertTextRules: insertSnippet,
          documentation: 'puts',
          range: getRange(model, position),
        },
        {
          label: 'def',
          kind: snippetKind,
          detail: 'Structure Snippet',
          insertText: 'def $1\n\t$2\nend',
          insertTextRules: insertSnippet,
          documentation: 'Function',
          range: getRange(model, position),
        },
      ],
    }),
  });

  // --- SWIFT ---
  register('swift', {
    provideCompletionItems: (model, position) => ({
      suggestions: [
        {
          label: 'pr',
          kind: snippetKind,
          detail: 'Console Snippet',
          insertText: 'print($1)',
          insertTextRules: insertSnippet,
          documentation: 'print',
          range: getRange(model, position),
        },
        {
          label: 'fn',
          kind: snippetKind,
          detail: 'Structure Snippet',
          insertText: 'func $1($2) {\n\t$3\n}',
          insertTextRules: insertSnippet,
          documentation: 'Function',
          range: getRange(model, position),
        },
      ],
    }),
  });
};
