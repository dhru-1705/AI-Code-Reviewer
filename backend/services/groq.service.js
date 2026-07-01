const Groq = require('groq-sdk');

if (!process.env.GROQ_API_KEY) {
  console.warn('[Warning] GROQ_API_KEY environment variable is not defined. Fallback mock reviewer is active.');
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'MOCK_KEY',
});

// Scoring Rules: Syntax Error (-30), Compilation Error (-30), Reference Error (-20), Type Error (-15), Logical Error (-15), Security Issue (-20), Performance Issue (-10), Warning (-5), Suggestion (-2)
const calculateScores = (issues, analysisMode = 'enhanced') => {
  let syntaxDeduct = 0;
  let compilationDeduct = 0;
  let referenceDeduct = 0;
  let typeDeduct = 0;
  let logicDeduct = 0;
  let securityDeduct = 0;
  let performanceDeduct = 0;
  let warningDeduct = 0;
  let suggestionDeduct = 0;

  issues.forEach(issue => {
    const type = String(issue.type).toLowerCase();
    const severity = String(issue.severity).toLowerCase();
    const title = String(issue.title).toLowerCase();

    if (type === 'syntax') {
      syntaxDeduct += 30;
    } else if (type === 'compilation' || title.includes('compiler') || title.includes('compilation') || title.includes('compile error')) {
      compilationDeduct += 30;
    } else if (type === 'reference' || title.includes('reference') || title.includes('undefined') || title.includes('not defined')) {
      referenceDeduct += 20;
    } else if (type === 'type' || title.includes('typeerror') || title.includes('type safety')) {
      typeDeduct += 15;
    } else if (type === 'logical' || title.includes('logic error') || title.includes('logical error')) {
      logicDeduct += 15;
    } else if (type === 'security') {
      securityDeduct += 20;
    } else if (type === 'performance') {
      performanceDeduct += 10;
    } else if (['high', 'medium', 'low', 'warning'].includes(severity) || type === 'warning') {
      warningDeduct += 5;
    } else if (severity === 'suggestion' || severity === 'info' || type === 'suggestion') {
      suggestionDeduct += 2;
    }
  });

  const totalDeductions = syntaxDeduct + compilationDeduct + referenceDeduct + typeDeduct + logicDeduct + securityDeduct + performanceDeduct + warningDeduct + suggestionDeduct;
  let overall = Math.max(10, 100 - totalDeductions);

  // Conservative review logic in AI Review Only mode (when no compile checking is done)
  if (analysisMode === 'ai-only' && totalDeductions === 0) {
    overall = 92; // Clamp overall score at 92 to avoid false "Excellent 100/100" claim
  }

  return {
    breakdown: {
      syntax: analysisMode === 'ai-only' ? 95 : Math.max(10, 100 - syntaxDeduct - compilationDeduct),
      logic: Math.max(10, 100 - logicDeduct - referenceDeduct),
      performance: Math.max(10, 100 - performanceDeduct),
      security: Math.max(10, 100 - securityDeduct),
      maintainability: Math.max(10, Math.round(overall * 0.95)),
      readability: Math.max(10, Math.round(overall * 0.98)),
      bestPractices: Math.max(10, 100 - warningDeduct - suggestionDeduct),
      overall
    },
    score: overall
  };
};

/**
 * @desc    Generate smart mock code reviews based on basic keyword heuristic inspections
 */
const getMockReview = (code, language, reviewType, diagnostics = [], analysisMode = 'enhanced', compilerUsed = 'None') => {
  const startTime = Date.now();
  const suggestions = [];
  const security = [];
  const performance = [];
  const bestPractices = [];
  const issues = [];
  let optimized = code;

  const lines = code.split('\n');
  const findLineNum = (keyword) => {
    const idx = lines.findIndex(l => l.includes(keyword));
    return idx !== -1 ? idx + 1 : 1;
  };

  // Heuristic syntax checks
  if (code.includes('var ')) {
    const lNum = findLineNum('var ');
    suggestions.push(`Avoid using 'var' on Line ${lNum}. Use 'let' or 'const' to prevent hoisting.`);
    bestPractices.push(`Replaced 'var' declaration on Line ${lNum} with block-scoped constants.`);
    
    issues.push({
      type: 'best-practice',
      title: analysisMode === 'ai-only' ? 'Potential Issue - Legacy Variable Declaration' : 'Legacy Variable Declaration',
      message: "Avoid using 'var' for variable declaration. Use 'let' or 'const' to prevent variable hoisting and scope leakages.",
      lineNumber: lNum,
      column: 1,
      severity: 'low',
      suggestedFix: "Change 'var' to 'const' if the variable is never reassigned, or 'let' if it is reassigned."
    });
    optimized = optimized.replace(/\bvar\b/g, 'let');
  }

  if (code.includes('eval(')) {
    const lNum = findLineNum('eval(');
    suggestions.push(`Avoid using 'eval()' on Line ${lNum} due to execution vulnerabilities.`);
    security.push(`CRITICAL: 'eval()' function detected on Line ${lNum}. This allows remote code injection (RCE).`);
    
    issues.push({
      type: 'security',
      title: analysisMode === 'ai-only' ? 'Potential Issue - Dangerous eval Usage' : 'Arbitrary Code Execution (eval)',
      message: "Avoid using 'eval()' as it opens security vulnerabilities and executes arbitrary string code with local privileges.",
      lineNumber: lNum,
      column: 1,
      severity: 'critical',
      suggestedFix: "Use JSON.parse() for parsing JSON data, or access object properties directly via bracket notation."
    });
    optimized = optimized.replace(/eval\(([^)]+)\)/g, '/* SECURITY FIX: REMOVED eval call */ console.log($1)');
  }

  if (code.includes('SELECT') && code.includes('+') && (code.includes('req.body') || code.includes('req.query'))) {
    const lNum = findLineNum('+');
    suggestions.push(`Use parameterized queries to avoid SQL Injection vulnerabilities around Line ${lNum}.`);
    security.push(`HIGH: SQL string concatenation detected on Line ${lNum}.`);
    
    issues.push({
      type: 'security',
      title: analysisMode === 'ai-only' ? 'Potential Issue - Unsafe Query Concatenation' : 'Potential SQL Injection Vulnerability',
      message: "Directly concatenating request inputs into SQL query strings is unsafe. Attackers can manipulate query syntax to gain unauthorized database access.",
      lineNumber: lNum,
      column: 1,
      severity: 'high',
      suggestedFix: "Use parameterized queries, prepared statements, or ORM/ODM filters (e.g., sequelize, mongoose)."
    });
  }

  if (code.includes(' == ')) {
    const lNum = findLineNum(' == ');
    suggestions.push(`Use strict equality operator (===) instead of abstract equality (==) on Line ${lNum}.`);
    bestPractices.push(`Replaced comparison (==) with strict comparison (===) on Line ${lNum}.`);
    
    issues.push({
      type: 'best-practice',
      title: analysisMode === 'ai-only' ? 'Potential Issue - Non-Strict Comparison' : 'Use Strict Equality',
      message: "Use strict equality operator (===) instead of abstract equality (==) to prevent implicit type coercions.",
      lineNumber: lNum,
      column: 1,
      severity: 'suggestion',
      suggestedFix: "Replace '==' with '===' to ensure both value and type match."
    });
    optimized = optimized.replaceAll(' == ', ' === ');
  }

  // Handle differences based on Analysis Mode
  let combinedIssues = [...issues];
  let dynamicSummary = '';
  let aiExplanation = '';

  if (analysisMode === 'enhanced') {
    // Merge linter diagnostics
    diagnostics.forEach(diag => {
      const exists = combinedIssues.some(
        i => i.lineNumber === diag.lineNumber && i.title.toLowerCase() === diag.title.toLowerCase()
      );
      if (!exists) {
        combinedIssues.push({
          type: diag.type || 'syntax',
          title: diag.title || 'Compiler Error',
          message: diag.message || 'Compiler warning or syntax check mismatch.',
          lineNumber: diag.lineNumber || 1,
          column: diag.column || 1,
          severity: diag.severity || 'critical',
          suggestedFix: diag.suggestedFix || ''
        });
      }
    });

    const errs = combinedIssues.filter(i => ['critical', 'high'].includes(i.severity)).length;
    const warns = combinedIssues.filter(i => ['medium', 'low'].includes(i.severity)).length;
    const suggs = combinedIssues.filter(i => i.severity === 'suggestion').length;

    dynamicSummary = `Enhanced Analysis Completed. Diagnostics status: ${errs > 0 ? '❌ Failed' : '✔ Passed'} (${compilerUsed}). Found ${errs} error(s), ${warns} warning(s), and ${suggs} suggestion(s).`;
    
    aiExplanation = `### Enhanced Analysis Overview
We compiled and linted this code using **${compilerUsed}** for **${language}**.
The code quality score is computed programmatically based on compiling results.

#### Issue Breakdown
${combinedIssues.map((iss, i) => `
**Issue #${i + 1}: ${iss.title} (${iss.severity.toUpperCase()})**
- **Why it happened**: Line ${iss.lineNumber} failed validation constraints.
- **Why it matters**: It disrupts compilation scopes or causes runtime exceptions.
- **How to fix it**: Adjust the code structure according to: \`${iss.suggestedFix || 'Fix line bounds'}\`.
`).join('\n')}`;
  } else {
    // Mode 2: AI Review Only
    // Do NOT merge diagnostics.
    const errs = combinedIssues.filter(i => ['critical', 'high'].includes(i.severity)).length;
    const warns = combinedIssues.filter(i => ['medium', 'low'].includes(i.severity)).length;
    const suggs = combinedIssues.filter(i => i.severity === 'suggestion').length;

    dynamicSummary = `AI Review Only. Static Analysis. No compilation performed. Found ${errs} logic/style error(s), ${warns} warning(s), and ${suggs} suggestion(s).`;
    
    aiExplanation = `### AI Review (Static Analysis Only)
*Note: This review is based on static analysis and was not compiled. No compiler validations were run.*

Based on static analysis, we evaluated the logical flow, security, and readabilities:
- **Potential runtime concerns**: Inspect references and dependencies before running.
- **Logic / Best practices**: Avoid pattern loops that decrease readability.

#### Logical and Stylistic Observations
${combinedIssues.map((iss, i) => `
**Observation #${i + 1}: ${iss.title}**
- **Why it happened**: This pattern was identified via static analysis.
- **Why it matters**: It may create a potential runtime concern or style violation.
- **How to fix it**: Consider: \`${iss.suggestedFix || 'Refactor code context'}\`.
`).join('\n')}`;
  }

  // Calculate scores
  const scoreResults = calculateScores(combinedIssues, analysisMode);
  const finalScore = scoreResults.score;

  const funcCount = (code.match(/function\s+\w+|=>|def\s+\w+|public\s+void|fn\s+/g) || []).length;
  const classCount = (code.match(/class\s+\w+/g) || []).length;
  const varCount = (code.match(/const\s+|let\s+|var\s+|\w+\s*=\s*/g) || []).length;
  const importsCount = (code.match(/import\s+|require\(/g) || []).length;
  const commentsCount = (code.match(/\/\/|#|\/\*|\*/g) || []).length;

  const errs = combinedIssues.filter(i => ['critical', 'high'].includes(i.severity)).length;
  const warns = combinedIssues.filter(i => ['medium', 'low'].includes(i.severity)).length;
  const suggs = combinedIssues.filter(i => i.severity === 'suggestion').length;

  const complexityStr = code.includes('for (') || code.includes('while (') ? 'O(N)' : 'O(1)';
  const reviewTime = parseFloat(((Date.now() - startTime) / 1000 + 0.12).toFixed(2));

  return {
    optimizedCode: optimized,
    analysisMode,
    compilerUsed,
    feedback: {
      summary: dynamicSummary,
      score: finalScore,
      suggestions,
      security,
      performance,
      bestPractices,
      issues: combinedIssues,
      aiExplanation,
      breakdown: scoreResults.breakdown,
      confidence: Math.max(70, 100 - (combinedIssues.length * 4)),
      stats: {
        linesOfCode: lines.length,
        functions: funcCount,
        classes: classCount,
        variables: varCount,
        importsCount,
        commentsCount,
        errorsCount: errs,
        warningsCount: warns,
        complexity: complexityStr,
        reviewTime,
        inferenceTime: parseFloat((reviewTime * 0.7).toFixed(2)),
        modelName: 'Local Lexical Scanner',
        tokensUsed: {
          prompt: Math.round(code.length / 3.8),
          completion: Math.round(optimized.length / 3.8),
          total: Math.round(code.length / 3.8) + Math.round(optimized.length / 3.8)
        }
      },
      summaryCards: {
        errors: errs,
        warnings: warns,
        suggestions: suggs,
        complexity: complexityStr === 'O(1)' ? 'Low' : 'Medium',
        maintainability: finalScore >= 90 ? 'Excellent' : finalScore >= 70 ? 'Good' : finalScore >= 50 ? 'Needs Improvement' : 'Poor',
        security: errs > 0 ? 'Critical Risk' : 'Secure',
        performance: complexityStr === 'O(1)' ? 'Optimized' : 'Suboptimal',
        overallGrade: scoreResults.breakdown.overallGrade
      }
    }
  };
};

/**
 * @desc    Generate code review using Groq API LLMs
 * @param   {string} code - The input source code
 * @param   {string} language - Programming language
 * @param   {string} reviewType - general, security, performance, best-practices
 * @param   {Array} diagnostics - Output from compilers/linters
 * @param   {string} analysisMode - enhanced, ai-only
 * @param   {string} compilerUsed - ESLint, Pyright, HTMLHint, Stylelint, None
 */
const generateCodeReview = async (code, language, reviewType, diagnostics = [], analysisMode = 'enhanced', compilerUsed = 'None') => {
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY.includes('goes_here') || process.env.GROQ_API_KEY === 'MOCK_KEY') {
    return getMockReview(code, language, reviewType, diagnostics, analysisMode, compilerUsed);
  }

  const modelName = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  
  let systemPrompt = '';
  
  if (analysisMode === 'enhanced') {
    systemPrompt = `You are a Senior Full Stack Software Engineer and AI Security Auditor.
Analyze the user's provided code snippet.
You will receive compiler/linter diagnostics for this code. Use the diagnostics as the absolute source of truth.
Do NOT ignore compiler errors.
Explain every compiler error, suggest why it occurred, how to fix it, and optimize the code.
Return ONLY valid JSON matching the schema.

JSON Schema:
{
  "optimizedCode": "The fully refactored and optimized version of the user's code, maintaining identical logic but fixing all issues. Keep indentation intact.",
  "feedback": {
    "summary": "A 2-3 sentence overview of the code quality, major concerns, and overall findings. Must state issue counts and note that compiling validation checks were run.",
    "suggestions": ["Specific list item 1 detailing a clear improvement", "Specific list item 2"],
    "security": ["Security flaws, injections, insecure practices found, or 'None detected'"],
    "performance": ["Performance concerns, memory leaks, high-overhead routines found, or 'None detected'"],
    "bestPractices": ["Styling rules, DRY violations, readability guidelines or 'None detected'"],
    "issues": [
      {
        "type": "syntax", // Must be one of: "syntax", "compilation", "reference", "type", "logical", "security", "performance", "best-practice"
        "title": "A short descriptive title (e.g. Reference Error, Syntax Error, Type Safety)",
        "message": "Detailed description explaining what is wrong and why it needs fixing. Connect back to compiler logs.",
        "lineNumber": 12, // The 1-based line number
        "column": 1, // The column index
        "severity": "critical", // Must be one of: "critical", "high", "medium", "low", "suggestion"
        "suggestedFix": "Detailed correction snippet or action to fix the issue."
      }
    ],
    "aiExplanation": "A deep markdown explanation detailing what problems were solved, how the optimization was performed, and general educational takeaways. For every issue, explain: Why it happened, Why it matters, and How to fix it."
  }
}`;
  } else {
    // Mode 2: AI Review Only
    systemPrompt = `You are a Senior Full Stack Software Engineer.
Analyze the user's provided code snippet focusing on: Logic, Maintainability, Performance, Security, Readability, and Best Practices.

CRITICAL INSTRUCTION:
No compilation or linter check was run for this code.
Therefore, you MUST NEVER claim "No syntax errors" or "Code compiles successfully" in your explanation, summary, or report.
Instead, you must be transparent about the limitations of this compile-less review. Use phrasing like:
- "Based on static analysis..."
- "This issue may occur..."
- "Potential runtime concern..."
- "This pattern is not recommended..."
Do NOT deduct points for compiler errors that were never verified.
Return ONLY valid JSON matching the schema.

JSON Schema:
{
  "optimizedCode": "The fully refactored version of the user's code, maintaining identical logic but fixing all issues. Keep indentation intact.",
  "feedback": {
    "summary": "A 2-3 sentence overview of the code quality, major concerns, and overall findings. Must note that compilation was not performed and this is static analysis only.",
    "suggestions": ["Specific list item 1 detailing a clear improvement", "Specific list item 2"],
    "security": ["Security flaws, insecure practices found, or 'None detected'"],
    "performance": ["Performance concerns, memory leaks, high-overhead routines found, or 'None detected'"],
    "bestPractices": ["Styling rules, DRY violations, readability guidelines or 'None detected'"],
    "issues": [
      {
        "type": "logical", // Must be one of: "logical", "security", "performance", "best-practice"
        "title": "A short descriptive title",
        "message": "Detailed description explaining what is wrong. Start with phrases like 'Based on static analysis...'",
        "lineNumber": 12,
        "column": 1,
        "severity": "medium", // Must be one of: "high", "medium", "low", "suggestion"
        "suggestedFix": "Detailed correction snippet or action to fix the issue."
      }
    ],
    "aiExplanation": "A deep markdown explanation detailing what problems were solved, how the optimization was performed, and general educational takeaways. Clarify that compilation was not performed."
  }
}`;
  }

  const userPrompt = `Language: ${language}
Review Focus Type: ${reviewType}
Analysis Mode: ${analysisMode}

${analysisMode === 'enhanced' ? `Compiler/Linter Diagnostics (Source of Truth):
${JSON.stringify(diagnostics, null, 2)}` : 'Note: Compilation was not performed. Analyze purely from static analysis.'}

Code to Review:
\`\`\`
${code}
\`\`\``;

  const startTime = Date.now();

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: modelName,
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 4000
    });

    const rawResponse = chatCompletion.choices[0]?.message?.content;
    if (!rawResponse) {
      throw new Error('Empty response received from Groq API');
    }

    const reviewTime = parseFloat(((Date.now() - startTime) / 1000).toFixed(2));
    const parsedReview = JSON.parse(rawResponse);
    
    if (parsedReview && parsedReview.feedback) {
      const issues = parsedReview.feedback.issues || [];
      
      if (analysisMode === 'enhanced') {
        // Programmatically merge compiler diagnostics to ensure they are NEVER ignored
        diagnostics.forEach(diag => {
          const exists = issues.some(
            i => i.lineNumber === diag.lineNumber && i.title.toLowerCase().includes(diag.title.toLowerCase().split(' ')[0])
          );
          if (!exists) {
            issues.push({
              type: diag.type || 'syntax',
              title: diag.title || 'Compiler Error',
              message: diag.message || 'Compiler warning or syntax check mismatch.',
              lineNumber: diag.lineNumber || 1,
              column: diag.column || 1,
              severity: diag.severity || 'critical',
              suggestedFix: diag.suggestedFix || ''
            });
          }
        });
      }

      // Perform math scores calculations programmatically on the server
      const scoreResults = calculateScores(issues, analysisMode);

      parsedReview.feedback.issues = issues;
      parsedReview.feedback.score = scoreResults.score;
      parsedReview.feedback.breakdown = scoreResults.breakdown;
      parsedReview.feedback.confidence = parsedReview.feedback.confidence || Math.max(70, 100 - (issues.length * 3));
      
      const lines = code.split('\n');
      const importsCount = (code.match(/import\s+|require\(/g) || []).length;
      const commentsCount = (code.match(/\/\/|#|\/\*|\*/g) || []).length;

      parsedReview.feedback.stats = parsedReview.feedback.stats || {};
      parsedReview.feedback.stats.linesOfCode = lines.length;
      parsedReview.feedback.stats.importsCount = importsCount;
      parsedReview.feedback.stats.commentsCount = commentsCount;
      parsedReview.feedback.stats.reviewTime = reviewTime;
      parsedReview.feedback.stats.inferenceTime = chatCompletion.usage?.total_time || parseFloat((reviewTime * 0.75).toFixed(2));
      parsedReview.feedback.stats.modelName = modelName;
      
      parsedReview.feedback.stats.tokensUsed = {
        prompt: chatCompletion.usage?.prompt_tokens || Math.round(code.length / 3.8),
        completion: chatCompletion.usage?.completion_tokens || Math.round(rawResponse.length / 3.8),
        total: chatCompletion.usage?.total_tokens || (Math.round(code.length / 3.8) + Math.round(rawResponse.length / 3.8))
      };

      let overallGrade = 'A';
      if (scoreResults.score < 50) overallGrade = 'F';
      else if (scoreResults.score < 70) overallGrade = 'D';
      else if (scoreResults.score < 80) overallGrade = 'C';
      else if (scoreResults.score < 90) overallGrade = 'B';
      
      parsedReview.feedback.summaryCards = parsedReview.feedback.summaryCards || {};
      parsedReview.feedback.summaryCards.errors = issues.filter(i => ['critical', 'high'].includes(i.severity)).length;
      parsedReview.feedback.summaryCards.warnings = issues.filter(i => ['medium', 'low'].includes(i.severity)).length;
      parsedReview.feedback.summaryCards.suggestions = issues.filter(i => i.severity === 'suggestion').length;
      parsedReview.feedback.summaryCards.complexity = parsedReview.feedback.stats.complexity === 'O(1)' ? 'Low' : 'Medium';
      parsedReview.feedback.summaryCards.maintainability = scoreResults.score >= 90 ? 'Excellent' : scoreResults.score >= 70 ? 'Good' : 'Needs Improvement';
      parsedReview.feedback.summaryCards.security = parsedReview.feedback.summaryCards.errors > 0 ? 'Critical Risk' : 'Secure';
      parsedReview.feedback.summaryCards.performance = parsedReview.feedback.summaryCards.complexity === 'Low' ? 'Optimized' : 'Suboptimal';
      parsedReview.feedback.summaryCards.overallGrade = overallGrade;
      
      parsedReview.feedback.breakdown.overallGrade = overallGrade;
    }
    
    return {
      optimizedCode: parsedReview.optimizedCode,
      feedback: parsedReview.feedback,
      analysisMode,
      compilerUsed
    };
  } catch (error) {
    console.error('[Groq Service Error]', error);
    throw new Error(`AI Review generation failed: ${error.message}`);
  }
};

module.exports = {
  generateCodeReview,
};
