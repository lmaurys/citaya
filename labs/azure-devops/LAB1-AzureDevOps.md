# LAB 1 (versión Azure DevOps) · Del backlog al primer cambio con CI

**Curso Estrategia DevOps · Día 1 · Módulos 1 y 2**

> Es la versión **Azure DevOps** del [LAB 1 de GitHub](../LAB1.md): el mismo caso, los mismos objetivos y el mismo código, pero con Azure Boards, Azure Repos y Azure Pipelines.

Eres parte del equipo de **CitaYa**, la cita previa de la sede electrónica del Ayuntamiento de Villaverde del Río. El ciudadano puede reservar cita, pero **no puede cancelarla**: llama por teléfono, la oficina se colapsa y los huecos quedan vacíos. Vas a llevar esa necesidad desde el backlog hasta `main`.

| Lo que haces | Lo que estás aplicando |
|---|---|
| Tablero de Azure Boards con límites WIP y definición de hecho por columna | Gestión visual, flujo, WIP, JKK (2.2) |
| Historias de usuario, de pruebas y de operaciones | Requisitos completos, no solo los del usuario final (2.4) |
| `ops/slo.yaml` | SLI, SLO, SLA y error budget (2.4) |
| Política de rama con *Build validation* | Calidad integrada en el proceso; las Tres Maneras (1.3) |
| PR en rojo → verde | Feedback rápido; parar la línea |

**Duración orientativa:** 60-75 min. El enunciado es autosuficiente: si no terminas en clase, acábalo después.
**Necesitas:** un navegador y una organización de Azure DevOps (`https://dev.azure.com/<organización>`) donde puedas crear un proyecto. Puede ser la de tu empresa o una personal gratuita: entra en https://dev.azure.com con una cuenta Microsoft y pulsa **Start free**.

> ### ⚠️ Antes de empezar: agentes para ejecutar pipelines
> Las organizaciones **nuevas** de Azure DevOps no traen agentes hospedados gratuitos hasta que se solicitan con el formulario de *free grant* de Microsoft, y la respuesta tarda unos días hábiles. Comprueba si tu organización los tiene en **Organization settings → Parallel jobs**: necesitas al menos 1 en *Microsoft-hosted*.
> - **Tienes al menos 1:** sigue el lab tal cual.
> - **Tienes 0:** puedes registrar **tu equipo como agente** (**Project settings → Agent pools → Default → New agent** y sigue las instrucciones de tu sistema operativo; necesitas Node.js 22) y ejecutar los pipelines con el parámetro **agente = propio**. Si tampoco puedes, haz los pasos de Boards, Repos y políticas, y sigue la demostración del formador para los pipelines.

---

## Paso 1 · Proyecto y repositorio (5 min)

1. **New project** → nombre `CitaYa` → **Visibility: Private** → **Advanced → Work item process: Agile** → **Create**.
2. **Repos** → como el repositorio está vacío, pulsa **Import a repository** → *Clone URL*: `https://github.com/lmaurys/citaya.git` → **Import**.
3. Comprueba que ves `src/`, `test/`, `labs/azure-devops/`...

## Paso 2 · Ver la etapa de commit (5 min)

1. **Pipelines → Create Pipeline → Azure Repos Git → CitaYa → Existing Azure Pipelines YAML file**.
2. Rama `main`, ruta **`/labs/azure-devops/ci.yml`** → **Continue → Run**. Si no tienes agentes hospedados, elige antes `agente = propio` en **Run pipeline**.
3. Cuando termine: menú **⋯** del pipeline → **Rename/move** → nombre **`ci`**. Lo usarás en el paso 6.
4. Abre la ejecución: mira los pasos *Lint* y *Pruebas unitarias*, y la pestaña **Tests**, que tiene las 10 pruebas con su resultado.

**Pregunta para el chat:** ¿cuánto tarda hoy en tu organización desde que alguien hace commit hasta que sabe si ha roto algo?

## Paso 3 · Tablero de flujo con límites WIP (10 min)

1. **Boards → Boards** → tablero **CitaYa Team Stories** → ⚙️ **Configure board settings → Columns**.
2. Deja estas columnas con su estado:

| Columna | Estado | WIP limit | Split column | Definition of done |
|---|---|---|---|---|
| Backlog | New | — | — | — |
| Listo | New | 3 | — | *Tiene criterios de aceptación y HP enlazada* |
| En curso | Active | **2** | ✅ (Doing / Done) | *Pruebas en verde en mi rama* |
| En revisión | Resolved | **2** | — | *PR con Build validation en verde* |
| Hecho | Closed | — | — | — |

3. **Save**.

La **Definition of done** de cada columna es Ji-Kotei-Kanketsu hecho tablero: cada etapa sabe qué significa "bien hecho" antes de pasar el trabajo a la siguiente.

## Paso 4 · Tres historias, no una (10 min)

En **Boards → Work items → New Work Item → User Story** crea tres historias:

| Título | Etiqueta (Tags) | Descripción y criterios |
|---|---|---|
| `HU-01 · Cancelar mi cita` | `historia-usuario` | *Como* ciudadano con cita, *quiero* cancelarla desde la web, *para* liberar el hueco si no puedo ir. En **Acceptance Criteria**: se cancela con el localizador; solo con ≥ 2 h de antelación; el hueco vuelve a quedar libre. |
| `HP-01 · Escenarios de cancelación` | `historia-pruebas` | Al menos 3 escenarios **Dado / Cuando / Entonces**: con antelación, fuera de plazo (< 2 h) y localizador inexistente. Dónde quedará automatizada: `test/unit/cancelacion.test.js`. |
| `HO-01 · Contar cancelaciones` | `historia-operaciones` | *Como* responsable de operación, *quiero* saber cuántas citas se cancelan, *para* reasignar ventanillas. SLO afectado: disponibilidad 99,5 %. |

En **HP-01**, ve a **Related Work → Add link → Related** y enlaza la HU-01. Mueve HU-01 y HP-01 a **Listo**.

> Las historias de pruebas y de operaciones son las que más se olvidan. Si las necesidades de quien opera el servicio no entran en el backlog, acaban apareciendo como incidentes.

## Paso 5 · El SLO y el error budget (10 min)

**Repos → Files → `ops/slo.yaml` → Edit** → completa los `???` → **Commit** directamente en `main` (todavía no está protegida).

- Define el **SLI**: qué mides y de dónde sale el dato.
- Calcula el **error budget** de un SLO del 99,5 % en 30 días.
- Escribe la **política** cuando se agota.

<details>
<summary>Comprueba tu cálculo</summary>

30 días × 24 h × 60 min = 43 200 min · 0,5 % de 43 200 = **216 minutos al mes**.
</details>

## Paso 6 · Proteger `main` (5 min)

**Repos → Branches** → en `main`, menú **⋯ → Branch policies**:

- **Build Validation → +** → *Build pipeline*: **`ci`** · *Trigger*: Automatic · *Policy requirement*: **Required** · *Display name*: `pruebas` → **Save**.
- Opcional: **Check for linked work items → Required**, para que todo cambio esté ligado a un elemento del backlog.

En Azure Repos, en cuanto `main` tiene **cualquier** política, ya no se puede hacer push directo: todo entra por pull request. **La calidad deja de depender de la buena voluntad.**

## Paso 7 · Primero la prueba: parar la línea (10 min)

1. Mueve **HU-01** a **En curso**.
2. **Repos → Files → `test/unit/cancelacion.test.js` → Edit** → en la línea `describe.skip("HU-01 · cancelar mi cita"` borra **`.skip`**.
3. **Commit** → marca **Create a new branch** con el nombre `hu-01-cancelar-cita` y marca **Create a pull request** → **Commit**.
4. En el formulario del PR: destino `main`. En **Work items to link**, añade **HU-01** → **Create**.
5. La política lanza `ci`: **se pone en rojo** y el botón **Complete** queda bloqueado.

Es lo que buscábamos. Las pruebas de la historia de pruebas ya existen y la funcionalidad todavía no. La línea se para y el defecto no avanza.

## Paso 8 · Implementar y llevarlo a `main` (15 min)

1. **Repos → Files** → selector de rama: **`hu-01-cancelar-cita`** → `src/citas.js` → **Edit**.
2. Implementa la función `cancelar()`. Las reglas están en el comentario que tiene encima.
3. **Commit** en la **misma rama**. La política vuelve a ejecutar `ci` sola.
4. Cuando `pruebas` esté en verde: **Complete** → *Merge type*: **Merge (no fast forward)** → marca **Complete associated work items after merging** → **Complete merge**.
5. La HU-01 pasa a *Closed* y aparece en **Hecho**.

<details>
<summary>Pista (inténtalo antes de mirar)</summary>

- Busca la cita con `agenda.citas.find(c => c.localizador === localizador)`.
- Para las horas que faltan: `(momentoDeCita(cita.fecha, cita.hora) - ahora) / 3_600_000`.
- Para lanzar un error de negocio: `throw new ErrorCita("CODIGO", "mensaje")`.
</details>

<details>
<summary>Solución</summary>

```js
export function cancelar(agenda, localizador, ahora = new Date()) {
  const cita = agenda.citas.find(c => c.localizador === localizador);
  if (!cita) throw new ErrorCita("CITA_NO_ENCONTRADA", `No existe la cita ${localizador}`);
  if (cita.estado !== "activa") throw new ErrorCita("CITA_NO_ACTIVA", "La cita ya no está activa");
  const horasQueFaltan = (momentoDeCita(cita.fecha, cita.hora) - ahora) / 3_600_000;
  if (horasQueFaltan < ANTELACION_MIN_CANCELACION_H) {
    throw new ErrorCita("FUERA_DE_PLAZO", `Solo se puede cancelar con ${ANTELACION_MIN_CANCELACION_H} h de antelación`);
  }
  cita.estado = "cancelada";
  cita.canceladaEn = ahora.toISOString();
  return cita;
}
```
</details>

## Paso 9 · Retos (si te sobra tiempo, o en casa)

1. **Lead time:** en la HU-01, pestaña **History**, ¿cuánto pasó entre *New* y *Closed*? Mira también **Boards → Analytics → Cumulative Flow Diagram**.
2. **Caso límite:** en `cancelacion.test.js` hay un `it` comentado. Escríbelo: ¿se puede cancelar **exactamente** 2 h antes? Hazlo con un PR.
3. **HO-01:** añade `canceladas` al resultado de `estadisticas()` en `src/citas.js`, con su prueba, y enlaza el PR con la HO-01.
4. **Rompe la regla:** intenta hacer commit directo en `main`. ¿Qué pasa?

---

### ✅ Criterio de éxito
- Tablero con límites WIP, *Definition of done* por columna y las tres historias.
- `ops/slo.yaml` completo con el error budget calculado.
- `main` con política de *Build validation*.
- Un PR **que estuvo en rojo y acabó en verde**, completado, con la HU-01 cerrada automáticamente.

**Comparte en el chat:** tu error budget en minutos y una captura del PR completado.
