const inputText = document.getElementById("input-text");
const outputText = document.getElementById("output-text");
const redactBtn = document.getElementById("redact-btn");
const clearBtn = document.getElementById("clear-btn");
const copyBtn = document.getElementById("copy-btn");
const copyStatus = document.getElementById("copy-status");
const liveRedactToggle = document.getElementById("live-redact");
const redactNumbersToggle = document.getElementById("redact-numbers");
const preserveYearsToggle = document.getElementById("preserve-years");

const PLACEHOLDERS = "XYZABCDEFGHIJKLMNOPQRSTUVW".split("");

const COMMON_WORDS = new Set([
  "A",
  "An",
  "And",
  "As",
  "At",
  "Attached",
  "Because",
  "But",
  "By",
  "Can",
  "Could",
  "Dear",
  "Do",
  "For",
  "From",
  "Hello",
  "Hi",
  "How",
  "I",
  "If",
  "In",
  "Is",
  "It",
  "Its",
  "May",
  "No",
  "Not",
  "Of",
  "On",
  "Or",
  "Please",
  "Regards",
  "Should",
  "So",
  "Thanks",
  "That",
  "Thank",
  "The",
  "There",
  "This",
  "To",
  "We",
  "What",
  "When",
  "Where",
  "Which",
  "Who",
  "Why",
  "With",
  "Would",
  "Your",
]);

const SIGNOFF_WORDS = ["thanks", "regards", "sincerely", "best", "cheers"];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
}

function shouldTreatAsName(word, fullText, index) {
  if (word.length < 3 || COMMON_WORDS.has(word)) {
    return false;
  }

  const prevSlice = fullText.slice(Math.max(0, index - 25), index);
  const prevLower = prevSlice.toLowerCase();

  const greetingContext = /(?:\bhi|\bhello|\bdear)\s*,?\s*$/i.test(prevSlice);
  const listContext = /,\s*$/.test(prevSlice);
  const contactContext = /\bcontact\s+me,?\s*$/i.test(prevSlice);
  const signoffContext = SIGNOFF_WORDS.some((token) => prevLower.includes(`${token},\n`));

  if (greetingContext || listContext || contactContext || signoffContext) {
    return true;
  }

  // Fallback: capitalized mid-sentence words are likely named entities.
  let scan = index - 1;
  while (scan >= 0 && /\s/.test(fullText[scan])) {
    scan -= 1;
  }
  const prevChar = scan >= 0 ? fullText[scan] : "";
  const looksLikeSentenceStart = scan < 0 || /[.!?\n]/.test(prevChar);
  return !looksLikeSentenceStart;
}

function buildNameMap(text) {
  const nameMap = new Map();

  const matches = text.matchAll(/\b[A-Z][a-z]{2,}\b/g);
  for (const match of matches) {
    const word = match[0];
    const index = match.index ?? 0;

    if (!shouldTreatAsName(word, text, index)) {
      continue;
    }

    if (!nameMap.has(word)) {
      const slot = nameMap.size;
      const value = PLACEHOLDERS[slot % PLACEHOLDERS.length];
      nameMap.set(word, value);
    }
  }

  return nameMap;
}

function redactNames(text, nameMap) {
  let output = text;

  for (const [name, alias] of nameMap.entries()) {
    output = output.replace(new RegExp(`\\b${escapeRegExp(name)}\\b`, "g"), alias);
  }

  return output;
}

function redactNumbers(text, preserveYears) {
  return text.replace(/\b[0-9][0-9,._-]*\b/g, (value) => {
    if (preserveYears && /^(19|20)\d{2}$/.test(value)) {
      return value;
    }
    return "XXX";
  });
}

function redactText(raw) {
  const names = buildNameMap(raw);
  let redacted = redactNames(raw, names);

  if (redactNumbersToggle.checked) {
    redacted = redactNumbers(redacted, preserveYearsToggle.checked);
  }

  return redacted;
}

function applyRedaction() {
  outputText.value = redactText(inputText.value);
}

let debounceTimer;
inputText.addEventListener("input", () => {
  if (!liveRedactToggle.checked) {
    return;
  }

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(applyRedaction, 180);
});

redactBtn.addEventListener("click", applyRedaction);

liveRedactToggle.addEventListener("change", () => {
  if (liveRedactToggle.checked) {
    applyRedaction();
  }
});

redactNumbersToggle.addEventListener("change", applyRedaction);
preserveYearsToggle.addEventListener("change", applyRedaction);

clearBtn.addEventListener("click", () => {
  inputText.value = "";
  outputText.value = "";
  copyStatus.textContent = "";
  inputText.focus();
});

copyBtn.addEventListener("click", async () => {
  const value = outputText.value;
  if (!value.trim()) {
    copyStatus.textContent = "Nothing to copy";
    return;
  }

  try {
    await navigator.clipboard.writeText(value);
    copyStatus.textContent = "Copied";
    setTimeout(() => {
      copyStatus.textContent = "";
    }, 1200);
  } catch {
    copyStatus.textContent = "Clipboard blocked by browser";
  }
});

const example = `Hi Rowan,

Attached is the Q4 project summary for 2025. The report references budget line item 482-19 and an estimated total of 84500 credits for planning purposes.

If you have any questions, please contact me, Avery, or Jordan in this thread. Also make sure to talk to James about this, since Avery mentioned he was anticipating some issues with this.

Thanks,
Taylor`;

inputText.value = example;
applyRedaction();
