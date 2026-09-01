import { execFile } from "node:child_process";
import { lstat, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative, resolve, sep } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const expectedDependencies = [
  "libwebkit2gtk-4.1-0 (>= 2.52)",
  "libgtk-3-0t64",
  "libayatana-appindicator3-1",
  "gnome-shell (>= 48)",
];
const requiredFiles = [
  "usr/share/gnome-shell/extensions/quota-float-anchor@quotafloat.app/metadata.json",
  "usr/share/gnome-shell/extensions/quota-float-anchor@quotafloat.app/extension.js",
  "usr/share/gnome-shell/extensions/quota-float-anchor@quotafloat.app/anchor.js",
];
const forbiddenPath = /(^|\/)(?:\.env(?:\.[^/]*)?|auth\.json|credentials\.json|token\.json|target|screenshots?|.*\.log)(?:\/|$)/i;
const highConfidenceSecret = /(?:sk-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})/;

async function field(packagePath, name) {
  const { stdout } = await execFileAsync("dpkg-deb", ["--field", packagePath, name], {
    encoding: "utf8",
  });
  return stdout.trim();
}

async function findPackage(bundleDirectory, expectedVersion) {
  const entries = await readdir(bundleDirectory, { withFileTypes: true });
  const packages = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".deb"))
    .map((entry) => join(bundleDirectory, entry.name));
  const matching = [];
  for (const packagePath of packages) {
    if (await field(packagePath, "Version") === expectedVersion) matching.push(packagePath);
  }
  if (matching.length !== 1) {
    throw new Error(
      `expected exactly one version ${expectedVersion} .deb package in ${bundleDirectory}, found ${matching.length}`,
    );
  }
  return matching[0];
}

async function walkFiles(root, directory = root) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walkFiles(root, path));
    else if (entry.isFile()) files.push(path);
    else if (entry.isSymbolicLink()) {
      const details = await lstat(path);
      if (details.isFile()) files.push(path);
    }
  }
  return files;
}

function pathNeedles() {
  const candidates = [process.env.GITHUB_WORKSPACE, process.env.HOME, process.cwd()]
    .filter((value) => typeof value === "string" && value.length >= 5);
  return [...new Set(candidates.flatMap((value) => [value, value.replaceAll("\\", "/")]))];
}

async function scanExtractedTree(stagingDirectory) {
  const files = await walkFiles(stagingDirectory);
  for (const path of files) {
    const packagedPath = relative(stagingDirectory, path).split(sep).join("/");
    if (forbiddenPath.test(packagedPath)) {
      throw new Error(`forbidden path in Debian package: ${packagedPath}`);
    }
  }

  const needles = pathNeedles();
  for (const path of files) {
    const packagedPath = relative(stagingDirectory, path).split(sep).join("/");
    const contents = await readFile(path);
    const utf8 = contents.toString("utf8");
    const utf16 = contents.toString("utf16le");
    if (highConfidenceSecret.test(utf8) || highConfidenceSecret.test(utf16)) {
      throw new Error(`high-confidence secret pattern in Debian package file: ${packagedPath}`);
    }
    for (const needle of needles) {
      if (utf8.includes(needle) || utf16.includes(needle)) {
        throw new Error(`local build path found in Debian package file: ${packagedPath}`);
      }
    }
  }
}

const bundleDirectory = resolve(process.argv[2] ?? "src-tauri/target/release/bundle/deb");
const packageManifest = JSON.parse(await readFile(resolve("package.json"), "utf8"));
const expectedVersion = process.argv[3] ?? packageManifest.version;
const packagePath = await findPackage(bundleDirectory, expectedVersion);

if (await field(packagePath, "Architecture") !== "amd64") {
  throw new Error("Ubuntu Debian package must target amd64");
}
const dependencies = await field(packagePath, "Depends");
for (const dependency of expectedDependencies) {
  if (!dependencies.split(", ").includes(dependency)) {
    throw new Error(`Debian package is missing dependency: ${dependency}`);
  }
}

const stagingDirectory = await mkdtemp(join(tmpdir(), "quota-float-deb-verify-"));
try {
  await execFileAsync("dpkg-deb", ["--raw-extract", packagePath, stagingDirectory]);
  for (const requiredFile of requiredFiles) {
    await lstat(join(stagingDirectory, requiredFile));
  }
  await scanExtractedTree(stagingDirectory);
} finally {
  await rm(stagingDirectory, { recursive: true, force: true });
}

console.log(`Verified unpacked Ubuntu package ${packagePath}`);
