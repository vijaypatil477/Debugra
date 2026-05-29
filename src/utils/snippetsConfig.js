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

  // --- JAVA ---
  monaco.languages.registerCompletionItemProvider('java', {
    provideCompletionItems: (model, position) => ({
      suggestions: [
        {
          label: 'sysout',
          kind: snippetKind,
          insertText: 'System.out.println($1);',
          insertTextRules: insertSnippet,
          documentation: 'Print to standard output',
          range: getRange(model, position),
        },
        {
          label: 'syserr',
          kind: snippetKind,
          insertText: 'System.err.println($1);',
          insertTextRules: insertSnippet,
          documentation: 'Print to standard error',
          range: getRange(model, position),
        },
        {
          label: 'printf',
          kind: snippetKind,
          insertText: 'System.out.printf("$1\\n", $2);',
          insertTextRules: insertSnippet,
          documentation: 'Print formatted string',
          range: getRange(model, position),
        },
        {
          label: 'main',
          kind: snippetKind,
          insertText: 'public static void main(String[] args) {\n\t$1\n}',
          insertTextRules: insertSnippet,
          documentation: 'Main method',
          range: getRange(model, position),
        },
        {
          label: 'fori',
          kind: snippetKind,
          insertText: 'for (int i = 0; i < $1; i++) {\n\t$2\n}',
          insertTextRules: insertSnippet,
          documentation: 'For loop',
          range: getRange(model, position),
        },
        {
          label: 'binary_search',
          kind: snippetKind,
          insertText: [
            'int binarySearch(int[] arr, int target) {',
            '\tint left = 0, right = arr.length - 1;',
            '\twhile (left <= right) {',
            '\t\tint mid = left + (right - left) / 2;',
            '\t\tif (arr[mid] == target) return mid;',
            '\t\tif (arr[mid] < target) left = mid + 1;',
            '\t\telse right = mid - 1;',
            '\t}',
            '\treturn -1;',
            '}'
          ].join('\n'),
          insertTextRules: insertSnippet,
          documentation: 'Binary Search Algorithm (Java)',
          range: getRange(model, position),
        },
        {
          label: 'dfs',
          kind: snippetKind,
          insertText: [
            'void dfs(int node, List<List<Integer>> adj, boolean[] visited) {',
            '\tvisited[node] = true;',
            '\tfor (int neighbor : adj.get(node)) {',
            '\t\tif (!visited[neighbor]) {',
            '\t\t\tdfs(neighbor, adj, visited);',
            '\t\t}',
            '\t}',
            '}'
          ].join('\n'),
          insertTextRules: insertSnippet,
          documentation: 'Depth-First Search (DFS) Graph Traversal (Java)',
          range: getRange(model, position),
        },
        {
          label: 'bfs',
          kind: snippetKind,
          insertText: [
            'void bfs(int start, List<List<Integer>> adj) {',
            '\tboolean[] visited = new boolean[adj.size()];',
            '\tQueue<Integer> q = new LinkedList<>();',
            '\tvisited[start] = true;',
            '\tq.add(start);',
            '\twhile (!q.isEmpty()) {',
            '\t\tint curr = q.poll();',
            '\t\tfor (int neighbor : adj.get(curr)) {',
            '\t\t\tif (!visited[neighbor]) {',
            '\t\t\t\tvisited[neighbor] = true;',
            '\t\t\t\tq.add(neighbor);',
            '\t\t\t}',
            '\t\t}',
            '\t}',
            '}'
          ].join('\n'),
          insertTextRules: insertSnippet,
          documentation: 'Breadth-First Search (BFS) Graph Traversal (Java)',
          range: getRange(model, position),
        },
        {
          label: 'quick_sort',
          kind: snippetKind,
          insertText: [
            'int partition(int[] arr, int low, int high) {',
            '\tint pivot = arr[high];',
            '\tint i = low - 1;',
            '\tfor (int j = low; j < high; j++) {',
            '\t\tif (arr[j] < pivot) {',
            '\t\t\ti++;',
            '\t\t\tint temp = arr[i];',
            '\t\t\tarr[i] = arr[j];',
            '\t\t\tarr[j] = temp;',
            '\t\t}',
            '\t}',
            '\tint temp = arr[i + 1];',
            '\tarr[i + 1] = arr[high];',
            '\tarr[high] = temp;',
            '\treturn i + 1;',
            '}',
            'void quickSort(int[] arr, int low, int high) {',
            '\tif (low < high) {',
            '\t\tint pi = partition(arr, low, high);',
            '\t\tquickSort(arr, low, pi - 1);',
            '\t\tquickSort(arr, pi + 1, high);',
            '\t}',
            '}'
          ].join('\n'),
          insertTextRules: insertSnippet,
          documentation: 'Quick Sort Algorithm (Java)',
          range: getRange(model, position),
        },
      ],
    }),
  });

  // --- C++ ---
  monaco.languages.registerCompletionItemProvider('cpp', {
    provideCompletionItems: (model, position) => ({
      suggestions: [
        {
          label: 'cout',
          kind: snippetKind,
          insertText: 'cout << $1 << endl;',
          insertTextRules: insertSnippet,
          documentation: 'Print to console',
          range: getRange(model, position),
        },
        {
          label: 'cin',
          kind: snippetKind,
          insertText: 'cin >> $1;',
          insertTextRules: insertSnippet,
          documentation: 'Read from console',
          range: getRange(model, position),
        },
        {
          label: 'fori',
          kind: snippetKind,
          insertText: 'for (int i = 0; i < $1; i++) {\n\t$2\n}',
          insertTextRules: insertSnippet,
          documentation: 'For loop',
          range: getRange(model, position),
        },
        {
          label: 'main',
          kind: snippetKind,
          insertText: 'int main() {\n\t$1\n\treturn 0;\n}',
          insertTextRules: insertSnippet,
          documentation: 'Main function',
          range: getRange(model, position),
        },
        {
          label: 'binary_search',
          kind: snippetKind,
          insertText: [
            'int binarySearch(const vector<int>& arr, int target) {',
            '\tint left = 0, right = arr.size() - 1;',
            '\twhile (left <= right) {',
            '\t\tint mid = left + (right - left) / 2;',
            '\t\tif (arr[mid] == target) return mid;',
            '\t\tif (arr[mid] < target) left = mid + 1;',
            '\t\telse right = mid - 1;',
            '\t}',
            '\treturn -1;',
            '}'
          ].join('\n'),
          insertTextRules: insertSnippet,
          documentation: 'Binary Search Algorithm (C++)',
          range: getRange(model, position),
        },
        {
          label: 'dfs',
          kind: snippetKind,
          insertText: [
            'void dfs(int node, const vector<vector<int>>& adj, vector<bool>& visited) {',
            '\tvisited[node] = true;',
            '\tfor (int neighbor : adj[node]) {',
            '\t\tif (!visited[neighbor]) {',
            '\t\t\tdfs(neighbor, adj, visited);',
            '\t\t}',
            '\t}',
            '}'
          ].join('\n'),
          insertTextRules: insertSnippet,
          documentation: 'Depth-First Search (DFS) Graph Traversal (C++)',
          range: getRange(model, position),
        },
        {
          label: 'bfs',
          kind: snippetKind,
          insertText: [
            'void bfs(int start, const vector<vector<int>>& adj) {',
            '\tvector<bool> visited(adj.size(), false);',
            '\tqueue<int> q;',
            '\tvisited[start] = true;',
            '\tq.push(start);',
            '\twhile (!q.empty()) {',
            '\t\tint curr = q.front();',
            '\t\tq.pop();',
            '\t\tfor (int neighbor : adj[curr]) {',
            '\t\t\tif (!visited[neighbor]) {',
            '\t\t\t\tvisited[neighbor] = true;',
            '\t\t\t\tq.push(neighbor);',
            '\t\t\t}',
            '\t\t}',
            '\t}',
            '}'
          ].join('\n'),
          insertTextRules: insertSnippet,
          documentation: 'Breadth-First Search (BFS) Graph Traversal (C++)',
          range: getRange(model, position),
        },
        {
          label: 'quick_sort',
          kind: snippetKind,
          insertText: [
            'int partition(vector<int>& arr, int low, int high) {',
            '\tint pivot = arr[high];',
            '\tint i = low - 1;',
            '\tfor (int j = low; j < high; j++) {',
            '\t\tif (arr[j] < pivot) {',
            '\t\t\ti++;',
            '\t\t\tswap(arr[i], arr[j]);',
            '\t\t}',
            '\t}',
            '\tswap(arr[i + 1], arr[high]);',
            '\treturn i + 1;',
            '}',
            'void quickSort(vector<int>& arr, int low, int high) {',
            '\tif (low < high) {',
            '\t\tint pi = partition(arr, low, high);',
            '\t\tquickSort(arr, low, pi - 1);',
            '\t\tquickSort(arr, pi + 1, high);',
            '\t}',
            '}'
          ].join('\n'),
          insertTextRules: insertSnippet,
          documentation: 'Quick Sort Algorithm (C++)',
          range: getRange(model, position),
        },
      ],
    }),
  });

  // --- C ---
  monaco.languages.registerCompletionItemProvider('c', {
    provideCompletionItems: (model, position) => ({
      suggestions: [
        {
          label: 'printf',
          kind: snippetKind,
          insertText: 'printf("$1\\n", $2);',
          insertTextRules: insertSnippet,
          documentation: 'Print to console',
          range: getRange(model, position),
        },
        {
          label: 'scanf',
          kind: snippetKind,
          insertText: 'scanf("%d", &$1);',
          insertTextRules: insertSnippet,
          documentation: 'Read from console',
          range: getRange(model, position),
        },
        {
          label: 'main',
          kind: snippetKind,
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
          insertText: 'console.log($1);',
          insertTextRules: insertSnippet,
          documentation: 'console.log',
          range: getRange(model, position),
        },
        {
          label: 'cerr',
          kind: snippetKind,
          insertText: 'console.error($1);',
          insertTextRules: insertSnippet,
          documentation: 'console.error',
          range: getRange(model, position),
        },
        {
          label: 'fn',
          kind: snippetKind,
          insertText: 'function $1($2) {\n\t$3\n}',
          insertTextRules: insertSnippet,
          documentation: 'Function',
          range: getRange(model, position),
        },
        {
          label: 'afn',
          kind: snippetKind,
          insertText: 'const $1 = ($2) => {\n\t$3\n};',
          insertTextRules: insertSnippet,
          documentation: 'Arrow Function',
          range: getRange(model, position),
        },
        {
          label: 'fori',
          kind: snippetKind,
          insertText: 'for (let i = 0; i < $1; i++) {\n\t$2\n}',
          insertTextRules: insertSnippet,
          documentation: 'For loop',
          range: getRange(model, position),
        },
        {
          label: 'binary_search',
          kind: snippetKind,
          insertText: [
            'function binarySearch(arr, target) {',
            '\tlet left = 0, right = arr.length - 1;',
            '\twhile (left <= right) {',
            '\t\tconst mid = left + Math.floor((right - left) / 2);',
            '\t\tif (arr[mid] === target) return mid;',
            '\t\tif (arr[mid] < target) left = mid + 1;',
            '\t\telse right = mid - 1;',
            '\t}',
            '\treturn -1;',
            '}'
          ].join('\n'),
          insertTextRules: insertSnippet,
          documentation: 'Binary Search Algorithm (JavaScript)',
          range: getRange(model, position),
        },
        {
          label: 'dfs',
          kind: snippetKind,
          insertText: [
            'function dfs(node, adj, visited) {',
            '\tvisited[node] = true;',
            '\tfor (const neighbor of adj[node]) {',
            '\t\tif (!visited[neighbor]) {',
            '\t\t\tdfs(neighbor, adj, visited);',
            '\t\t}',
            '\t}',
            '}'
          ].join('\n'),
          insertTextRules: insertSnippet,
          documentation: 'Depth-First Search (DFS) Graph Traversal (JavaScript)',
          range: getRange(model, position),
        },
        {
          label: 'bfs',
          kind: snippetKind,
          insertText: [
            'function bfs(start, adj) {',
            '\tconst visited = new Array(adj.length).fill(false);',
            '\tconst queue = [start];',
            '\tvisited[start] = true;',
            '\twhile (queue.length > 0) {',
            '\t\tconst curr = queue.shift();',
            '\t\tfor (const neighbor of adj[curr]) {',
            '\t\t\tif (!visited[neighbor]) {',
            '\t\t\t\tvisited[neighbor] = true;',
            '\t\t\t\tqueue.push(neighbor);',
            '\t\t\t}',
            '\t\t}',
            '\t}',
            '}'
          ].join('\n'),
          insertTextRules: insertSnippet,
          documentation: 'Breadth-First Search (BFS) Graph Traversal (JavaScript)',
          range: getRange(model, position),
        },
        {
          label: 'quick_sort',
          kind: snippetKind,
          insertText: [
            'function quickSort(arr) {',
            '\tif (arr.length <= 1) return arr;',
            '\tconst pivot = arr[Math.floor(arr.length / 2)];',
            '\tconst left = arr.filter(x => x < pivot);',
            '\tconst middle = arr.filter(x => x === pivot);',
            '\tconst right = arr.filter(x => x > pivot);',
            '\treturn [...quickSort(left), ...middle, ...quickSort(right)];',
            '}'
          ].join('\n'),
          insertTextRules: insertSnippet,
          documentation: 'Quick Sort Algorithm (JavaScript)',
          range: getRange(model, position),
        },
      ],
    }),
  };
  monaco.languages.registerCompletionItemProvider('javascript', jsSnippets);
  monaco.languages.registerCompletionItemProvider('typescript', jsSnippets);

  // --- PYTHON ---
  monaco.languages.registerCompletionItemProvider('python', {
    provideCompletionItems: (model, position) => ({
      suggestions: [
        {
          label: 'pr',
          kind: snippetKind,
          insertText: 'print($1)',
          insertTextRules: insertSnippet,
          documentation: 'Print',
          range: getRange(model, position),
        },
        {
          label: 'def',
          kind: snippetKind,
          insertText: 'def $1($2):\n\t$3',
          insertTextRules: insertSnippet,
          documentation: 'Function definition',
          range: getRange(model, position),
        },
        {
          label: 'fori',
          kind: snippetKind,
          insertText: 'for i in range($1):\n\t$2',
          insertTextRules: insertSnippet,
          documentation: 'For loop',
          range: getRange(model, position),
        },
        {
          label: 'main',
          kind: snippetKind,
          insertText: 'if __name__ == "__main__":\n\t$1',
          insertTextRules: insertSnippet,
          documentation: 'Main block',
          range: getRange(model, position),
        },
        {
          label: 'binary_search',
          kind: snippetKind,
          insertText: [
            'def binary_search(arr, target):',
            '\tleft, right = 0, len(arr) - 1',
            '\twhile left <= right:',
            '\t\tmid = left + (right - left) // 2',
            '\t\tif arr[mid] == target:',
            '\t\t\treturn mid',
            '\t\telif arr[mid] < target:',
            '\t\t\tleft = mid + 1',
            '\t\telse:',
            '\t\t\tright = mid - 1',
            '\treturn -1'
          ].join('\n'),
          insertTextRules: insertSnippet,
          documentation: 'Binary Search Algorithm (Python)',
          range: getRange(model, position),
        },
        {
          label: 'dfs',
          kind: snippetKind,
          insertText: [
            'def dfs(node, adj, visited):',
            '\tvisited[node] = True',
            '\tfor neighbor in adj[node]:',
            '\t\tif not visited[neighbor]:',
            '\t\t\tdfs(neighbor, adj, visited)'
          ].join('\n'),
          insertTextRules: insertSnippet,
          documentation: 'Depth-First Search (DFS) Graph Traversal (Python)',
          range: getRange(model, position),
        },
        {
          label: 'bfs',
          kind: snippetKind,
          insertText: [
            'from collections import deque',
            'def bfs(start, adj):',
            '\tvisited = [False] * len(adj)',
            '\tq = deque([start])',
            '\tvisited[start] = True',
            '\twhile q:',
            '\t\tcurr = q.popleft()',
            '\t\tfor neighbor in adj[curr]:',
            '\t\t\tif not visited[neighbor]:',
            '\t\t\t\tvisited[neighbor] = True',
            '\t\t\t\tq.append(neighbor)'
          ].join('\n'),
          insertTextRules: insertSnippet,
          documentation: 'Breadth-First Search (BFS) Graph Traversal (Python)',
          range: getRange(model, position),
        },
        {
          label: 'quick_sort',
          kind: snippetKind,
          insertText: [
            'def quick_sort(arr):',
            '\tif len(arr) <= 1:',
            '\t\treturn arr',
            '\tpivot = arr[len(arr) // 2]',
            '\tleft = [x for x in arr if x < pivot]',
            '\tmiddle = [x for x in arr if x == pivot]',
            '\tright = [x for x in arr if x > pivot]',
            '\treturn quick_sort(left) + middle + quick_sort(right)'
          ].join('\n'),
          insertTextRules: insertSnippet,
          documentation: 'Quick Sort Algorithm (Python)',
          range: getRange(model, position),
        },
      ],
    }),
  });

  // --- C# ---
  monaco.languages.registerCompletionItemProvider('csharp', {
    provideCompletionItems: (model, position) => ({
      suggestions: [
        {
          label: 'cw',
          kind: snippetKind,
          insertText: 'Console.WriteLine($1);',
          insertTextRules: insertSnippet,
          documentation: 'Console.WriteLine',
          range: getRange(model, position),
        },
        {
          label: 'cr',
          kind: snippetKind,
          insertText: 'Console.ReadLine();',
          insertTextRules: insertSnippet,
          documentation: 'Console.ReadLine',
          range: getRange(model, position),
        },
        {
          label: 'main',
          kind: snippetKind,
          insertText: 'static void Main() {\n\t$1\n}',
          insertTextRules: insertSnippet,
          documentation: 'Main method',
          range: getRange(model, position),
        },
      ],
    }),
  });

  // --- GO ---
  monaco.languages.registerCompletionItemProvider('go', {
    provideCompletionItems: (model, position) => ({
      suggestions: [
        {
          label: 'fp',
          kind: snippetKind,
          insertText: 'fmt.Println($1)',
          insertTextRules: insertSnippet,
          documentation: 'fmt.Println',
          range: getRange(model, position),
        },
        {
          label: 'ff',
          kind: snippetKind,
          insertText: 'fmt.Printf("$1\\n", $2)',
          insertTextRules: insertSnippet,
          documentation: 'fmt.Printf',
          range: getRange(model, position),
        },
        {
          label: 'fn',
          kind: snippetKind,
          insertText: 'func $1($2) {\n\t$3\n}',
          insertTextRules: insertSnippet,
          documentation: 'Function',
          range: getRange(model, position),
        },
        {
          label: 'main',
          kind: snippetKind,
          insertText: 'func main() {\n\t$1\n}',
          insertTextRules: insertSnippet,
          documentation: 'Main func',
          range: getRange(model, position),
        },
      ],
    }),
  });

  // --- RUST ---
  monaco.languages.registerCompletionItemProvider('rust', {
    provideCompletionItems: (model, position) => ({
      suggestions: [
        {
          label: 'pl',
          kind: snippetKind,
          insertText: 'println!("$1");',
          insertTextRules: insertSnippet,
          documentation: 'println!',
          range: getRange(model, position),
        },
        {
          label: 'fn',
          kind: snippetKind,
          insertText: 'fn $1($2) {\n\t$3\n}',
          insertTextRules: insertSnippet,
          documentation: 'Function',
          range: getRange(model, position),
        },
        {
          label: 'main',
          kind: snippetKind,
          insertText: 'fn main() {\n\t$1\n}',
          insertTextRules: insertSnippet,
          documentation: 'Main function',
          range: getRange(model, position),
        },
      ],
    }),
  });

  // --- PHP ---
  monaco.languages.registerCompletionItemProvider('php', {
    provideCompletionItems: (model, position) => ({
      suggestions: [
        {
          label: 'ec',
          kind: snippetKind,
          insertText: 'echo $1;',
          insertTextRules: insertSnippet,
          documentation: 'echo',
          range: getRange(model, position),
        },
        {
          label: 'pr',
          kind: snippetKind,
          insertText: 'print_r($1);',
          insertTextRules: insertSnippet,
          documentation: 'print_r',
          range: getRange(model, position),
        },
        {
          label: 'fn',
          kind: snippetKind,
          insertText: 'function $1($2) {\n\t$3\n}',
          insertTextRules: insertSnippet,
          documentation: 'Function',
          range: getRange(model, position),
        },
      ],
    }),
  });

  // --- RUBY ---
  monaco.languages.registerCompletionItemProvider('ruby', {
    provideCompletionItems: (model, position) => ({
      suggestions: [
        {
          label: 'pu',
          kind: snippetKind,
          insertText: 'puts $1',
          insertTextRules: insertSnippet,
          documentation: 'puts',
          range: getRange(model, position),
        },
        {
          label: 'def',
          kind: snippetKind,
          insertText: 'def $1\n\t$2\nend',
          insertTextRules: insertSnippet,
          documentation: 'Function',
          range: getRange(model, position),
        },
      ],
    }),
  });

  // --- SWIFT ---
  monaco.languages.registerCompletionItemProvider('swift', {
    provideCompletionItems: (model, position) => ({
      suggestions: [
        {
          label: 'pr',
          kind: snippetKind,
          insertText: 'print($1)',
          insertTextRules: insertSnippet,
          documentation: 'print',
          range: getRange(model, position),
        },
        {
          label: 'fn',
          kind: snippetKind,
          insertText: 'func $1($2) {\n\t$3\n}',
          insertTextRules: insertSnippet,
          documentation: 'Function',
          range: getRange(model, position),
        },
      ],
    }),
  });
};
