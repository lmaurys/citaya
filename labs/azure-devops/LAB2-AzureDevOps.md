# LAB 2 (versión Azure DevOps) · Pipeline de despliegue de punta a punta

**Curso Estrategia DevOps · Día 2 · Módulos 3, 4 y 5**

> Es la versión **Azure DevOps** del [LAB 2 de GitHub](../LAB2.md). Usa el proyecto `CitaYa` que montaste en el [LAB 1 de Azure DevOps](LAB1-AzureDevOps.md).

Ayer CitaYa ganó la cancelación de citas, pero nadie la ve: **no está desplegada**. Hoy usas un pipeline multi-etapa que lleva cada cambio de `main` hasta producción de forma repetible, con una puerta de calidad en cada etapa. Y lo usas para lo que de verdad importa: parar un defecto, liberar una funcionalidad con un flag, volver atrás y medir.

```
 1 · commit  ─►  2 · build  ─►  3 · aceptación  ─►  4 · producción  ─►  5 · verificación
 lint + unit     artefacto      pruebas sobre el     Environment con      humo: ¿producción
                 (una vez)      MISMO artefacto      aprobación           tiene el mismo SHA?
```

| Lo que haces | Lo que estás aplicando |
|---|---|
| Un único artefacto (`citaya-dist`) que recorre todas las etapas | *Build once, deploy many* (3.2) |
| Aprobación en el *Environment* antes de producción | Entrega continua frente a despliegue continuo (3.1) |
| La aceptación para un cambio dañino | Ji-Kotei-Kanketsu, Jidoka, parar la línea (3.3) |
| Feature flag | Desplegar ≠ liberar; configuración fuera del código (4.2) |
| *Revert* y redespliegue | Recuperación, MTTR (4.4) |
| Etiqueta `v1.0.0` | Control de versiones y versionado semántico (4.2) |
| `ops/dora.md` | Medir el flujo: métricas DORA (1.1) |
| Retirar el formulario clásico | Fin de la vida útil (5) |

**Duración orientativa:** 50-90 min. Puede alargarse y no pasa nada.
**Requisito:** haber hecho al menos los pasos 1, 2, 6 y 8 del LAB 1 de Azure DevOps. Recuerda el aviso sobre los agentes: sin agentes hospedados, ejecuta con **agente = propio**.

---

## Paso 1 · Preparar producción (5-15 min)

**1a · El entorno con su puerta (obligatorio)**
1. **Pipelines → Environments → New environment** → nombre exacto **`citaya-produccion`** → *Resource*: **None** → **Create**.
2. En el entorno: **⋯ → Approvals and checks → + → Approvals** → añádete como aprobador → **Create**.

Acabas de poner una **puerta manual** antes de producción. Con ella tienes **entrega continua**: siempre listo para desplegar, y una persona decide cuándo. Sin ella sería **despliegue continuo**.

**1b · ¿Dónde está "producción"? Elige un destino**

| Destino | Qué necesitas | Qué verás |
|---|---|---|
| **`simulado`** (por defecto) | Nada más | La etapa 4 pasa por la aprobación y "publica" el artefacto. La etapa 5 lo sirve y verifica que lleva el SHA del commit. Todas las prácticas del lab funcionan igual. |
| **`swa`** | Una suscripción de Azure | La web real en Azure Static Web Apps (plan Free). |

Para **`swa`**:
1. En el portal de Azure: **Create a resource → Static Web App** → plan **Free** → *Deployment source*: **Other** → **Create**.
2. En el recurso: copia la **URL** y, en **Manage deployment token**, copia el token.
3. Pasarás los dos datos en el paso 2.

## Paso 2 · Crear el pipeline (10 min)

1. **Pipelines → New pipeline → Azure Repos Git → CitaYa → Existing Azure Pipelines YAML file**.
2. Rama `main`, ruta **`/labs/azure-devops/pipeline.yml`** → **Continue**.
3. Solo si usas **`swa`**: **Variables → New variable** → `SWA_TOKEN` = el token, marcando **Keep this value secret**. Crea otra, `URL_PRODUCCION`, con la URL.
4. **Run**. En el panel **Run pipeline** elige **destino** (`simulado` o `swa`) y **agente**.
5. Renombra el pipeline a **`pipeline`** (menú **⋯ → Rename/move**).

Lee el YAML con calma. Fíjate en tres cosas:
- `dependsOn:` encadena las etapas: si una falla, las siguientes no se ejecutan.
- `publish` / `download: current`: el `dist` que se prueba es **el mismo** que se despliega.
- `condition:` de `produccion`: solo se despliega desde `main`. En un PR, el pipeline se queda en aceptación.

> Con el disparador automático (cada merge a `main`) se usan los valores por defecto del YAML: `destino: simulado` y `agente: hospedado`. Si usas `swa` o agente propio, cambia los `default:` de los parámetros en `labs/azure-devops/pipeline.yml` mediante un PR.

## Paso 3 · Primer despliegue (10 min)

1. La primera vez, la ejecución puede pedir **"This pipeline needs permission to access a resource"** → **View → Permit**.
2. Al llegar a **4 · producción** se queda en **Waiting**: **Review → Approve**.
3. Cuando **5 · verificación** esté en verde:
   - **swa**: abre tu URL, reserva una cita y cancélala. El pie muestra la **versión y el SHA**: compáralo con el último commit de `main`.
   - **simulado**: en el resumen de la ejecución, abre el artefacto **`citaya-dist`** → `version.json`. El SHA es el de tu commit, y la etapa 5 lo ha verificado.
4. Mira **Environments → citaya-produccion → Deployments**: el historial de qué versión llegó a producción y cuándo.

## Paso 4 · Parar la línea (15 min)

Negocio pide: *"En horario de verano cerramos a las 13:00, cambiadlo"*.

1. **Repos → Files → `src/citas.js` → Edit** → cambia `HORA_CIERRE = 14` por `HORA_CIERRE = 13` → **Commit** a una rama nueva `horario-verano` con **Create a pull request** → **Create**.
2. Observa: la política `pruebas` (pipeline `ci`) ✅. ¡El PR se puede completar!
3. Corrígelo: **Repos → Branches → main → Branch policies → Build Validation → +** → pipeline **`pipeline`**, Required, *Display name*: `pipeline completo` → **Save**.
4. Vuelve al PR: se lanza el pipeline completo. **1 · commit** ✅ · **2 · build** ✅ · **3 · aceptación** ❌ (y **4 · producción** se salta porque es un PR).
   Lee el error en la pestaña **Tests**: *"Solo hay 16 franjas al día: se incumple la capacidad mínima comprometida (20)"*. El PR queda bloqueado.
5. **Abandon** el PR.

**Para pensar:** las unitarias no lo detectaron, porque el código hacía exactamente lo que se le pedía. Lo detectó la prueba que codifica **el compromiso con el servicio**. Eso es **Ji-Kotei-Kanketsu**: cada etapa conoce su criterio de "bien hecho" y no pasa el defecto a la siguiente.

## Paso 5 · Desplegar no es liberar: feature flag (10 min)

1. `config/flags.json` → cambia `"listaEspera": false` por `true` → rama `activar-lista-espera` → PR → **Complete** cuando las políticas estén en verde.
2. El merge dispara el pipeline en `main`: **aprueba** el despliegue.
3. **swa**: recarga la web y verás **"Apuntarme a la lista de espera"**. **simulado**: comprueba `config/flags.json` dentro del artefacto. No has tocado ni una línea de código.

## Paso 6 · Algo va mal: rollback (10 min)

La Concejalía avisa: *"la lista de espera no estaba aprobada, quitadla ya"*. **Anota la hora.**

1. **Repos → Pull requests → Completed** → el PR `activar-lista-espera` → botón **Revert** → **Revert** (crea una rama de reversión) → **Create pull request** → **Complete**.
2. Aprueba el despliegue y espera a **5 · verificación** en verde. **Anota la hora.**
3. La diferencia entre las dos horas es tu **tiempo de recuperación** (MTTR).

La vuelta atrás es **otro cambio** que recorre el mismo pipeline, con las mismas pruebas, y queda registrado en el entorno.

## Paso 7 · Versionar (5 min)

1. **Repos → Tags → New tag** → nombre `v1.0.0` → *Based on*: `main` → descripción: qué incluye la versión → **Create**.
2. Opcional: actualiza `version` en `package.json` a `1.0.0` y el `CHANGELOG.md` con un PR. ¿Qué número tocarías (MAJOR.MINOR.PATCH) por añadir la cancelación? ¿Y por un arreglo?

## Paso 8 · Medir: DORA (10 min)

Completa `ops/dora.md` con los datos de:
- **Environments → citaya-produccion → Deployments**: frecuencia de despliegue y despliegues revertidos.
- **Pipelines → pipeline → Analytics** y el historial de ejecuciones: duración y tasa de éxito.
- Tus horas del paso 6: tiempo de recuperación.

¿Cuál es tu peor métrica y qué harías para mejorarla?

---

## Paso 9 · Retos (si te sobra tiempo, o en casa)

### A · Fin de la vida útil: retirar el formulario clásico (Módulo 5)
1. **Apagar:** `formularioClasico` a `false` en `config/flags.json` → PR → despliegue.
2. **Observar:** escribe en el PR qué métrica usarías para decidir que ya se puede borrar.
3. **Retirar:** borra `public/clasico.html`, el párrafo `enlace-clasico` de `public/index.html`, su línea en `public/app.js` y el flag en `config/flags.json` → PR.
4. **Documentar:** en `CHANGELOG.md`, sección **Eliminado**. ¿Es un cambio MAJOR?

### B · Continuidad de negocio (4.4)
Completa `ops/runbook-continuidad.md`: RTO, RPO y cómo recuperar el servicio volviendo a desplegar una ejecución anterior (abre una ejecución antigua → **Rerun** de la etapa *4 · producción*: el artefacto sigue guardado en esa ejecución).

### C · Dependencias (4.1)
Azure DevOps no trae un equivalente de Dependabot sin coste (existe *GitHub Advanced Security for Azure DevOps*, de pago, y alternativas como Renovate). Revisa las versiones de las tareas del YAML (`UseNode@1`, `PublishTestResults@2`, `AzureStaticWebApp@0`...) y anota cómo mantendrías esas dependencias al día en tu organización.

### D · Despliegue continuo
Quita la aprobación del entorno `citaya-produccion`. ¿Qué tendría que ser cierto en tu organización para atreverte a hacerlo en un sistema real?

---

### ✅ Criterio de éxito
- Una ejecución con las 5 etapas en verde y el historial del entorno `citaya-produccion`.
- Un PR **bloqueado por la etapa de aceptación** y el pipeline completo añadido como política de rama.
- Un flag activado y revertido, con tu MTTR medido.
- La etiqueta `v1.0.0` y `ops/dora.md` completo.

**Comparte en el chat:** tu MTTR y, si usaste `swa`, tu URL.
