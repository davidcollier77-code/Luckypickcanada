import { afterEach, describe, expect, it } from "vitest";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

// The detection contract: a system-wide runtime or a prebaked Playwright browser root is
// used when it is present *and launchable* — the pinned Chromium revision — and the
// private prefix is only provisioned when neither is available. Every fixture redirects
// the detection directories, so these tests never consult this machine's real libraries,
// fonts or /opt, never reach the apt download path, and never depend on whether the host
// has a system Chrome.
const REPO_ROOT = process.cwd();
const SCRIPT = join(REPO_ROOT, "scripts", "setup-chromium-libs.sh");

// Mirrors REQUIRED_LIBS in the script, so a runtime missing one object is still incomplete.
const REQUIRED_LIBS = [
  "libnspr4.so",
  "libnss3.so",
  "libasound.so.2",
  "libatk-1.0.so.0",
  "libatk-bridge-2.0.so.0",
  "libcups.so.2",
  "libxkbcommon.so.0",
  "libXcomposite.so.1",
  "libXdamage.so.1",
  "libXfixes.so.3",
  "libXrandr.so.2",
  "libpango-1.0.so.0",
  "libpangocairo-1.0.so.0",
  "libcairo.so.2",
  "libatspi.so.0",
];

// The revision the repository's own Playwright pins, resolved the same way the script
// resolves it. When it cannot be resolved the revision-specific tests are skipped rather
// than asserting a guessed number.
const PINNED_REVISION = (() => {
  const result = spawnSync(
    "node",
    [
      "--input-type=commonjs",
      "-e",
      [
        'const fs = require("node:fs");',
        'const path = require("node:path");',
        "const candidates = [];",
        'try { candidates.push(require.resolve("playwright-core/browsers.json")); } catch {}',
        "try {",
        '  const manifest = require.resolve("playwright/package.json");',
        '  candidates.push(path.join(path.dirname(manifest), "..", "playwright-core", "browsers.json"));',
        "} catch {}",
        "for (const file of candidates) {",
        "  try {",
        '    const data = JSON.parse(fs.readFileSync(file, "utf8"));',
        '    const chromium = (data.browsers ?? []).find((entry) => entry.name === "chromium");',
        "    if (chromium?.revision) { process.stdout.write(String(chromium.revision)); process.exit(0); }",
        "  } catch {}",
        "}",
        "process.exit(1);",
      ].join("\n"),
    ],
    { cwd: REPO_ROOT, encoding: "utf8" },
  );
  return (result.stdout || "").trim();
})();

const fixtures = [];

function writeChromium(root, revision, { readOnly = false } = {}) {
  const binaryDirectory = join(root, `chromium-${revision}`, "chrome-linux64");
  mkdirSync(binaryDirectory, { recursive: true });
  writeFileSync(join(binaryDirectory, "chrome"), "#!/bin/sh\nexit 0\n", {
    mode: 0o755,
  });
  if (readOnly) chmodSync(join(root, `chromium-${revision}`), 0o555);
  if (readOnly) chmodSync(root, 0o555);
}

function createFixture({
  systemRuntime = false,
  prebakedRevision = null,
} = {}) {
  const root = mkdtempSync(join(tmpdir(), "chromium-runtime-detect-"));
  fixtures.push(root);

  const home = join(root, "home");
  mkdirSync(home, { recursive: true });

  const systemLibs = join(root, "system-libs");
  const systemFonts = join(root, "system-fonts");
  const systemFontFamilies = join(root, "system-font-families");
  mkdirSync(systemLibs);
  mkdirSync(systemFonts);
  mkdirSync(systemFontFamilies);

  if (systemRuntime) {
    for (const library of REQUIRED_LIBS)
      writeFileSync(join(systemLibs, library), "");
    writeFileSync(
      join(systemFonts, "fonts.conf"),
      "<fontconfig></fontconfig>\n",
    );
  }

  const prebaked = join(root, "prebaked-browsers");
  mkdirSync(prebaked);
  if (prebakedRevision) {
    writeChromium(prebaked, prebakedRevision, { readOnly: true });
  }

  const env = {
    ...process.env,
    HOME: home,
    CHROMIUM_LIBS_PREFIX: join(home, ".local", "chromium-libs"),
    CHROMIUM_APT_STATE: join(home, ".apt-user"),
    CHROMIUM_SYSTEM_LIB_DIRS: systemLibs,
    CHROMIUM_SYSTEM_FONTS: systemFonts,
    CHROMIUM_SYSTEM_FONT_DIRS: systemFontFamilies,
    CHROMIUM_BROWSER_DIRS: prebaked,
  };
  for (const name of ["LD_LIBRARY_PATH", "FONTCONFIG_FILE", "FONTCONFIG_PATH"])
    delete env[name];
  delete env.PLAYWRIGHT_BROWSERS_PATH;

  return { root, home, env, prebaked };
}

function run(fixture, args) {
  return spawnSync("bash", [SCRIPT, ...args], {
    cwd: REPO_ROOT,
    env: fixture.env,
    encoding: "utf8",
  });
}

afterEach(() => {
  while (fixtures.length) {
    const root = fixtures.pop();
    // Fixtures mark image-style roots read-only, so restore write permission first.
    spawnSync("chmod", ["-R", "u+w", root]);
    rmSync(root, { recursive: true, force: true });
  }
});

describe("Chromium runtime detection", () => {
  it("uses a system-wide runtime, downloads nothing and exports nothing", () => {
    const fixture = createFixture({ systemRuntime: true });

    const check = run(fixture, ["--check-libs"]);
    expect(check.status, check.stderr).toBe(0);
    expect(check.stdout).toMatch(/system-wide/);
    expect(check.stdout).not.toMatch(/objects and fonts/);

    const provision = run(fixture, []);
    expect(provision.status, provision.stderr).toBe(0);
    expect(provision.stdout).toMatch(/provided system-wide; skipping download/);
    // No prefix and no apt run: the whole point of preferring the system runtime.
    expect(existsSync(fixture.env.CHROMIUM_LIBS_PREFIX)).toBe(false);

    const env = run(fixture, ["--env"]);
    expect(env.status).toBe(0);
    expect(env.stdout).not.toMatch(/LD_LIBRARY_PATH/);
    expect(env.stdout).not.toMatch(/FONTCONFIG_FILE/);
  });

  it("keeps provisioning when the system runtime is incomplete", () => {
    const fixture = createFixture({ systemRuntime: false });

    const check = run(fixture, ["--check-libs"]);
    expect(check.status).toBe(1);
    expect(check.stderr).toMatch(/missing libnspr4\.so/);

    const env = run(fixture, ["--env"]);
    expect(env.status).toBe(0);
    expect(env.stdout).toMatch(/LD_LIBRARY_PATH/);
    expect(env.stdout).toMatch(/FONTCONFIG_FILE/);
  });

  it("uses a read-only prebaked root that holds the pinned revision", () => {
    const fixture = createFixture({
      systemRuntime: true,
      prebakedRevision: PINNED_REVISION,
    });

    const root = run(fixture, ["--browser-root"]);
    expect(root.status, root.stderr).toBe(0);
    expect(root.stdout.trim()).toBe(fixture.prebaked);

    const env = run(fixture, ["--env"]);
    expect(env.stdout).toMatch(
      new RegExp(`export PLAYWRIGHT_BROWSERS_PATH="${fixture.prebaked}"`),
    );

    const check = run(fixture, ["--check"]);
    expect(check.status, `${check.stdout}\n${check.stderr}`).toBe(0);
    // Count-agnostic: a host with a system Chrome legitimately adds another binary.
    expect(check.stdout).toMatch(
      /Chromium binaries link with 0 missing shared objects/,
    );
    expect(check.stdout).toContain(
      join(
        fixture.prebaked,
        `chromium-${PINNED_REVISION}`,
        "chrome-linux64",
        "chrome",
      ),
    );
    expect(check.stdout).toContain(`browser root: ${fixture.prebaked}`);
  });

  it("rejects a read-only prebaked root with a different revision", () => {
    const fixture = createFixture({
      systemRuntime: true,
      prebakedRevision: "9999",
    });

    const root = run(fixture, ["--browser-root"]);
    expect(root.status).toBe(1);
    expect(root.stderr).toMatch(/no Chromium at the pinned revision/);

    // A read-only root cannot be repaired in place, so it is ignored entirely and
    // nothing is exported; the install then targets the default cache instead.
    const env = run(fixture, ["--env"]);
    expect(env.stdout).not.toMatch(/PLAYWRIGHT_BROWSERS_PATH/);
    // And the strict check must not claim the wrong revision is launchable.
    const check = run(fixture, ["--check"]);
    expect(check.stdout).not.toContain(join(fixture.prebaked, "chromium-9999"));
  });

  it("skips installation only for a default cache that holds the pinned revision", () => {
    const fixture = createFixture({ systemRuntime: true });
    const cache = join(fixture.home, ".cache", "ms-playwright");
    mkdirSync(cache, { recursive: true });
    writeChromium(cache, PINNED_REVISION);

    const root = run(fixture, ["--browser-root"]);
    expect(root.status, root.stderr).toBe(0);
    expect(root.stdout.trim()).toBe(cache);

    // No prebaked root was chosen, so nothing needs exporting.
    const env = run(fixture, ["--env"]);
    expect(env.stdout).not.toMatch(/PLAYWRIGHT_BROWSERS_PATH/);
  });

  it("rejects a default cache left behind by a different Playwright revision", () => {
    const fixture = createFixture({ systemRuntime: true });
    const cache = join(fixture.home, ".cache", "ms-playwright");
    mkdirSync(cache, { recursive: true });
    writeChromium(cache, "9999");

    // Exit 1 is what makes `--install-browser` run the install that repairs the cache.
    const root = run(fixture, ["--browser-root"]);
    expect(root.status).toBe(1);
    expect(root.stderr).toMatch(/no Chromium at the pinned revision/);
  });

  it("reports the pinned revision for the install log", () => {
    const fixture = createFixture({ systemRuntime: true });

    // `--install-browser` labels what it reused or installed with this value, so it must
    // be the revision Playwright will actually run, not the newest directory on disk.
    const revision = run(fixture, ["--browser-revision"]);
    expect(revision.status, revision.stderr).toBe(0);
    expect(revision.stdout.trim()).toBe(PINNED_REVISION);
  });

  it("fails --browser-root when no Chromium is installed anywhere", () => {
    const fixture = createFixture({ systemRuntime: true });

    const root = run(fixture, ["--browser-root"]);
    expect(root.status).toBe(1);
    expect(root.stderr).toMatch(/no Chromium/);
    expect(root.stdout.trim()).toBe("");
  });

  it("drops stale library variables from an existing CLI config under a system runtime", () => {
    const fixture = createFixture({ systemRuntime: true });
    const configDirectory = join(fixture.home, ".playwright");
    mkdirSync(configDirectory, { recursive: true });
    const configFile = join(configDirectory, "cli.config.json");
    writeFileSync(
      configFile,
      JSON.stringify({
        browser: {
          browserName: "chromium",
          launchOptions: {
            channel: "chromium",
            env: {
              LD_LIBRARY_PATH: "/gone/prefix",
              FONTCONFIG_FILE: "/gone/fonts.conf",
            },
            viewport: { width: 800, height: 600 },
          },
        },
        keepMe: true,
      }),
    );

    const persist = run(fixture, ["--persist"]);
    expect(persist.status, persist.stderr).toBe(0);

    const config = JSON.parse(readFileSync(configFile, "utf8"));
    expect(config.keepMe).toBe(true);
    expect(config.browser.browserName).toBe("chromium");
    expect(config.browser.launchOptions.channel).toBe("chromium");
    expect(config.browser.launchOptions.viewport).toEqual({
      width: 800,
      height: 600,
    });
    expect(config.browser.launchOptions.env.LD_LIBRARY_PATH).toBeUndefined();
    expect(config.browser.launchOptions.env.FONTCONFIG_FILE).toBeUndefined();
    expect(
      config.browser.launchOptions.env.PLAYWRIGHT_BROWSERS_PATH,
    ).toBeUndefined();

    // The persisted env file must not reintroduce what the runtime no longer needs.
    const envFile = readFileSync(
      join(fixture.env.CHROMIUM_LIBS_PREFIX, "env.sh"),
      "utf8",
    );
    expect(envFile).not.toMatch(/LD_LIBRARY_PATH/);
  });
});
