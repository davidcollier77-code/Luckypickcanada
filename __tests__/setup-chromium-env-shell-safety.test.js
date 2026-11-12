import { afterEach, describe, expect, it } from "vitest";
import { createRequire } from "node:module";
import {
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

// The text `--env` prints is executed in three places: the wrapper
// (`eval "$(… --env)"`), the startup command (the same eval), and every later login
// shell (`. ~/.local/chromium-libs/env.sh` from ~/.profile). These tests push that text
// through a real shell and prove that HOME, CHROMIUM_LIBS_PREFIX,
// PLAYWRIGHT_BROWSERS_PATH and CHROMIUM_BROWSER_DIRS cannot smuggle a command into it,
// that a legitimate value still arrives unchanged (spaces, apostrophes and glob
// characters included), and that --persist writes files a login shell can source
// without running anything. A marker file is the canary: if a value were ever parsed as
// code, the shell would create it.
const REPO_ROOT = process.cwd();
const SCRIPT = join(REPO_ROOT, "scripts", "setup-chromium-libs.sh");
const require = createRequire(join(REPO_ROOT, "package.json"));

// Mirrors REQUIRED_LIBS in the script: --persist refuses an incomplete prefix.
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

// The revision this repository pins, read the way the script reads it. A prebaked root
// is only recognised when it holds it; an unresolvable pin accepts any revision.
const PINNED_REVISION = (() => {
  try {
    const { browsers } = require("playwright-core/browsers.json");
    return String(browsers.find((entry) => entry.name === "chromium")?.revision ?? "");
  } catch {
    return "";
  }
})();

// Each payload would run `touch <canary>` if the value were ever treated as shell text.
const HOSTILE_PAYLOADS = [
  ["command substitution", (canary) => `$(touch ${canary})`],
  ["backticks", (canary) => ["`", `touch ${canary}`, "`"].join("")],
  // Deliberately colon-free: CHROMIUM_BROWSER_DIRS is a colon-separated list, so a value
  // containing ':' is split there by design and cannot be one directory.
  ["double quotes", (canary) => `"; touch ${canary}; v="`],
  ["semicolon", (canary) => `; touch ${canary}`],
];

const fixtures = [];

function makeFixture() {
  const root = mkdtempSync(join(tmpdir(), "chromium-env-safety-"));
  fixtures.push(root);

  const home = join(root, "home");
  const systemLibs = join(root, "system-libs");
  const systemFonts = join(root, "system-fonts");
  const systemFontFamilies = join(root, "system-font-families");
  const browsers = join(root, "no-browsers");
  for (const directory of [home, systemLibs, systemFonts, systemFontFamilies, browsers]) {
    mkdirSync(directory, { recursive: true });
  }

  // Empty detection directories keep the script in prefix mode, so it prints the
  // library and font exports instead of taking the system-runtime shortcut.
  const env = {
    ...process.env,
    HOME: home,
    CHROMIUM_LIBS_PREFIX: join(home, ".local", "chromium-libs"),
    CHROMIUM_APT_STATE: join(home, ".apt-user"),
    CHROMIUM_SYSTEM_LIB_DIRS: systemLibs,
    CHROMIUM_SYSTEM_FONTS: systemFonts,
    CHROMIUM_SYSTEM_FONT_DIRS: systemFontFamilies,
    CHROMIUM_BROWSER_DIRS: browsers,
  };
  for (const name of ["LD_LIBRARY_PATH", "FONTCONFIG_FILE", "FONTCONFIG_PATH"]) {
    delete env[name];
  }
  delete env.PLAYWRIGHT_BROWSERS_PATH;

  return { root, home, env };
}

function run(fixture, args, overrides = {}) {
  return spawnSync("bash", [SCRIPT, ...args], {
    cwd: REPO_ROOT,
    env: { ...fixture.env, ...overrides },
    encoding: "utf8",
  });
}

// Apply the generated text exactly as the wrapper and ~/.profile do, then report the
// four variables it exported. `|| exit 99` surfaces a syntax error instead of hiding it
// behind the printf that follows.
const APPLY = [
  'eval "$(cat)" || exit 99',
  'printf "%s\\n" "${LD_LIBRARY_PATH-}" "${FONTCONFIG_FILE-}" "${FONTCONFIG_PATH-}" "${PLAYWRIGHT_BROWSERS_PATH-}"',
].join("\n");

function applyGenerated(shell, text, env) {
  const result = spawnSync(shell, ["-c", APPLY], {
    input: text,
    encoding: "utf8",
    env,
  });
  const [libraryPath = "", fontConfigFile = "", fontConfigPath = "", browsersPath = ""] =
    (result.stdout ?? "").split("\n");
  return {
    status: result.status,
    stderr: result.stderr,
    libraryPath,
    fontConfigFile,
    fontConfigPath,
    browsersPath,
  };
}

function expectedLibraryPath(prefix) {
  return [
    join(prefix, "usr", "lib", "x86_64-linux-gnu"),
    join(prefix, "lib", "x86_64-linux-gnu"),
    join(prefix, "usr", "lib"),
    join(prefix, "lib"),
  ].join(":");
}

// A prefix that already holds every object --persist checks for, so the write path is
// exercised without downloading anything.
function provisionFakePrefix(prefix) {
  const libraryDirectory = join(prefix, "usr", "lib", "x86_64-linux-gnu");
  mkdirSync(libraryDirectory, { recursive: true });
  mkdirSync(join(prefix, "lib", "x86_64-linux-gnu"), { recursive: true });
  for (const library of REQUIRED_LIBS) {
    writeFileSync(join(libraryDirectory, library), "");
  }
  mkdirSync(join(prefix, "etc", "fonts", "conf.d"), { recursive: true });
  writeFileSync(join(prefix, "etc", "fonts", "lpc-fonts.conf"), "<fontconfig></fontconfig>\n");
  mkdirSync(join(prefix, "usr", "share", "fonts"), { recursive: true });
}

function provisionPrebakedRoot(root) {
  const binaryDirectory = join(root, `chromium-${PINNED_REVISION || "0"}`, "chrome-linux64");
  mkdirSync(binaryDirectory, { recursive: true });
  writeFileSync(join(binaryDirectory, "chrome"), "#!/bin/sh\nexit 0\n", { mode: 0o755 });
}

afterEach(() => {
  while (fixtures.length) {
    rmSync(fixtures.pop(), { recursive: true, force: true });
  }
});

describe("generated Chromium environment", () => {
  for (const [label, buildPayload] of HOSTILE_PAYLOADS) {
    it(`never executes a ${label} in CHROMIUM_LIBS_PREFIX`, () => {
      const fixture = makeFixture();
      const canary = join(fixture.root, "canary-prefix");
      const prefix = `${fixture.root}/hostile/${buildPayload(canary)}/prefix`;

      const env = run(fixture, ["--env"], { CHROMIUM_LIBS_PREFIX: prefix });
      expect(env.status, env.stderr).toBe(0);

      const applied = applyGenerated("bash", env.stdout, fixture.env);
      // A syntax error would also prevent execution, so require a clean apply.
      expect(applied.status, applied.stderr).toBe(0);
      expect(existsSync(canary)).toBe(false);

      // The value still arrives intact: quoting must not mangle a legitimate path.
      expect(applied.libraryPath).toBe(expectedLibraryPath(prefix));
      expect(applied.fontConfigPath).toBe(join(prefix, "etc", "fonts"));
      expect(applied.fontConfigFile).toBe(join(prefix, "etc", "fonts", "lpc-fonts.conf"));
    });

    it(`never executes a ${label} in HOME`, () => {
      const fixture = makeFixture();
      const canary = join(fixture.root, "canary-home");
      const home = `${fixture.root}/hostile/${buildPayload(canary)}`;

      // HOME alone drives the default prefix: an empty override is what the script
      // reads as unset (`${CHROMIUM_LIBS_PREFIX:-…}`), so the default applies.
      const env = { ...fixture.env, HOME: home, CHROMIUM_LIBS_PREFIX: "" };
      const generated = run(fixture, ["--env"], env);
      expect(generated.status, generated.stderr).toBe(0);

      const applied = applyGenerated("bash", generated.stdout, env);
      expect(applied.status, applied.stderr).toBe(0);
      expect(existsSync(canary)).toBe(false);
      expect(applied.fontConfigPath).toBe(
        join(home, ".local", "chromium-libs", "etc", "fonts"),
      );
    });

    it(`never executes a ${label} in PLAYWRIGHT_BROWSERS_PATH`, () => {
      const fixture = makeFixture();
      const canary = join(fixture.root, "canary-browsers");
      const root = `${fixture.root}/hostile/${buildPayload(canary)}/browsers`;
      provisionPrebakedRoot(root);

      const env = run(fixture, ["--env"], { PLAYWRIGHT_BROWSERS_PATH: root });
      expect(env.status, env.stderr).toBe(0);

      const applied = applyGenerated("bash", env.stdout, fixture.env);
      expect(applied.status, applied.stderr).toBe(0);
      expect(existsSync(canary)).toBe(false);
      expect(applied.browsersPath).toBe(root);
    });

    it(`never executes a ${label} in CHROMIUM_BROWSER_DIRS`, () => {
      const fixture = makeFixture();
      const canary = join(fixture.root, "canary-browser-dirs");
      const root = `${fixture.root}/hostile/${buildPayload(canary)}/browsers`;
      provisionPrebakedRoot(root);

      const env = run(fixture, ["--env"], { CHROMIUM_BROWSER_DIRS: root });
      expect(env.status, env.stderr).toBe(0);

      const applied = applyGenerated("bash", env.stdout, fixture.env);
      expect(applied.status, applied.stderr).toBe(0);
      expect(existsSync(canary)).toBe(false);
      expect(applied.browsersPath).toBe(root);
    });
  }

  it("keeps spaces and other ordinary path characters intact under sh and bash", () => {
    const fixture = makeFixture();
    const prefix = `${fixture.root}/a legit prefix (v2) #1 + more`;

    const env = run(fixture, ["--env"], { CHROMIUM_LIBS_PREFIX: prefix });
    expect(env.status, env.stderr).toBe(0);

    for (const shell of ["bash", "sh"]) {
      const applied = applyGenerated(shell, env.stdout, fixture.env);
      expect(applied.status, `${shell}: ${applied.stderr}`).toBe(0);
      expect(applied.libraryPath).toBe(expectedLibraryPath(prefix));
      expect(applied.fontConfigPath).toBe(join(prefix, "etc", "fonts"));
    }
  });

  it("keeps an apostrophe in a path intact", () => {
    const fixture = makeFixture();
    const prefix = `${fixture.root}/o'brien/chromium-libs`;

    const env = run(fixture, ["--env"], { CHROMIUM_LIBS_PREFIX: prefix });
    expect(env.status, env.stderr).toBe(0);
    expect(env.stdout).toContain("'\\''");

    for (const shell of ["bash", "sh"]) {
      const applied = applyGenerated(shell, env.stdout, fixture.env);
      expect(applied.status, `${shell}: ${applied.stderr}`).toBe(0);
      expect(applied.libraryPath).toBe(expectedLibraryPath(prefix));
    }
  });

  it("parses as POSIX shell and stays idempotent when applied twice", () => {
    const fixture = makeFixture();
    const prefix = join(fixture.root, "plain prefix");

    const env = run(fixture, ["--env"], { CHROMIUM_LIBS_PREFIX: prefix });
    expect(env.status, env.stderr).toBe(0);
    for (const shell of ["bash", "sh"]) {
      const syntax = spawnSync(shell, ["-n"], { input: env.stdout, encoding: "utf8" });
      expect(syntax.status, `${shell}: ${syntax.stderr}`).toBe(0);
    }

    // Sourcing the block from two profiles must not grow LD_LIBRARY_PATH twice: a
    // prepended duplicate would put a second copy of four directories on the search path.
    const twice = spawnSync(
      "bash",
      [
        "-c",
        'eval "$1"; first=${LD_LIBRARY_PATH-}; eval "$1"; printf "%s\\n%s\\n" "$first" "${LD_LIBRARY_PATH-}"',
        "bash",
        env.stdout,
      ],
      { encoding: "utf8", env: fixture.env },
    );
    expect(twice.status, twice.stderr).toBe(0);
    const [once, again] = twice.stdout.trim().split("\n");
    expect(once).toBe(expectedLibraryPath(prefix));
    expect(again).toBe(once);
  });

  it("treats a glob character in the prefix literally", () => {
    const fixture = makeFixture();
    const prefix = `${fixture.root}/p*9`;
    const unrelated = join(fixture.root, "pZZZ9", "usr", "lib");

    const env = run(fixture, ["--env"], { CHROMIUM_LIBS_PREFIX: prefix });
    expect(env.status, env.stderr).toBe(0);

    // The unrelated path only matches the prefix if the quoted word is turned back into
    // a pattern, which would hide the prefix from the search path entirely.
    const applied = applyGenerated("bash", env.stdout, {
      ...fixture.env,
      LD_LIBRARY_PATH: unrelated,
    });
    expect(applied.status, applied.stderr).toBe(0);
    expect(applied.libraryPath).toBe(`${expectedLibraryPath(prefix)}:${unrelated}`);
  });
});

describe("persisted Chromium environment", () => {
  it("writes env.sh and the profile blocks as quoted text, and sourcing them is inert", () => {
    const fixture = makeFixture();
    const canary = join(fixture.root, "canary-persist");
    const prefix = `${fixture.root}/hostile/$(touch ${canary})/chromium-libs`;
    provisionFakePrefix(prefix);

    const persist = run(fixture, ["--persist"], { CHROMIUM_LIBS_PREFIX: prefix });
    expect(persist.status, persist.stderr).toBe(0);
    expect(existsSync(canary)).toBe(false);

    // The wiring --persist exists for is still there, in both profile files.
    for (const profile of [".profile", ".bashrc"]) {
      const text = readFileSync(join(fixture.home, profile), "utf8");
      expect(text).toContain("# >>> luckypick chromium runtime >>>");
      expect(text).toContain("env.sh");
    }

    const envFile = readFileSync(join(prefix, "env.sh"), "utf8");
    const syntax = spawnSync("sh", ["-n"], { input: envFile, encoding: "utf8" });
    expect(syntax.status, syntax.stderr).toBe(0);

    // A login shell sources the profile, which sources env.sh. Neither may run the value.
    for (const [shell, file] of [
      ["sh", join(fixture.home, ".profile")],
      ["bash", join(fixture.home, ".bashrc")],
    ]) {
      const sourced = spawnSync(
        shell,
        [
          "-c",
          '. "$1"; printf "%s\\n%s\\n" "${LD_LIBRARY_PATH-}" "${FONTCONFIG_FILE-}"',
          shell,
          file,
        ],
        {
          encoding: "utf8",
          env: {
            ...fixture.env,
            HOME: fixture.home,
            PATH: process.env.PATH ?? "/usr/bin:/bin",
          },
        },
      );
      expect(sourced.status, `${shell}: ${sourced.stderr}`).toBe(0);
      expect(existsSync(canary)).toBe(false);
      const [libraryPath, fontConfigFile] = sourced.stdout.trim().split("\n");
      expect(libraryPath).toBe(expectedLibraryPath(prefix));
      expect(fontConfigFile).toBe(join(prefix, "etc", "fonts", "lpc-fonts.conf"));
    }
  });

  it("persists an ordinary prefix unchanged", () => {
    const fixture = makeFixture();
    const prefix = join(fixture.home, ".local", "chromium-libs");
    provisionFakePrefix(prefix);

    const persist = run(fixture, ["--persist"]);
    expect(persist.status, persist.stderr).toBe(0);

    const envFile = readFileSync(join(prefix, "env.sh"), "utf8");
    expect(envFile).toContain(`export FONTCONFIG_PATH='${join(prefix, "etc", "fonts")}'`);

    const sourced = spawnSync(
      "sh",
      ["-c", '. "$1"; printf "%s\\n" "${LD_LIBRARY_PATH-}"', "sh", join(prefix, "env.sh")],
      { encoding: "utf8", env: { ...fixture.env, HOME: fixture.home } },
    );
    expect(sourced.status, sourced.stderr).toBe(0);
    expect(sourced.stdout.trim()).toBe(expectedLibraryPath(prefix));
  });
});
