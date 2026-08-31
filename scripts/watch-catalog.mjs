import { watch } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { generateCatalog } from "./generate-catalog.mjs";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const examsDirectory = resolve(projectRoot, "exams");
let updateTimer;

async function updateCatalog() {
  try {
    const result = await generateCatalog();
    console.log(`题库索引已更新：${result.count} 套试卷`);
  } catch (error) {
    console.error("题库索引更新失败：", error.message);
  }
}

console.log("开始监听题库目录");
await updateCatalog();
console.log("题库监听已就绪");

const watcher = watch(examsDirectory, (_eventType, fileName) => {
  if (!fileName || !fileName.toLowerCase().endsWith(".html")) return;

  clearTimeout(updateTimer);
  updateTimer = setTimeout(updateCatalog, 120);
});

function stop() {
  clearTimeout(updateTimer);
  watcher.close();
  process.exit(0);
}

process.on("SIGINT", stop);
process.on("SIGTERM", stop);
