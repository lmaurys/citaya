// Lanzador de pruebas para Azure Pipelines (multiplataforma: agentes Linux, Windows o macOS).
//   node labs/azure-devops/pruebas.mjs unit       <dir-resultados>
//   node labs/azure-devops/pruebas.mjs aceptacion <dir-resultados>   (sirve dist/ en :8080 mientras prueba)
//   node labs/azure-devops/pruebas.mjs humo       <dir-resultados>   (usa BASE_URL y EXPECTED_SHA del entorno;
//                                                                     sin BASE_URL, sirve dist/ en :8080: producción simulada)
// Escribe la salida legible en consola y un JUnit XML para la pestaña "Tests" de la ejecución.
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const [tipo = "unit", dirResultados = "resultados"] = process.argv.slice(2);
const patrones = { unit: "test/unit/*.test.js", aceptacion: "test/aceptacion/*.test.js", humo: "test/humo/*.test.js" };
if (!patrones[tipo]) { console.error(`Tipo desconocido: ${tipo}`); process.exit(2); }
mkdirSync(dirResultados, { recursive: true });

const env = { ...process.env };
let servidor;
if (tipo === "aceptacion" || (tipo === "humo" && !process.env.BASE_URL)) {
  servidor = spawn(process.execPath, ["scripts/serve.js", "dist", "8080"], { stdio: "inherit" });
  env.BASE_URL = "http://localhost:8080";
  await new Promise(r => setTimeout(r, 1000));
}

const args = ["--test",
  "--test-reporter=spec", "--test-reporter-destination=stdout",
  "--test-reporter=junit", `--test-reporter-destination=${join(dirResultados, `${tipo}.xml`)}`,
  patrones[tipo]];
const pruebas = spawn(process.execPath, args, { stdio: "inherit", env });
pruebas.on("exit", codigo => {
  if (servidor) servidor.kill();
  process.exit(codigo ?? 1);
});
