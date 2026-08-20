type Token =
  | { type: 'number'; value: number }
  | { type: 'op'; value: '+' | '-' | '×' | '÷' }
  | { type: 'percent' };

function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expression.length) {
    const char = expression[i];
    if (char === ' ') {
      i += 1;
      continue;
    }
    if (/[0-9.]/.test(char)) {
      let raw = '';
      while (i < expression.length && /[0-9.]/.test(expression[i])) {
        raw += expression[i];
        i += 1;
      }
      const value = Number.parseFloat(raw);
      if (Number.isNaN(value)) {
        throw new Error('Invalid number');
      }
      tokens.push({ type: 'number', value });
      continue;
    }
    if (char === '+' || char === '-' || char === '×' || char === '÷') {
      tokens.push({ type: 'op', value: char });
      i += 1;
      continue;
    }
    if (char === '%') {
      tokens.push({ type: 'percent' });
      i += 1;
      continue;
    }
    throw new Error('Unexpected character');
  }
  return tokens;
}

function evaluateTokens(tokens: Token[]): number {
  let pos = 0;

  const peek = (): Token | undefined => tokens[pos];
  const next = (): Token | undefined => tokens[pos++];

  function parseFactor(): number {
    const current = peek();
    if (current && current.type === 'op' && (current.value === '-' || current.value === '+')) {
      next();
      const value = parseFactor();
      return current.value === '-' ? -value : value;
    }
    const token = next();
    if (!token || token.type !== 'number') {
      throw new Error('Expected a number');
    }
    let value = token.value;
    const after = peek();
    if (after && after.type === 'percent') {
      next();
      value /= 100;
    }
    return value;
  }

  function parseTerm(): number {
    let left = parseFactor();
    for (;;) {
      const op = peek();
      if (!op || op.type !== 'op' || (op.value !== '×' && op.value !== '÷')) {
        break;
      }
      next();
      const right = parseFactor();
      if (op.value === '÷') {
        if (right === 0) {
          throw new Error('Division by zero');
        }
        left /= right;
      } else {
        left *= right;
      }
    }
    return left;
  }

  function parseExpression(): number {
    let left = parseTerm();
    for (;;) {
      const op = peek();
      if (!op || op.type !== 'op' || (op.value !== '+' && op.value !== '-')) {
        break;
      }
      next();
      const right = parseTerm();
      left = op.value === '+' ? left + right : left - right;
    }
    return left;
  }

  const result = parseExpression();
  if (pos !== tokens.length) {
    throw new Error('Trailing tokens');
  }
  if (!Number.isFinite(result)) {
    throw new Error('Result is not finite');
  }
  return result;
}

export function evaluateExpression(expression: string): number {
  return evaluateTokens(tokenize(expression));
}

export function formatResult(value: number): string {
  const cleaned = Number.parseFloat(value.toPrecision(12));
  return String(cleaned);
}
