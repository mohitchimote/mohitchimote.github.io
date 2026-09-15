---
title: AI Mortgage Tools
order: 6
status: poc
summary: "Two personal proof-of-concepts exploring AI-assisted mortgage processing with a locally-hosted Gemma model — document summarisation and affordability assessment, both built to run entirely offline."
users: "Mortgage underwriters and processors handling long document review and affordability checks — the personas these were built to test, not a live product with real users yet. Proof-of-concept stage; production path would depend on a real employer's model-governance sign-off, which is outside the scope of a personal project."
role: "Solo engineering team, alongside a full-time product role at TCS in UK mortgage technology — the day job gave me the problem context, but both of these are independent personal builds, not TCS deliverables."
problem: |
  Mortgage underwriters spend a lot of time on two repetitive tasks: reading long documents — application packs, valuation reports, offer condition letters, payslips — to extract what actually matters, and running affordability calculations against a moving target of UK income tax bands, National Insurance thresholds, and cost-of-living data that shifts every tax year. AI summarisation and AI-assisted affordability checks are the obvious answer to both.

  The complication is that UK regulated financial services (FCA, GDPR, Consumer Duty) makes it hard to casually send customer financial data to a third-party API. Both tools exist to test a narrower question: can a fully local, offline model do this work well enough to be useful, without that data ever leaving the network?
architecture: |
  These are two separate services sharing a theme, not one product — kept as one case study because the interesting parts (offline inference, structured domain data) are the same story told twice.

  **AI Summariser — one UI, two interchangeable backends.** A shared demo UI toggles between a Node.js/Ollama backend (the easier path to run locally — adds document verification via PDF/DOCX upload and PDF export of summaries) and a Python/FastAPI backend using `llama-cpp-python` with Metal GPU offload on Apple Silicon for faster in-process inference, plus a mock mode for testing the API without loading the model at all. Both ultimately run Gemma 4 — the Node path calls it through the Ollama API, the Python path loads the GGUF weights (Q4_K_M, ~5GB) directly in-process. Prompts are domain-specific per document type: mortgage application, valuation report, offer conditions, payslip verification.

  **AI Affordability — rules as data, not as prompt strings.** The Node.js/Express backend's `promptBuilder.js` detects application type (`residential` / `buy_to_let` / `holiday_let`) from the loan and property data, then filters a set of affordability rules down to the ones that actually apply before building the prompt. UK income tax bands (England & Wales and Scotland separately), employee and self-employed National Insurance thresholds, personal allowance tapering, and ONS household cost-of-living data all live as structured reference data pulled in via `referenceData.js`, not hardcoded into the prompt text. When a tax year changes, updating the tool is a data change, not a code change.
outcome: |
  Both stayed at proof-of-concept — that decision belongs to whichever employer's model-governance process would need to sign off on production use, not something a personal project gets to decide on its own. What they did prove out: a Gemma 4 GGUF model with Metal GPU offload runs fast enough on a laptop for interactive document summarisation, and encoding UK tax and lending rules as structured reference data rather than prompt text makes the affordability tool's yearly maintenance trivial — swap a JSON file, not the code.
stack:
  - Python
  - FastAPI
  - llama-cpp-python
  - Node.js
  - Express
  - Ollama
  - Gemma 4
  - Docker
diagram:
  caption: "One UI, two interchangeable inference paths — both ultimately running the same Gemma 4 model."
  svg: |
    <svg viewBox="0 0 680 340" role="img" aria-labelledby="ai-tools-arch-title" xmlns="http://www.w3.org/2000/svg">
      <title id="ai-tools-arch-title">AI Summariser architecture: one demo UI with a backend toggle between a Node.js/Ollama path and a Python/FastAPI/llama-cpp path, both ultimately running Gemma 4</title>
      <defs>
        <marker id="ai-tools-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" style="fill:var(--text-3)" />
        </marker>
      </defs>

      <path d="M280,84 L280,110 Q280,130 220,130" style="fill:none;stroke:var(--text-3);stroke-width:1.5" marker-end="url(#ai-tools-arrow)" />
      <path d="M400,84 L400,110 Q400,130 460,130" style="fill:none;stroke:var(--text-3);stroke-width:1.5" marker-end="url(#ai-tools-arrow)" />
      <path d="M220,194 L220,220" style="fill:none;stroke:var(--text-3);stroke-width:1.5" marker-end="url(#ai-tools-arrow)" />
      <path d="M460,194 L460,220" style="fill:none;stroke:var(--text-3);stroke-width:1.5" marker-end="url(#ai-tools-arrow)" />

      <g>
        <rect x="180" y="20" width="320" height="64" rx="4" style="fill:var(--surface);stroke:var(--amber);stroke-width:1.25" />
        <text x="340" y="46" text-anchor="middle" style="fill:var(--text);font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:500">Demo UI — backend toggle</text>
        <text x="340" y="64" text-anchor="middle" style="fill:var(--text-2);font-family:'Space Grotesk',sans-serif;font-size:10.5px">localhost:3000</text>
      </g>

      <g>
        <rect x="60" y="130" width="320" height="64" rx="4" style="fill:var(--surface);stroke:var(--rule-strong)" />
        <text x="220" y="156" text-anchor="middle" style="fill:var(--text);font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:500">Node.js + Ollama</text>
        <text x="220" y="174" text-anchor="middle" style="fill:var(--text-2);font-family:'Space Grotesk',sans-serif;font-size:10px">doc verify (PDF/DOCX) · PDF export</text>
      </g>
      <g>
        <rect x="300" y="130" width="320" height="64" rx="4" style="fill:var(--surface);stroke:var(--rule-strong)" />
        <text x="460" y="156" text-anchor="middle" style="fill:var(--text);font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:500">Python + FastAPI</text>
        <text x="460" y="174" text-anchor="middle" style="fill:var(--text-2);font-family:'Space Grotesk',sans-serif;font-size:10px">llama-cpp-python · Metal GPU offload</text>
      </g>

      <g>
        <rect x="60" y="220" width="320" height="56" rx="4" style="fill:var(--ink);stroke:var(--rule-strong)" />
        <text x="220" y="252" text-anchor="middle" style="fill:var(--text-2);font-family:'JetBrains Mono',monospace;font-size:11px">Gemma 4 via Ollama API</text>
      </g>
      <g>
        <rect x="300" y="220" width="320" height="56" rx="4" style="fill:var(--ink);stroke:var(--rule-strong)" />
        <text x="460" y="252" text-anchor="middle" style="fill:var(--text-2);font-family:'JetBrains Mono',monospace;font-size:11px">Gemma 4 GGUF, in-process</text>
      </g>
    </svg>
codeSnippet:
  file: node-service/promptBuilder.js
  lang: javascript
  repoUrl: https://github.com/mohitchimote/ai-affordability/blob/main/node-service/promptBuilder.js#L1-L21
  code: |
    import { getAll } from './referenceData.js';

    function fmt(n) { return Number(n).toLocaleString('en-GB'); }

    function detectAppType(data) {
      const purpose = data?.loan?.purpose;
      const propType = data?.property?.type;
      if (purpose === 'holiday_let' || propType === 'holiday_let') return 'hl';
      if (purpose === 'buy_to_let'  || propType === 'buy_to_let')  return 'btl';
      return 'residential';
    }

    function filterRules(rules, appType) {
      return rules.filter(r => {
        const t = r.applicable_to || ['all'];
        return t.includes('all') || t.includes(appType);
      });
    }

    function formatRules(rules) {
      return rules.map(r => `[${r.category}] ${r.title}\n${r.text}`).join('\n\n');
    }
screenshots:
  - src: /images/work/ai-gemma-tools/summariser-demo.png
    alt: "AI Summariser demo UI showing the backend toggle and a generated summary of a mortgage document"
    caption: "AI Summariser — backend toggle and a generated document summary"
    placeholder: true
  - src: /images/work/ai-gemma-tools/affordability-result.png
    alt: "AI Affordability tool showing an assessment result with cited rules"
    caption: "AI Affordability — an assessment result with the rules it applied"
    placeholder: true
links:
  repos:
    - label: "AI Summariser"
      url: https://github.com/mohitchimote/ai-summariser
    - label: "AI Affordability"
      url: https://github.com/mohitchimote/ai-affordability
---
