// LAB 1 · HU-01 "Cancelar mi cita" · Historia de pruebas HP-01.
// Paso 7 del lab: quita el ".skip" de la línea del describe, haz commit en tu rama
// y observa cómo la CI se pone en rojo. Después implementa cancelar() en src/citas.js.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { crearAgenda, reservar, cancelar, disponibilidad } from "../../src/citas.js";

const RESERVA_HECHA = new Date("2026-10-01T10:00:00");
const LUNES = "2026-10-05";
const base = { oficinaId: "OAC-NORTE", tramiteId: "PADRON", fecha: LUNES, hora: "10:00", dni: "12345678Z" };

describe("HU-01 · cancelar mi cita", () => {
  it("Dado una cita activa, cuando la cancelo con antelación, entonces queda cancelada", () => {
    const agenda = crearAgenda();
    const { localizador } = reservar(agenda, base, RESERVA_HECHA);
    const cita = cancelar(agenda, localizador, new Date("2026-10-04T18:00:00"));
    assert.equal(cita.estado, "cancelada");
    assert.ok(cita.canceladaEn, "debe guardar cuándo se canceló");
  });

  it("Dado una cita cancelada, entonces la franja vuelve a quedar libre", () => {
    const agenda = crearAgenda();
    const { localizador } = reservar(agenda, base, RESERVA_HECHA);
    cancelar(agenda, localizador, new Date("2026-10-04T18:00:00"));
    const franja = disponibilidad(agenda, "OAC-NORTE", LUNES).find(f => f.hora === "10:00");
    assert.equal(franja.libres, 1);
  });

  it("Dado un localizador que no existe, entonces CITA_NO_ENCONTRADA", () => {
    const agenda = crearAgenda();
    assert.throws(() => cancelar(agenda, "VDR-00000000-0000", RESERVA_HECHA), { codigo: "CITA_NO_ENCONTRADA" });
  });

  it("Dado una cita ya cancelada, cuando la cancelo otra vez, entonces CITA_NO_ACTIVA", () => {
    const agenda = crearAgenda();
    const { localizador } = reservar(agenda, base, RESERVA_HECHA);
    cancelar(agenda, localizador, new Date("2026-10-04T18:00:00"));
    assert.throws(() => cancelar(agenda, localizador, new Date("2026-10-04T19:00:00")), { codigo: "CITA_NO_ACTIVA" });
  });

  it("Dado que faltan menos de 2 horas, entonces FUERA_DE_PLAZO", () => {
    const agenda = crearAgenda();
    const { localizador } = reservar(agenda, base, RESERVA_HECHA);
    assert.throws(() => cancelar(agenda, localizador, new Date("2026-10-05T08:30:00")), { codigo: "FUERA_DE_PLAZO" });
  });

  // Reto del LAB 1: el caso límite. Exactamente 2 h antes, ¿se puede? Lee la regla 3.
  // it("Dado que faltan exactamente 2 horas, entonces sí se puede cancelar", () => { ... });
});
