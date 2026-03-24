const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function run(cmd) {
  return execSync(cmd, { stdio: ["pipe", "pipe", "ignore"] })
    .toString()
    .trim();
}

// Obtiene commits exclusivos de la rama actual PR respecto a base
function getExclusiveCommits(baseBranch) {
  // merge-base entre HEAD (rama del PR) y develop
  const mergeBase = run(`git merge-base origin/${baseBranch} HEAD`);
  console.log(`Ancestro común detectado: ${mergeBase}`);
  if (!mergeBase) return [];

  // commits que están en la rama del PR y no en develop
  const stdout = run(`git log ${mergeBase}..HEAD --no-merges --reverse --pretty=format:%H`);
  return stdout ? stdout.split("\n") : [];
}

function getCommitInfo(sha) {
  const message = run(`git log -1 --pretty=%B ${sha}`);
  const author = run(`git log -1 --pretty=%an ${sha}`);
  return { message, author };
}

async function main() {
  const { GITHUB_REPOSITORY, PR_BASE, PR_HEAD } = process.env;

  if (!PR_BASE || !PR_HEAD) {
    console.error("PR_BASE o PR_HEAD no definidos.");
    process.exit(1);
  }

  console.log(`Generando historial de commits exclusivos para la rama: ${PR_HEAD}`);

  // 🔹 Aquí usamos solo la rama actual del PR
  const commits = getExclusiveCommits(PR_BASE);
  console.log(`Commits detectados: ${commits.length}`);

  const safeBranch = PR_HEAD.replace(/[\/\\]/g, "-");
  const filePath = path.join(
    process.cwd(),
    "docs",
    "Historial",
    "Hechos",
    `${safeBranch}.md`
  );
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  let content =
    `# Historial de ${PR_HEAD}\n\n` +
    `| Tipo | Autor | Descripción | Commit |\n` +
    `|------|--------|-------------|--------|\n`;

  if (commits.length === 0) {
    content += "| - | - | No hay commits nuevos | - |\n";
  } else {
    for (const sha of commits) {
      const { message, author } = getCommitInfo(sha);
      const shortSha = sha.substring(0, 7);
      const typeMatch = message.match(/^(feat|fix|docs|refactor|test|chore)/i);
      const type = typeMatch ? typeMatch[1].toLowerCase() : "other";
      const shortMsg = message.split("\n")[0].replace(/\|/g, "\\|");
      content += `| ${type} | ${author} | ${shortMsg} | [${shortSha}](https://github.com/${GITHUB_REPOSITORY}/commit/${sha}) |\n`;
    }
  }

  fs.writeFileSync(filePath, content, "utf8");
  console.log(`Archivo generado correctamente: ${filePath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});