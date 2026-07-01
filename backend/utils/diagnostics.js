const { spawnSync } = require('child_process');
const vm = require('vm');

/**
 * HTML syntax tag balance linter (HTMLHint simulation)
 */
function getHTMLDiagnostics(code) {
  const diagnostics = [];
  const lines = code.split('\n');
  const tagStack = [];
  
  const tagRegex = /<(\/)?([a-zA-Z0-9:-]+)([^>]*)>/g;
  
  lines.forEach((line, idx) => {
    let match;
    while ((match = tagRegex.exec(line)) !== null) {
      const isClosing = !!match[1];
      const tagName = match[2].toLowerCase();
      const tagAttrs = match[3];
      
      const selfClosingTags = ['img', 'br', 'hr', 'input', 'link', 'meta', 'base', 'col', 'embed', 'source', 'track', 'wbr'];
      const isSelfClosing = selfClosingTags.includes(tagName) || tagAttrs.trim().endsWith('/');
      
      if (isSelfClosing) continue;
      
      if (isClosing) {
        if (tagStack.length === 0) {
          diagnostics.push({
            type: 'syntax',
            title: 'HTMLHint Alert (Unexpected Closing Tag)',
            message: `Unexpected closing tag </${tagName}> without corresponding opening tag.`,
            lineNumber: idx + 1,
            column: match.index + 1,
            severity: 'critical',
            suggestedFix: ''
          });
        } else {
          const last = tagStack.pop();
          if (last.name !== tagName) {
            diagnostics.push({
              type: 'syntax',
              title: 'HTMLHint Alert (Tag Mismatch)',
              message: `Tag mismatch: expected </${last.name}> but found </${tagName}> instead.`,
              lineNumber: idx + 1,
              column: match.index + 1,
              severity: 'critical',
              suggestedFix: `Close tag </${last.name}>`
            });
          }
        }
      } else {
        tagStack.push({ name: tagName, line: idx + 1, col: match.index + 1 });
      }
    }
  });
  
  tagStack.forEach(unclosed => {
    diagnostics.push({
      type: 'syntax',
      title: 'HTMLHint Alert (Unclosed Tag)',
      message: `Opening tag <${unclosed.name}> is never closed.`,
      lineNumber: unclosed.line,
      column: unclosed.col,
      severity: 'critical',
      suggestedFix: `Add </${unclosed.name}> at end of document`
    });
  });
  
  return diagnostics;
}

/**
 * CSS style syntax block and semicolon linter (Stylelint simulation)
 */
function getCSSDiagnostics(code) {
  const diagnostics = [];
  const lines = code.split('\n');
  let braceDepth = 0;
  let braceStartLine = 1;
  
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.includes('{')) {
      braceDepth++;
      braceStartLine = idx + 1;
    }
    if (trimmed.includes('}')) {
      braceDepth--;
      if (braceDepth < 0) {
        diagnostics.push({
          type: 'syntax',
          title: 'Stylelint Alert (Unexpected Brace)',
          message: "Unexpected closing brace '}' without opening brace '{'.",
          lineNumber: idx + 1,
          column: line.indexOf('}') + 1,
          severity: 'critical',
          suggestedFix: ''
        });
        braceDepth = 0;
      }
    }
    
    if (braceDepth > 0 && trimmed !== '' && !trimmed.includes('{') && !trimmed.includes('}')) {
      if (!trimmed.includes(':') && !trimmed.startsWith('/*') && !trimmed.endsWith('*/')) {
        diagnostics.push({
          type: 'syntax',
          title: 'Stylelint Alert (Missing Colon)',
          message: "Expected a colon ':' separating property from value.",
          lineNumber: idx + 1,
          column: 1,
          severity: 'high',
          suggestedFix: `${trimmed.replace(/\s+/, ': ')}`
        });
      } else if (!trimmed.endsWith(';') && !trimmed.startsWith('/*') && !trimmed.endsWith('*/') && !trimmed.includes('@')) {
        diagnostics.push({
          type: 'syntax',
          title: 'Stylelint Alert (Missing Semicolon)',
          message: "Expected a semicolon ';' at the end of declaration.",
          lineNumber: idx + 1,
          column: line.length || 1,
          severity: 'medium',
          suggestedFix: `${trimmed};`
        });
      }
    }
  });
  
  if (braceDepth > 0) {
    diagnostics.push({
      type: 'syntax',
      title: 'Stylelint Alert (Unclosed Brace)',
      message: "Unclosed rule block. Missing matching closing brace '}'.",
      lineNumber: braceStartLine,
      column: 1,
      severity: 'critical',
      suggestedFix: 'Add }'
    });
  }
  
  return diagnostics;
}

/**
 * Run compiler checks on Python code using local python process and AST visitor
 */
function getPythonDiagnostics(code) {
  const pythonScript = `
import ast
import sys
import json

code = sys.stdin.read()
diagnostics = []

try:
    tree = ast.parse(code)
    class NameVisitor(ast.NodeVisitor):
        def __init__(self):
            self.defined = set(dir(__builtins__) + ['__name__', '__doc__', '__file__', 'self', 'cls'])
            self.undefined = []
            
        def visit_FunctionDef(self, node):
            self.defined.add(node.name)
            old_defined = self.defined.copy()
            for arg in node.args.args:
                self.defined.add(arg.arg)
            for arg in getattr(node.args, 'kwonlyargs', []):
                self.defined.add(arg.arg)
            if node.args.vararg:
                self.defined.add(node.args.vararg.arg)
            if node.args.kwarg:
                self.defined.add(node.args.kwarg.arg)
                
            self.generic_visit(node)
            self.defined = old_defined
            
        def visit_ClassDef(self, node):
            self.defined.add(node.name)
            self.generic_visit(node)
            
        def visit_Assign(self, node):
            for target in node.targets:
                if isinstance(target, ast.Name):
                    self.defined.add(target.id)
                elif isinstance(target, ast.Tuple) or isinstance(target, ast.List):
                    for el in target.elts:
                        if isinstance(el, ast.Name):
                            self.defined.add(el.id)
            self.generic_visit(node)
            
        def visit_Import(self, node):
            for alias in node.names:
                name = alias.asname or alias.name
                self.defined.add(name.split('.')[0])
            self.generic_visit(node)
            
        def visit_ImportFrom(self, node):
            for alias in node.names:
                name = alias.asname or alias.name
                self.defined.add(name)
            self.generic_visit(node)

        def visit_For(self, node):
            if isinstance(node.target, ast.Name):
                self.defined.add(node.target.id)
            elif isinstance(node.target, (ast.Tuple, ast.List)):
                for el in node.target.elts:
                    if isinstance(el, ast.Name):
                        self.defined.add(el.id)
            self.generic_visit(node)

        def visit_Name(self, node):
            if isinstance(node.ctx, ast.Load):
                if node.id not in self.defined:
                    self.undefined.append({
                        'type': 'reference',
                        'title': 'Pyright Reference Alert',
                        'message': f"Undefined variable or name '{node.id}' used.",
                        'lineNumber': node.lineno,
                        'column': node.col_offset + 1,
                        'severity': 'high',
                        'suggestedFix': f"# Make sure '{node.id}' is declared/imported before usage"
                    })

    visitor = NameVisitor()
    visitor.visit(tree)
    diagnostics.extend(visitor.undefined)
except SyntaxError as e:
    diagnostics.append({
        'type': 'syntax',
        'title': 'Pyright Syntax Alert',
        'message': e.msg,
        'lineNumber': e.lineno or 1,
        'column': e.offset or 1,
        'severity': 'critical',
        'suggestedFix': ""
    })
except Exception as e:
    pass

print(json.dumps(diagnostics))
`;

  try {
    const proc = spawnSync('python', ['-c', pythonScript], {
      input: code,
      encoding: 'utf8'
    });
    
    const stdout = (proc.stdout || '').trim();
    if (stdout.startsWith('[')) {
      return JSON.parse(stdout);
    }
  } catch (err) {
    console.error('Python diagnostics run failed', err);
  }
  return [];
}

/**
 * JS AST check for syntax errors and undefined references (ESLint emulation)
 */
function getJavaScriptDiagnostics(code) {
  const diagnostics = [];

  try {
    new vm.Script(code);
  } catch (err) {
    const lineMatch = err.stack ? err.stack.match(/evalmachine\.<anonymous>:(\d+)/) : null;
    const lineNum = lineMatch ? parseInt(lineMatch[1], 10) : 1;
    diagnostics.push({
      type: 'syntax',
      title: 'ESLint Syntax Alert',
      message: err.message,
      lineNumber: lineNum,
      column: 1,
      severity: 'critical',
      suggestedFix: ''
    });
    return diagnostics;
  }

  const lines = code.split('\n');
  
  lines.forEach((line, idx) => {
    const assignmentInCondition = line.match(/\b(if|while)\s*\(\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^=][^=]?)/);
    if (assignmentInCondition) {
      const varName = assignmentInCondition[2];
      diagnostics.push({
        type: 'logical',
        title: 'ESLint Logical Alert',
        message: `Assignment operator '=' used inside condition instead of comparison operator '===' for var '${varName}'.`,
        lineNumber: idx + 1,
        column: line.indexOf('=') + 1,
        severity: 'high',
        suggestedFix: `${varName} === ${assignmentInCondition[3].trim()}`
      });
    }
  });

  const allowedGlobals = new Set([
    'console', 'process', 'module', 'require', 'exports', 'window', 'document',
    'global', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
    'Math', 'JSON', 'Date', 'Error', 'RegExp', 'Array', 'Object', 'String',
    'Number', 'Boolean', 'Promise', 'Map', 'Set', 'Headers', 'fetch', 'alert',
    'arguments', 'this', 'String', 'NaN', 'Infinity', 'parseInt', 'parseFloat',
    '__dirname', '__filename'
  ]);

  const declaredVars = new Set();
  
  lines.forEach(line => {
    const decs = line.matchAll(/\b(const|let|var|function|class)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g);
    for (const match of decs) {
      declaredVars.add(match[2]);
    }
    const paramMatch = line.match(/function\s*\w*\s*\(([^)]*)\)/);
    if (paramMatch && paramMatch[1]) {
      paramMatch[1].split(',').forEach(p => {
        const clean = p.trim().split('=')[0].trim();
        if (clean && clean.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/)) {
          declaredVars.add(clean);
        }
      });
    }
    const arrowParamMatch = line.match(/\(([^)]*)\)\s*=>/);
    if (arrowParamMatch && arrowParamMatch[1]) {
      arrowParamMatch[1].split(',').forEach(p => {
        const clean = p.trim().split('=')[0].trim();
        if (clean && clean.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/)) {
          declaredVars.add(clean);
        }
      });
    }
  });

  lines.forEach((line, idx) => {
    const stripped = line
      .replace(/(['"`])(.*?)\1/g, '""')
      .replace(/\/\/.*$/g, '');

    const identifiers = stripped.matchAll(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g);
    for (const match of identifiers) {
      const id = match[1];
      const matchIdx = match.index;
      
      const isPropertyRead = stripped[matchIdx - 1] === '.';
      const nextCharIdx = matchIdx + id.length;
      let nextChar = '';
      if (nextCharIdx < stripped.length) {
        nextChar = stripped[nextCharIdx];
        while (nextChar === ' ' && nextCharIdx + 1 < stripped.length) {
          nextChar = stripped[nextCharIdx + 1];
        }
      }
      const isObjectKey = nextChar === ':';
      
      const isDeclKeyword = ['const', 'let', 'var', 'function', 'class', 'import', 'export', 'return', 'if', 'else', 'for', 'while', 'switch', 'case', 'new', 'typeof', 'instanceof', 'throw', 'catch', 'in', 'of', 'null', 'undefined', 'true', 'false'].includes(id);

      if (!isPropertyRead && !isObjectKey && !isDeclKeyword) {
        if (!declaredVars.has(id) && !allowedGlobals.has(id)) {
          diagnostics.push({
            type: 'reference',
            title: 'ESLint Reference Alert',
            message: `Variable "${id}" is not defined.`,
            lineNumber: idx + 1,
            column: matchIdx + 1,
            severity: 'high',
            suggestedFix: `Use a declared variable or define '${id}' before calling it.`
          });
        }
      }
    }
  });

  return diagnostics;
}

/**
 * High-level compiler / linter diagnostics check
 * @param {string} code 
 * @param {string} language 
 */
function compileCheck(code, language) {
  const lang = String(language).toLowerCase();
  
  if (lang === 'javascript' || lang === 'typescript') {
    return getJavaScriptDiagnostics(code);
  } else if (lang === 'python') {
    return getPythonDiagnostics(code);
  } else if (lang === 'html') {
    return getHTMLDiagnostics(code);
  } else if (lang === 'css') {
    return getCSSDiagnostics(code);
  }
  
  // Skip compiler diagnostics for Java, C, C++, Go (AI Review Only mode)
  return [];
}

module.exports = {
  compileCheck,
};
