import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = resolve(dirname(scriptPath), "..");
const examsDirectory = resolve(projectRoot, "exams");
const catalogPath = resolve(examsDirectory, "catalog.js");
const subjects = ["测绘综合能力", "测绘管理与法律法规", "测绘案例分析"];
const subjectOrder = new Map(subjects.map((subject, index) => [subject, index]));
const filePattern = /^(测绘综合能力|测绘管理与法律法规|测绘案例分析)-((?:19|20)\d{2})\.html$/u;

export async function generateCatalog() {
  const entries = await readdir(examsDirectory, { withFileTypes: true });
  const files = entries
    .filter(entry => entry.isFile() && filePattern.test(entry.name))
    .map(entry => {
      const match = entry.name.match(filePattern);
      return { name: entry.name, subject: match[1], year: Number(match[2]) };
    })
    .sort((a, b) => subjectOrder.get(a.subject) - subjectOrder.get(b.subject) || b.year - a.year)
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
  console.log(`题库索引已更新：${result.count} 套真题`);
}
