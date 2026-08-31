import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = resolve(dirname(scriptPath), "..");
const examsDirectory = resolve(projectRoot, "exams");
const catalogPath = resolve(examsDirectory, "catalog.js");
const subjects = ["测绘综合能力", "测绘管理与法律法规", "测绘案例分析"];
const subjectOrder = new Map(subjects.map((subject, index) => [subject, index]));
const realPattern = /^((?:19|20)\d{2})$/u;

function parseExamFile(name) {
  if (!name.toLowerCase().endsWith(".html")) return null;

  const subject = subjects.find(item => name.startsWith(`${item}-`));
  if (!subject) return null;

  const suffix = name.slice(subject.length + 1, -5);
  const realMatch = suffix.match(realPattern);
  if (realMatch) {
    return { name, subject, kind: "real", year: Number(realMatch[1]) };
  }

  return suffix.includes("模拟") ? { name, subject, kind: "mock", year: 0 } : null;
}

export async function generateCatalog() {
  const entries = await readdir(examsDirectory, { withFileTypes: true });
  const files = entries
    .filter(entry => entry.isFile())
    .map(entry => parseExamFile(entry.name))
    .filter(Boolean)
    .sort((a, b) =>
      subjectOrder.get(a.subject) - subjectOrder.get(b.subject)
      || (a.kind === b.kind ? 0 : a.kind === "real" ? -1 : 1)
      || b.year - a.year
      || a.name.localeCompare(b.name, "zh-CN", { numeric: true })
    )
    .map(exam => exam.name);

  const content = `// 此文件由 scripts/generate-catalog.mjs 自动生成，请勿手动修改。\nwindow.CEHUISHI_EXAMS = ${JSON.stringify(files, null, 2)};\n`;
  let previousContent = "";

  try {
    previousContent = await readFile(catalogPath, "utf8");
  } catch {
    // 首次生成时文件尚不存在。
  }

  if (previousContent !== content) {
    await writeFile(catalogPath, content, "utf8");
  }

  return { changed: previousContent !== content, count: files.length, files };
}

if (process.argv[1] && resolve(process.argv[1]) === scriptPath) {
  const result = await generateCatalog();
  console.log(`题库索引已更新：${result.count} 套试卷`);
}
