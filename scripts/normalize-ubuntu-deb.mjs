import { execFile } from "node:child_process";
import { mkdtemp, readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const expectedDependencies = [
  "libwebkit2gtk-4.1-0 (>= 2.52)",
  "libgtk-3-0t64",
  "libayatana-appindicator3-1",
  "xwayland",
];

async function run(command, args) {
  await execFileAsync(command, args, { encoding: "utf8" });
}

async function findPackage(bundleDirectory) {
  const entries = await readdir(bundleDirectory, { withFileTypes: true });
  const packages = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".deb"))
    .map((entry) => join(bundleDirectory, entry.name));
  if (packages.length !== 1) {
    throw new Error(`expected exactly one .deb package in ${bundleDirectory}, found ${packages.length}`);
  }
  return packages[0];
}

function replaceDepends(control) {
  const expected = `Depends: ${expectedDependencies.join(", ")}`;
  const updated = control.replace(/^Depends:.*(?:\n [^\n]*)*/m, expected);
  if (updated === control) {
    throw new Error("generated Debian control file has no Depends field");
  }
  return updated;
}

async function normalize(packagePath) {
  const stagingDirectory = await mkdtemp(join(tmpdir(), "quota-float-deb-"));
  const rebuiltPath = join(dirname(packagePath), `.${basename(packagePath)}.normalized.deb`);
  try {
    await run("dpkg-deb", ["--raw-extract", packagePath, stagingDirectory]);
    await run("dpkg-deb", ["--control", packagePath, join(stagingDirectory, "DEBIAN")]);

    const controlPath = join(stagingDirectory, "DEBIAN", "control");
    const control = await readFile(controlPath, "utf8");
    await writeFile(controlPath, replaceDepends(control));

    await run("dpkg-deb", ["--build", "--root-owner-group", stagingDirectory, rebuiltPath]);
    await rename(rebuiltPath, packagePath);

    const { stdout } = await execFileAsync("dpkg-deb", ["--field", packagePath, "Depends"], {
      encoding: "utf8",
    });
    if (stdout.trim() !== expectedDependencies.join(", ")) {
      throw new Error("normalized Debian package has unexpected runtime dependencies");
    }
  } finally {
    await rm(stagingDirectory, { recursive: true, force: true });
    await rm(rebuiltPath, { force: true });
  }
}

const bundleDirectory = resolve(process.argv[2] ?? "src-tauri/target/release/bundle/deb");
const packagePath = await findPackage(bundleDirectory);
await normalize(packagePath);
console.log(`Normalized Ubuntu 26.04 dependencies in ${packagePath}`);
