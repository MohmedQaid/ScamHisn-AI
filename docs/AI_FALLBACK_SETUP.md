# AI fallback chain: setup

Every scan tries these in order and uses the first one that answers.

| Step | What answers | Set by | What it can do |
|---|---|---|---|
| 1 | Gemini, first key, primary model | `GEMINI_API_KEY`, `GEMINI_MODEL` | Everything, with live Google Search and Maps |
| 2 | Gemini, second key, primary model | `GEMINI_API_KEY_2` (or `GEMINI_API_KEYS=a,b`) | Same |
| 3 | Gemini, every key, backup model | `GEMINI_FALLBACK_MODEL` | Same; limits are counted per model |
| 4 | Self-hosted model (Jais 2) | `LOCAL_LLM_BASE_URL`, `LOCAL_LLM_MODEL`, `LOCAL_LLM_API_KEY` | Judges page text and telemetry. No live lookups, no images |
| 5 | Rules only | nothing | Technical checks, labelled "Incomplete check" |

A rate-limit or "high demand" reply moves straight to the next step. It does not retry the same key.

Image checks use steps 1 to 3 only, because the self-hosted model cannot read images.

## On Render

In the service's **Environment** tab add the variables you want. All are optional.

```text
GEMINI_API_KEY_2        = <second team member's key>
GEMINI_FALLBACK_MODEL   = <a second model id, copied from Google AI Studio>
LOCAL_LLM_BASE_URL      = https://<your-tunnel-host>/v1
LOCAL_LLM_MODEL         = jais-2-8b-chat
LOCAL_LLM_API_KEY       = <a long random secret>
```

Keys are entered in Render only. Never commit them.

> Using two people's free keys to get past one account's limit may conflict with Google's API
> terms on circumventing quotas. The legitimate routes are a backup model (step 3) or a paid key.
> Decide as a team before turning step 2 on.

## Running Jais 2 on your own PC

Needs a GPU with about 8 GB of free memory. A 12 GB RTX 3080 fits the 8B model.

1. Install a server that speaks the OpenAI chat API: llama.cpp (`llama-server`) or Ollama.
2. Download the model file from `inception42/Jais-2-8B-Chat-GGUF` on Hugging Face.
   A Q4 file is about 5 GB.
3. Start it on a local port, with a secret key:

   ```powershell
   llama-server -m Jais-2-8B-Chat-Q4_K_M.gguf --port 8080 -ngl 99 -c 8192 --api-key <your-secret>
   ```

4. Check it answers:

   ```powershell
   curl http://127.0.0.1:8080/v1/models -H "Authorization: Bearer <your-secret>"
   ```

5. Expose it to Render with a tunnel (Cloudflare Tunnel is free), then set `LOCAL_LLM_BASE_URL`
   to the tunnel's `https://…/v1` address and `LOCAL_LLM_API_KEY` to the same secret.

Jais 2 8B has a short memory (about 8,000 tokens), so the app sends it a trimmed prompt.
`LOCAL_LLM_MAX_PROMPT_CHARS` controls the budget (default 12,000 characters).

Your PC and home internet must stay on while judges test. If they drop, the chain falls to step 5.

## Checking which step answered

Every scan response carries a `coverage` block:

```json
{ "level": "partial", "pageLoaded": true, "aiProvider": "local", "aiModel": "jais-2-8b-chat", "liveSourcesChecked": false }
```

| `level` | Meaning | What the user sees |
|---|---|---|
| `full` | Page opened, AI answered with live lookups | "Full check" |
| `partial` | AI answered without live lookups, or the page did not open | Amber notice |
| `rules_only` | No AI answered | "Incomplete check", never "safe" |
| `address_only` | The domain does not resolve | Verdict from the address itself |

Server logs print one line per failed step, for example
`[ScamHisn AI chain] gemini:key1:gemini-3.5-flash-lite failed: 503 UNAVAILABLE`.

## What was tested

- The chain logic, the local-model connector and the coverage rules have unit tests
  (`apps/api/src/__tests__/aiChain.test.ts`).
- The local-model path was run end to end against a stand-in server that speaks the same API.
- Jais 2 itself has not been run by us yet, so its answer quality on scam checks is unmeasured.
