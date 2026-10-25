import { readFileSync } from "node:fs";

const RULES_PATH = ".gemini/rules/luckypickcanada.md";
const GH_TOKEN = process.env.GH_TOKEN || "";
const API_KEY = process.env.GEMINI_API_KEY || "";
const REPOSITORY = process.env.GITHUB_REPOSITORY || "";
const API_BASE = (process.env.GITHUB_API_URL || "https://api.github.com").replace(/\/$/, "");

async function githubRequest(path, options = {}) {
  const response = await fetch(API_BASE + path, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: "Bearer " + GH_TOKEN,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  if (!response.ok) throw new Error("GitHub API returned HTTP " + response.status + ".");
  return text ? JSON.parse(text) : null;
}

async function gemini(prompt, model) {
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: readFileSync(RULES_PATH, "utf8") }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
    })
  });
  const payload = await response.json();
  if (!response.ok) throw new Error("Gemini API returned HTTP " + response.status + ".");
  return payload;
}

async function main() {
  if (!GH_TOKEN || !API_KEY || !REPOSITORY) throw new Error("Required workflow configuration is unavailable.");
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
  const prNumber = event.pull_request?.number || event.issue?.number || Number(process.env.GEMINI_PR_NUMBER);
  if (!prNumber) throw new Error("Unable to identify a pull request.");
  const pr = await githubRequest("/repos/" + REPOSITORY + "/pulls/" + prNumber);
  const model = process.env.GEMINI_PRIMARY_MODEL || "gemini-3.8-flash";
  void pr;
  void model;
}

main().catch((error) => {
  process.stderr.write("Gemini PR Reviewer stopped: " + error.message + "\n");
  process.exitCode = 1;
});
