// ===== Tabs =====
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
  });
});

// ===== Toast =====
const toast = document.getElementById('toast');
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1800);
}

// ===== Copy helper =====
function copyText(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(
      () => showToast('已复制'),
      () => fallbackCopy(text)
    );
  } else {
    fallbackCopy(text);
  }
}
function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  showToast('已复制');
}

// ===== Color tool =====
const colorInput = document.getElementById('colorInput');
const swatch = document.getElementById('swatch');
const hexVal = document.getElementById('hexVal');
const rgbVal = document.getElementById('rgbVal');
const hslVal = document.getElementById('hslVal');

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return { r, g, b };
}
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}
function updateColor() {
  const hex = colorInput.value.toUpperCase();
  const { r, g, b } = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);
  swatch.style.background = hex;
  hexVal.textContent = hex;
  rgbVal.textContent = `rgb(${r}, ${g}, ${b})`;
  hslVal.textContent = `hsl(${h}, ${s}%, ${l}%)`;
}
colorInput.addEventListener('input', updateColor);
updateColor();

document.querySelectorAll('.copy-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    copyText(document.getElementById(btn.dataset.copy).textContent);
  });
});

// ===== Unit converter =====
const units = {
  length: {
    m: 1, km: 1000, cm: 0.01, mm: 0.001,
    inch: 0.0254, ft: 0.3048, mile: 1609.344,
  },
  weight: {
    kg: 1, g: 0.001, mg: 0.000001, t: 1000, lb: 0.45359237, oz: 0.028349523,
  },
  data: {
    B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4,
  },
};
const convertType = document.getElementById('convertType');
const convertFrom = document.getElementById('convertFrom');
const convertTo = document.getElementById('convertTo');
const convertVal = document.getElementById('convertVal');
const convertResult = document.getElementById('convertResult');

function fillUnits() {
  const type = convertType.value;
  convertFrom.innerHTML = '';
  convertTo.innerHTML = '';
  if (type === 'temperature') {
    ['C', 'F', 'K'].forEach((u) => {
      convertFrom.add(new Option(u, u));
      convertTo.add(new Option(u, u));
    });
    convertTo.value = 'F';
  } else {
    Object.keys(units[type]).forEach((u) => {
      convertFrom.add(new Option(u, u));
      convertTo.add(new Option(u, u));
    });
    convertTo.value = Object.keys(units[type])[1];
  }
  doConvert();
}
function doConvert() {
  const type = convertType.value;
  const v = parseFloat(convertVal.value) || 0;
  const from = convertFrom.value;
  const to = convertTo.value;
  let res;
  if (type === 'temperature') {
    let c = v;
    if (from === 'F') c = (v - 32) * 5 / 9;
    else if (from === 'K') c = v - 273.15;
    if (to === 'C') res = c;
    else if (to === 'F') res = c * 9 / 5 + 32;
    else res = c + 273.15;
  } else {
    const base = v * units[type][from];
    res = base / units[type][to];
  }
  convertResult.textContent = `${res.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${to}`;
}
convertType.addEventListener('change', fillUnits);
[convertFrom, convertTo, convertVal].forEach((el) => el.addEventListener('input', doConvert));
fillUnits();

// ===== Text tool =====
const textInput = document.getElementById('textInput');
const charCount = document.getElementById('charCount');
const wordCount = document.getElementById('wordCount');
const lineCount = document.getElementById('lineCount');
const byteCount = document.getElementById('byteCount');

function updateStats() {
  const t = textInput.value;
  charCount.textContent = t.length;
  wordCount.textContent = t.trim() ? t.trim().split(/\s+/).length : 0;
  lineCount.textContent = t ? t.split('\n').length : 0;
  byteCount.textContent = new Blob([t]).size;
}
textInput.addEventListener('input', updateStats);

document.querySelectorAll('[data-action]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.action;
    const t = textInput.value;
    if (action === 'upper') textInput.value = t.toUpperCase();
    else if (action === 'lower') textInput.value = t.toLowerCase();
    else if (action === 'reverse') textInput.value = t.split('').reverse().join('');
    else if (action === 'trim') textInput.value = t.replace(/\s+/g, ' ').trim();
    else if (action === 'copy') { copyText(t); return; }
    else if (action === 'clear') textInput.value = '';
    updateStats();
  });
});

// ===== Password generator =====
const pwOutput = document.getElementById('pwOutput');
const pwLen = document.getElementById('pwLen');
const pwLenVal = document.getElementById('pwLenVal');
const pwLower = document.getElementById('pwLower');
const pwUpper = document.getElementById('pwUpper');
const pwNum = document.getElementById('pwNum');
const pwSym = document.getElementById('pwSym');

pwLen.addEventListener('input', () => {
  pwLenVal.textContent = pwLen.value;
  genPassword();
});
function genPassword() {
  const len = parseInt(pwLen.value);
  let chars = '';
  if (pwLower.checked) chars += 'abcdefghijklmnopqrstuvwxyz';
  if (pwUpper.checked) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (pwNum.checked) chars += '0123456789';
  if (pwSym.checked) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
  if (!chars) {
    pwOutput.value = '请至少选择一种字符类型';
    return;
  }
  let pw = '';
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  for (let i = 0; i < len; i++) pw += chars[arr[i] % chars.length];
  pwOutput.value = pw;
}
document.getElementById('pwGen').addEventListener('click', genPassword);
document.getElementById('pwCopy').addEventListener('click', () => copyText(pwOutput.value));
[pwLower, pwUpper, pwNum, pwSym].forEach((c) => c.addEventListener('change', genPassword));
genPassword();

// ===== Timer =====
const timerDisplay = document.getElementById('timerDisplay');
const timerMin = document.getElementById('timerMin');
const timerSec = document.getElementById('timerSec');
let timerInterval = null;
let remaining = 0;

function fmtTime(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((n) => String(n).padStart(2, '0')).join(':');
}
function updateDisplay() {
  timerDisplay.textContent = fmtTime(remaining);
}
document.getElementById('timerStart').addEventListener('click', () => {
  if (timerInterval) return;
  if (remaining <= 0) {
    remaining = (parseInt(timerMin.value) || 0) * 60 + (parseInt(timerSec.value) || 0);
  }
  if (remaining <= 0) { showToast('请设置时间'); return; }
  updateDisplay();
  timerInterval = setInterval(() => {
    remaining--;
    updateDisplay();
    if (remaining <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      showToast('⏰ 时间到！');
    }
  }, 1000);
});
document.getElementById('timerPause').addEventListener('click', () => {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
});
document.getElementById('timerReset').addEventListener('click', () => {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  remaining = 0;
  updateDisplay();
});

// ===== BMI =====
const bmiHeight = document.getElementById('bmiHeight');
const bmiWeight = document.getElementById('bmiWeight');
const bmiResult = document.getElementById('bmiResult');
const bmiHint = document.getElementById('bmiHint');

document.getElementById('bmiCalc').addEventListener('click', () => {
  const h = parseFloat(bmiHeight.value) / 100;
  const w = parseFloat(bmiWeight.value);
  if (!h || !w || h <= 0 || w <= 0) {
    showToast('请输入有效的身高和体重');
    return;
  }
  const bmi = w / (h * h);
  bmiResult.textContent = bmi.toFixed(1);
  let hint = '';
  let color = '';
  if (bmi < 18.5) { hint = '偏瘦'; color = '#3b82f6'; }
  else if (bmi < 24) { hint = '正常'; color = '#10b981'; }
  else if (bmi < 28) { hint = '超重'; color = '#f59e0b'; }
  else { hint = '肥胖'; color = '#ef4444'; }
  bmiHint.textContent = `健康状况：${hint}`;
  bmiHint.style.color = color;
});

// ===== Calculator =====
const calcInput = document.getElementById('calcInput');
const calcResult = document.getElementById('calcResult');

// Safe expression evaluator (only numbers, operators, parens, decimal)
function safeEval(expr) {
  // Remove all whitespace
  expr = expr.replace(/\s+/g, '');
  if (!expr) return null;
  // Only allow digits, +-*/(). and parentheses
  if (!/^[0-9+\-*/().]+$/.test(expr)) return null;
  // Prevent empty parens or double operators (basic)
  if (/[+\-*/]{2,}/.test(expr) || /\(\)/.test(expr)) return null;
  try {
    // eslint-disable-next-line no-new-func
    const val = Function('"use strict"; return (' + expr + ')')();
    if (typeof val !== 'number' || !isFinite(val)) return null;
    return Math.round(val * 1e12) / 1e12;
  } catch {
    return null;
  }
}
function updateCalc() {
  const res = safeEval(calcInput.value);
  calcResult.textContent = res !== null ? res.toLocaleString(undefined, { maximumFractionDigits: 12 }) : '—';
  calcResult.style.color = res !== null ? 'var(--primary)' : 'var(--muted)';
}
calcInput.addEventListener('input', updateCalc);

document.querySelectorAll('.calc-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    calcInput.value += btn.dataset.val;
    updateCalc();
    calcInput.focus();
  });
});
document.getElementById('calcBksp').addEventListener('click', () => {
  calcInput.value = calcInput.value.slice(0, -1);
  updateCalc();
});
document.getElementById('calcClear').addEventListener('click', () => {
  calcInput.value = '';
  updateCalc();
});
document.getElementById('calcCopy').addEventListener('click', () => {
  if (calcResult.textContent !== '—') copyText(calcResult.textContent);
});

// Keyboard support for calc
calcInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === '=') {
    e.preventDefault();
    const res = safeEval(calcInput.value);
    if (res !== null) {
      calcInput.value = String(res);
      updateCalc();
    }
  }
});

// ===== Base converter =====
const baseInput = document.getElementById('baseInput');
const baseFrom = document.getElementById('baseFrom');

function toBase(n, base) {
  if (n < 0) return '-' + Math.abs(n).toString(base).toUpperCase();
  return n.toString(base).toUpperCase();
}
function updateBase() {
  const raw = baseInput.value.trim();
  const fromBase = parseInt(baseFrom.value);
  const el2 = document.getElementById('base2');
  const el8 = document.getElementById('base8');
  const el10 = document.getElementById('base10');
  const el16 = document.getElementById('base16');

  if (!raw) {
    [el2, el8, el10, el16].forEach((el) => (el.textContent = '—'));
    return;
  }
  // Validate characters for the selected base
  const validChars = {
    2: /^[01]+$/,
    8: /^[0-7]+$/,
    10: /^[0-9]+$/,
    16: /^[0-9a-fA-F]+$/,
  }[fromBase];
  const isNeg = raw.startsWith('-');
  const numPart = isNeg ? raw.slice(1) : raw;

  if (!validChars.test(numPart)) {
    [el2, el8, el10, el16].forEach((el) => (el.textContent = '无效输入'));
    return;
  }
  let dec;
  try {
    dec = parseInt(numPart, fromBase);
    if (isNaN(dec)) {
      [el2, el8, el10, el16].forEach((el) => (el.textContent = '无效输入'));
      return;
    }
  } catch {
    [el2, el8, el10, el16].forEach((el) => (el.textContent = '无效输入'));
    return;
  }
  if (isNeg) dec = -dec;
  el2.textContent = toBase(dec, 2);
  el8.textContent = toBase(dec, 8);
  el10.textContent = dec.toLocaleString();
  el16.textContent = toBase(dec, 16);
}
baseInput.addEventListener('input', updateBase);
baseFrom.addEventListener('change', updateBase);
updateBase();

// 右上角刷新按钮：强制跳过缓存刷新
document.getElementById('refreshBtn').addEventListener('click', () => {
  const btn = document.getElementById('refreshBtn');
  btn.classList.add('spinning');
  // 加时间戳跳过 CDN 缓存
  const url = new URL(window.location.href);
  url.searchParams.set('_t', Date.now());
  window.location.replace(url.toString());
});
