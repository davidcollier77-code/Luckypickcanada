import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const manifest = JSON.parse(readFileSync(".docs/manifest.json", "utf8"));

const retiredReferences = [
  { id: "/posthog/posthog-js", group: "deep-dive", snapshot: ".docs/deep-dive/_posthog_posthog-js.md" },
  { id: "/magicuidesign/magicui", group: "polishing", snapshot: ".docs/polishing/_magicuidesign_magicui.md" },
  { id: "/pmndrs/react-three-fiber", group: "creation", snapshot: ".docs/creation/_pmndrs_react-three-fiber.md" },
  { id: "/upstash/ratelimit", group: "security", snapshot: ".docs/security/_upstash_ratelimit.md" }
];

describe("documentation library retirement", () => {
  it("removes every retired reference from all manifest indexes, specialist routes, and snapshots", () => {
    for (const reference of retiredReferences) {
      for (const [group, ids] of Object.entries(manifest.groups)) {
        expect(ids, `${reference.id} must not be routed from ${group}`).not.toContain(reference.id);
      }

      expect(manifest.sources).not.toHaveProperty(reference.id);
      expect(manifest.inventory).not.toContain(reference.id);
      expect(manifest.githubShas ?? {}).not.toHaveProperty(reference.id);
      for (const group of Object.keys(manifest.groups)) {
        const routingFile = `.freebuff/${group}.md`;
        expect(readFileSync(routingFile, "utf8"), `${reference.id} must not appear in ${routingFile}`).not.toContain(reference.id);
      }
      expect(existsSync(reference.snapshot), `${reference.snapshot} must be deleted`).toBe(false);
    }
  });

  it("keeps the retired Gemini API library sources absent everywhere", () => {
    const retiredGemini = [
      "/websites/ai_google_dev_gemini-api",
      "/google-gemini/gemini-skills/gemini-api-dev"
    ];

    for (const id of retiredGemini) {
      for (const [group, ids] of Object.entries(manifest.groups)) {
        expect(ids, `${id} must not be routed from ${group}`).not.toContain(id);
      }
      expect(manifest.sources).not.toHaveProperty(id);
      expect(manifest.inventory).not.toContain(id);
      expect(manifest.githubShas ?? {}).not.toHaveProperty(id);
    }

    const routingFiles = Object.keys(manifest.groups).map((group) => `.freebuff/${group}.md`);
    for (const id of retiredGemini) {
      for (const routingFile of routingFiles) {
        expect(readFileSync(routingFile, "utf8"), `${id} must not appear in ${routingFile}`).not.toContain(id);
      }
    }

    // Both Gemini API documents were intentionally retired; no canonical copy or
    // group link may be restored, recreated or regenerated in any group.
    const retiredSnapshots = [
      ".docs/creation/_websites_ai_google_dev_gemini-api.md",
      ".docs/creation/_google-gemini_gemini-skills_gemini-api-dev.md",
      ".docs/deep-dive/_google-gemini_gemini-skills_gemini-api-dev.md",
      ".docs/troubleshooting/_google-gemini_gemini-skills_gemini-api-dev.md"
    ];
    for (const path of retiredSnapshots) {
      expect(existsSync(path), `${path} must stay deleted`).toBe(false);
    }
  });

  it("keeps the earlier PR #1740 retirements absent", () => {
    const previousRetirements = [
      "/python-pillow/Pillow",
      "/android/developers",
      "/google-gemini/gemini-cli"
    ];

    const allManifestText = JSON.stringify(manifest);
    for (const id of previousRetirements) {
      expect(allManifestText).not.toContain(id);
    }

    const previousSnapshots = [
      ".docs/polishing/_python-pillow_Pillow.md",
      ".docs/deep-dive/_android_developers.md",
      ".docs/creation/_google-gemini_gemini-cli.md",
      ".docs/deep-dive/_google-gemini_gemini-cli.md",
      ".docs/troubleshooting/_google-gemini_gemini-cli.md"
    ];
    for (const path of previousSnapshots) {
      expect(existsSync(path), `${path} must stay deleted`).toBe(false);
    }
  });

  it("keeps NumPy routed only to Audio with its canonical snapshot", () => {
    expect(manifest.groups.audio).toContain("/numpy/numpy");
    for (const [group, ids] of Object.entries(manifest.groups)) {
      if (group !== "audio") expect(ids).not.toContain("/numpy/numpy");
    }

    expect(manifest.sources).toHaveProperty("/numpy/numpy");
    expect(manifest.inventory).toContain("/numpy/numpy");
    expect(existsSync(".docs/audio/_numpy_numpy.md")).toBe(true);
    expect(existsSync(".docs/polishing/_numpy_numpy.md")).toBe(false);
    expect(readFileSync(".freebuff/audio.md", "utf8")).toContain("/numpy/numpy");
    expect(readFileSync(".freebuff/polishing.md", "utf8")).not.toContain("/numpy/numpy");
  });
});
