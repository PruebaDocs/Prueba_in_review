const fs = require("fs");
const path = require("path");

async function main() {
  const event = JSON.parse(
    fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf8")
  );

  const pr = event.pull_request;

  if (!pr.merged) {
    console.log("PR no mergeado, no se hace nada.");
    return;
  }

  const verifier = pr.merged_by?.login || "unknown";
  const body = pr.body || "";

  // Intentar extraer la versión desde ## 🚀 Versión
  let versionMatch = body.match(/## 🚀 Versión\s*\n\s*(v[0-9a-zA-Z\.\-_]+)/i);
  let version = versionMatch ? versionMatch[1].trim() : `v${Date.now()}`;

  const date = new Date().toISOString().split("T")[0];

  // 1. Actualizar Main.md
  const mainPath = path.join(process.cwd(), "docs", "Historial", "Main.md");

  let mainContent = "";
  if (fs.existsSync(mainPath)) {
    mainContent = fs.readFileSync(mainPath, "utf8");
  } else {
    mainContent =
      `# Historial de Main\n\n` +
      `| Versión | Fecha | Verificador |\n` +
      `|---------|--------|-------------|\n`;
  }

  const newRow = `| ${version} | ${date} | ${verifier} |`;

  if (!mainContent.includes(newRow)) {
    mainContent += `${newRow}\n`;
    fs.writeFileSync(mainPath, mainContent);
    console.log(`Fila añadida a Main.md con versión: ${version}`);
  } else {
    console.log(`La fila con versión ${version} ya existe en Main.md`);
  }

  // 2. Añadir separador en Develop.md
  const developPath = path.join(process.cwd(), "docs", "Historial", "Develop.md");

  if (fs.existsSync(developPath)) {
    let developContent = fs.readFileSync(developPath, "utf8");
    const separator = `| --- Versión ${version} (${date}) --- |\n`;

    if (!developContent.includes(separator)) {
      developContent += separator;
      fs.writeFileSync(developPath, developContent);
      console.log(`Separador añadido en Develop.md para versión: ${version}`);
    } else {
      console.log(`Separador para versión ${version} ya existe en Develop.md`);
    }
  }

  console.log("Main.md y Develop.md actualizados correctamente");
}

main().catch(console.error);