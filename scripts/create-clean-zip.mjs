import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const sourceDir = "G:/Placement_Portal";
const stagingDir = "C:/Users/User/.gemini/antigravity-ide/brain/1d8b4aec-66c8-4f79-b593-a1cb4bb0e438/scratch/Placement_Portal_staging";
const zipOutput = "G:/Placement_Portal.zip";

// Clean staging directory
if (fs.existsSync(stagingDir)) {
  fs.rmSync(stagingDir, { recursive: true, force: true });
}
fs.mkdirSync(stagingDir, { recursive: true });

const excludeDirs = new Set(["node_modules", ".next", ".git", ".vercel", "coverage", "out"]);
const excludeFiles = new Set(["tsconfig.tsbuildinfo", "Placement_Portal.zip", ".env.local", ".env"]);

function copyRecursive(src, dest) {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    const dirName = path.basename(src);
    if (excludeDirs.has(dirName)) return;
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const children = fs.readdirSync(src);
    for (const child of children) {
      copyRecursive(path.join(src, child), path.join(dest, child));
    }
  } else if (stats.isFile()) {
    const fileName = path.basename(src);
    if (excludeFiles.has(fileName) || fileName.endsWith(".log")) return;
    const parentDir = path.dirname(dest);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
  }
}

console.log("Copying clean files to staging directory...");
copyRecursive(sourceDir, stagingDir);

if (fs.existsSync(zipOutput)) {
  fs.rmSync(zipOutput, { force: true });
}

console.log("Compressing clean archive using PowerShell Compress-Archive...");
const psCommand = `powershell -NoProfile -Command "Compress-Archive -Path '${stagingDir}\\*' -DestinationPath '${zipOutput}' -CompressionLevel Optimal -Force"`;
execSync(psCommand, { stdio: "inherit" });

// Clean staging directory
fs.rmSync(stagingDir, { recursive: true, force: true });

const zipStats = fs.statSync(zipOutput);
console.log(`\nSUCCESS: Created clean archive at ${zipOutput}`);
console.log(`Size: ${(zipStats.size / (1024 * 1024)).toFixed(2)} MB (${zipStats.size.toLocaleString()} bytes)`);
