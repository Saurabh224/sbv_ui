type MatchedEntry = {
  prev_line_num_2: number | null;
  prev_line_2: string | null;

  prev_line_num_1: number | null;
  prev_line_1: string | null;

  line_num: number;
  line: string;
  chars_count: number;

  next_line_num_1: number | null;
  next_line_1: string | null;
  next_line_1_count: number;

  next_line_num_2: number | null;
  next_line_2: string | null;
  next_line_2_count: number;
};

type RequestBody = {
  limit?: number;
  sbvText?: string;
  token?: string; // optional if you want
};

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      // You don't strictly need CORS for same-origin, but harmless:
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "content-type, authorization",
      "access-control-allow-methods": "POST, OPTIONS",
    },
  });
}

function rstripNewlines(s: string): string {
  return s.replace(/[\r\n]+$/g, "");
}

function toLinesPreserve(content: string): string[] {
  const normalized = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  return normalized.split("\n");
}

function computeMatchedLines(allLines: string[], limit: number): MatchedEntry[] {
  const matched: MatchedEntry[] = [];
  const n = allLines.length;

  for (let idx0 = 0; idx0 < n; idx0++) {
    const lineNum = idx0 + 1;
    const stripped = rstripNewlines(allLines[idx0]);
    const charsCount = stripped.length;

    if (charsCount > limit) {
      const prev2Idx0 = idx0 - 2;
      const prev1Idx0 = idx0 - 1;
      const next1Idx0 = idx0 + 1;
      const next2Idx0 = idx0 + 2;

      const prev_line_2 = prev2Idx0 >= 0 ? rstripNewlines(allLines[prev2Idx0]) : null;
      const prev_line_num_2 = prev2Idx0 >= 0 ? prev2Idx0 + 1 : null;

      const prev_line_1 = prev1Idx0 >= 0 ? rstripNewlines(allLines[prev1Idx0]) : null;
      const prev_line_num_1 = prev1Idx0 >= 0 ? prev1Idx0 + 1 : null;

      const next_line_1 = next1Idx0 < n ? rstripNewlines(allLines[next1Idx0]) : null;
      const next_line_num_1 = next1Idx0 < n ? next1Idx0 + 1 : null;
      const next_line_1_count = next_line_1 ? next_line_1.length : 0;

      const next_line_2 = next2Idx0 < n ? rstripNewlines(allLines[next2Idx0]) : null;
      const next_line_num_2 = next2Idx0 < n ? next2Idx0 + 1 : null;
      const next_line_2_count = next_line_2 ? next_line_2.length : 0;

      matched.push({
        prev_line_num_2,
        prev_line_2,
        prev_line_num_1,
        prev_line_1,
        line_num: lineNum,
        line: stripped,
        chars_count: charsCount,
        next_line_num_1,
        next_line_1,
        next_line_1_count,
        next_line_num_2,
        next_line_2,
        next_line_2_count,
      });
    }
  }

  return matched;
}

export async function onRequest(context: any): Promise<Response> {
  const { request, env } = context;

  if (request.method === "OPTIONS") return json({ ok: true }, 200);
  if (request.method !== "POST") return json({ error: "Use POST" }, 405);

  // Optional auth: set in Pages project as an env var AUTH_TOKEN
  // If you DON'T want auth, keep AUTH_TOKEN unset.
  const authToken = env?.AUTH_TOKEN as string | undefined;
  if (authToken) {
    const auth = request.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : auth;
    if (token !== authToken) return json({ error: "Unauthorized" }, 401);
  }

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const limit = Number.isFinite(body.limit) ? Number(body.limit) : 42;
  if (!Number.isFinite(limit) || limit < 0 || limit > 5000) {
    return json({ error: "limit must be an integer in [0, 5000]" }, 400);
  }

  const text = typeof body.sbvText === "string" ? body.sbvText : "";
  if (!text) return json({ error: "sbvText is required" }, 400);

  const allLines = toLinesPreserve(text);
  const items = computeMatchedLines(allLines, limit);

  return json({ limit, count: items.length, items }, 200);
}
