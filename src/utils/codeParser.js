import { parse } from '@babel/parser';

/**
 * Parses the code and returns a list of outline nodes.
 * @param {string} code - The editor code contents
 * @param {string} language - The current editor language (e.g. 'javascript', 'python')
 * @returns {Array} List of outline tree nodes
 */
export function parseCodeToOutline(code, language) {
  if (!code) return [];

  const isJsOrTs = language === 'javascript' || language === 'typescript';

  if (isJsOrTs) {
    try {
      const ast = parse(code, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx', 'decorators-legacy'],
        errorRecovery: true,
      });

      const items = [];
      const walk = (node, parentList) => {
        if (!node) return;

        let currentList = parentList;
        let item = null;

        // 1. Class
        if (node.type === 'ClassDeclaration' || node.type === 'ClassExpression') {
          const name = node.id ? node.id.name : 'Anonymous Class';
          item = {
            id: `class-${name}-${node.loc.start.line}`,
            name: `class ${name}`,
            type: 'class',
            line: node.loc.start.line,
            children: [],
          };
        }
        // 2. Interface
        else if (node.type === 'TSInterfaceDeclaration') {
          const name = node.id.name;
          item = {
            id: `interface-${name}-${node.loc.start.line}`,
            name: `interface ${name}`,
            type: 'interface',
            line: node.loc.start.line,
            children: [],
          };
        }
        // 3. Type alias
        else if (node.type === 'TSTypeAliasDeclaration') {
          const name = node.id.name;
          item = {
            id: `type-${name}-${node.loc.start.line}`,
            name: `type ${name}`,
            type: 'type',
            line: node.loc.start.line,
            children: [],
          };
        }
        // 4. Function Declaration
        else if (node.type === 'FunctionDeclaration') {
          const name = node.id ? node.id.name : 'anonymous';
          item = {
            id: `function-${name}-${node.loc.start.line}`,
            name: `${name}()`,
            type: 'function',
            line: node.loc.start.line,
            children: [],
          };
        }
        // 5. Class Method / Method Definition / Object Method
        else if (node.type === 'ClassMethod' || node.type === 'MethodDefinition' || node.type === 'ObjectMethod') {
          const name = node.key.name || (node.key.value ? String(node.key.value) : 'anonymous');
          item = {
            id: `method-${name}-${node.loc.start.line}`,
            name: `${name}()`,
            type: 'method',
            line: node.loc.start.line,
            children: [],
          };
        }
        // 6. Arrow functions / Function expressions assigned to variables
        else if (node.type === 'VariableDeclarator') {
          if (node.init && (node.init.type === 'ArrowFunctionExpression' || node.init.type === 'FunctionExpression')) {
            const name = node.id.name;
            item = {
              id: `function-${name}-${node.loc.start.line}`,
              name: `${name}()`,
              type: 'function',
              line: node.loc.start.line,
              children: [],
            };
          }
        }
        // 7. Arrow function class properties (e.g. login = () => {})
        else if (node.type === 'ClassProperty' || node.type === 'PropertyDefinition' || node.type === 'ClassPrivateProperty') {
          if (node.value && (node.value.type === 'ArrowFunctionExpression' || node.value.type === 'FunctionExpression')) {
            const name = node.key.name || (node.key.value ? String(node.key.value) : 'anonymous');
            item = {
              id: `method-${name}-${node.loc.start.line}`,
              name: `${name}()`,
              type: 'method',
              line: node.loc.start.line,
              children: [],
            };
          }
        }

        if (item) {
          parentList.push(item);
          currentList = item.children;
        }

        // Recursively traverse children keys
        for (const key in node) {
          if (Object.prototype.hasOwnProperty.call(node, key)) {
            const child = node[key];
            if (Array.isArray(child)) {
              for (const subChild of child) {
                if (subChild && typeof subChild === 'object' && subChild.type) {
                  walk(subChild, currentList);
                }
              }
            } else if (child && typeof child === 'object' && child.type) {
              walk(child, currentList);
            }
          }
        }
      };

      walk(ast.program, items);
      return items;
    } catch (e) {
      console.warn('AST parsing failed, falling back to regex parser:', e);
    }
  }

  return parseCodeWithRegex(code, language);
}

/**
 * Fallback regex-based parser that handles nesting.
 */
function parseCodeWithRegex(code, language) {
  const lines = code.split(/\r?\n/);
  const items = [];
  const stack = [];

  const getIndent = (line) => {
    const match = line.match(/^([ \t]*)/);
    return match ? match[1].length : 0;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('/*')) {
      continue;
    }

    let match = null;
    let type = null;
    let name = null;

    if (language === 'python') {
      if ((match = line.match(/^\s*class\s+([A-Za-z0-9_]+)/))) {
        type = 'class';
        name = match[1];
      } else if ((match = line.match(/^\s*def\s+([A-Za-z0-9_]+)/))) {
        const indent = getIndent(line);
        const hasClassParent = stack.some((s) => s.node.type === 'class' && s.indent < indent);
        type = hasClassParent ? 'method' : 'function';
        name = match[1];
      }
    } else if (language === 'javascript' || language === 'typescript') {
      if ((match = line.match(/^\s*class\s+([A-Za-z0-9_]+)/))) {
        type = 'class';
        name = match[1];
      } else if ((match = line.match(/^\s*interface\s+([A-Za-z0-9_]+)/))) {
        type = 'interface';
        name = match[1];
      } else if ((match = line.match(/^\s*type\s+([A-Za-z0-9_]+)\s*=/))) {
        type = 'type';
        name = match[1];
      } else if ((match = line.match(/^\s*(?:async\s+)?function\s+([A-Za-z0-9_]+)/))) {
        type = 'function';
        name = match[1];
      } else if ((match = line.match(/^\s*const\s+([A-Za-z0-9_]+)\s*=\s*(?:\([^)]*\)|[A-Za-z0-9_]+)\s*=>/))) {
        type = 'function';
        name = match[1];
      } else if ((match = line.match(/^\s*([A-Za-z0-9_]+)\s*\([^)]*\)\s*\{/))) {
        const word = match[1];
        if (!['if', 'for', 'while', 'switch', 'catch', 'function'].includes(word)) {
          const indent = getIndent(line);
          const hasClassParent = stack.some((s) => s.node.type === 'class' && s.indent < indent);
          type = hasClassParent ? 'method' : 'function';
          name = word;
        }
      }
    } else if (language === 'java' || language === 'csharp' || language === 'php') {
      if ((match = line.match(/\b(?:class|interface)\s+([A-Za-z0-9_]+)/))) {
        type = line.includes('interface') ? 'interface' : 'class';
        name = match[1];
      } else if ((match = line.match(/\b(?:public|protected|private|static|\s)+(?:void|[A-Za-z0-9_<>@[\]]+)\s+([A-Za-z0-9_]+)\s*\(/))) {
        const word = match[1];
        if (!['if', 'for', 'while', 'switch', 'catch', 'super', 'this', 'return'].includes(word)) {
          type = 'method';
          name = word;
        }
      } else if (language === 'php' && (match = line.match(/\bfunction\s+([A-Za-z0-9_]+)\s*\(/))) {
        type = 'function';
        name = match[1];
      }
    } else if (language === 'cpp' || language === 'c') {
      if ((match = line.match(/\b(?:class|struct)\s+([A-Za-z0-9_]+)/))) {
        type = 'class';
        name = match[1];
      } else if ((match = line.match(/^\s*(?:[A-Za-z0-9_:<>&*]+)\s+([A-Za-z0-9_]+)\s*\(/))) {

        const word = match[1];
        if (!['if', 'for', 'while', 'switch', 'catch', 'return', 'sizeof', 'alignof', 'decltype'].includes(word)) {
          const indent = getIndent(line);
          const hasClassParent = stack.some((s) => s.node.type === 'class' && s.indent < indent);
          type = hasClassParent ? 'method' : 'function';
          name = word;
        }
      }
    } else if (language === 'go') {
      if ((match = line.match(/^type\s+([A-Za-z0-9_]+)\s+(?:struct|interface)/))) {
        type = line.includes('interface') ? 'interface' : 'class';
        name = match[1];
      } else if ((match = line.match(/^func\s+(?:\([^)]+\)\s*)?([A-Za-z0-9_]+)\s*\(/))) {
        type = line.includes(') ') ? 'method' : 'function';
        name = match[1];
      }
    } else if (language === 'rust') {
      if ((match = line.match(/\b(?:struct|trait|enum)\s+([A-Za-z0-9_]+)/))) {
        type = line.includes('trait') ? 'interface' : 'class';
        name = match[1];
      } else if ((match = line.match(/\bfn\s+([A-Za-z0-9_]+)\s*\(/))) {
        const indent = getIndent(line);
        const hasClassParent = stack.some((s) => s.node.type === 'class' && s.indent < indent);
        type = hasClassParent ? 'method' : 'function';
        name = match[1];
      }
    } else if (language === 'swift') {
      if ((match = line.match(/\b(?:class|struct|protocol)\s+([A-Za-z0-9_]+)/))) {
        type = line.includes('protocol') ? 'interface' : 'class';
        name = match[1];
      } else if ((match = line.match(/\bfunc\s+([A-Za-z0-9_]+)\s*\(/))) {
        const indent = getIndent(line);
        const hasClassParent = stack.some((s) => s.node.type === 'class' && s.indent < indent);
        type = hasClassParent ? 'method' : 'function';
        name = match[1];
      }
    } else if (language === 'ruby') {
      if ((match = line.match(/^\s*class\s+([A-Za-z0-9_]+)/))) {
        type = 'class';
        name = match[1];
      } else if ((match = line.match(/^\s*def\s+([A-Za-z0-9_]+)/))) {
        const indent = getIndent(line);
        const hasClassParent = stack.some((s) => s.node.type === 'class' && s.indent < indent);
        type = hasClassParent ? 'method' : 'function';
        name = match[1];
      }
    }

    if (type && name) {
      const indent = getIndent(line);

      while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
        stack.pop();
      }

      const displayName = type === 'class' || type === 'interface' || type === 'type'
        ? `${type} ${name}`
        : `${name}()`;

      const item = {
        id: `${type}-${name}-${lineNumber}`,
        name: displayName,
        type,
        line: lineNumber,
        children: [],
      };

      if (stack.length > 0) {
        stack[stack.length - 1].node.children.push(item);
      } else {
        items.push(item);
      }

      if (type === 'class' || type === 'interface') {
        stack.push({ indent, node: item });
      }
    }
  }

  return items;
}
