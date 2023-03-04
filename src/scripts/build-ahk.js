/**
 * - Compiles src/ahk/index.ahk (which is the application entrypoint)
 *   into an executable and moves it to dist/ along with the web build output
 *   (index.html, main.js)
 *
 * - Assumes that `build-web` (see package.json) has been run previously
 *   (i.e. the web build exists)
 */

const fs = require("fs");
const child_process = require("child_process");
const path = require("path");
const os = require("os");

const root = path.resolve(__dirname + "/../../");
const tmpDir = os.tmpdir() + "/better-task-view/";

try {
  // make temporary directory inside dist/
  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true });
  }
  fs.mkdirSync(tmpDir, { recursive: true });

  fs.cpSync(root + "/src/ahk/", tmpDir + "/src/ahk/", { recursive: true });
  fs.cpSync(root + "/vendor/", tmpDir + "/vendor/", { recursive: true });
  fs.cpSync(root + "/dist/index.html", tmpDir + "/src/ahk/index.html");
  fs.cpSync(root + "/dist/main.js", tmpDir + "/src/ahk/main.js");
  fs.cpSync(root + "/docs/images/logo.ico", tmpDir + "/src/ahk/logo.ico");

  child_process.execSync(
    'C:\\"Program Files"\\AutoHotkey\\Compiler\\Ahk2EXE.exe /icon logo.ico /in ./index.ahk /out ./better-task-view.exe',
    { cwd: tmpDir + "/src/ahk/" }
  );

  fs.cpSync(
    tmpDir + "/src/ahk/better-task-view.exe",
    root + "/dist/better-task-view.exe"
  );
} catch (e) {
  console.error(e);
}

fs.rmSync(tmpDir, { recursive: true });
