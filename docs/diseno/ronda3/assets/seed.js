// Ronda 3 seed. Every screen reads from here: fictitious student, nobody real.
window.SEED = {
  usuario: { nombre: "Ana", apellido: "López", carne: "2024-0187", carrera: "Ciencias de la Computación", semestre: 5 },
  semestre: { nombre: "2026-2", inicio: "2026-08-03", semanas: 18 },

  // slot = position in the validated course palette (assets/tokens.css, P2)
  cursos: {
    MD: { nombre: "Matemática Discreta", corto: "Discreta", slot: 1, catedratico: "Jorge Castillo", auxiliar: "Sofía Ramírez", seccion: "A" },
    PP: { nombre: "Paradigmas de Programación", corto: "Paradigmas", slot: 2, catedratico: "Andrés Molina", auxiliar: "Carlos Méndez", seccion: "A" },
    EL: { nombre: "Ética de la Libertad", corto: "Ética", slot: 3, catedratico: "Lucía Herrera", auxiliar: null, seccion: "C" },
    BD: { nombre: "Bases de Datos I", corto: "Bases de Datos", slot: 4, catedratico: "Marta Juárez", auxiliar: "Diego Paz", seccion: "B" },
  },

  // dia: 1 = lunes … 7 = domingo
  clases: [
    { curso: "MD", dias: [1, 3, 4], ini: "07:00", fin: "08:20", salon: "D-307" },
    { curso: "PP", dias: [2, 4], ini: "09:00", fin: "10:20", salon: "D-210" },
    { curso: "BD", dias: [1, 3, 5], ini: "10:30", fin: "11:50", salon: "D-105" },
    { curso: "EL", dias: [1, 4], ini: "14:00", fin: "15:20", salon: "Auditorio Juan Bautista" },
  ],

  examenes: [
    { id: "x1", curso: "MD", titulo: "Parcial 2", fecha: "2026-10-23T07:00", fin: "08:20", salon: "D-307", peso: 20, temas: "grafos, árboles y recurrencias" },
    { id: "x2", curso: "PP", titulo: "Parcial 2", fecha: "2026-10-26T09:00", fin: "10:20", salon: "D-210", peso: 25, temas: "closures, recursión y tipos" },
    { id: "x3", curso: "BD", titulo: "Parcial 2", fecha: "2026-10-27T10:30", fin: "11:50", salon: "D-105", peso: 25, temas: "normalización y SQL" },
    { id: "x4", curso: "EL", titulo: "Examen parcial", fecha: "2026-10-29T14:00", fin: "15:20", salon: "Auditorio Juan Bautista", peso: 20, temas: "Hayek y Mises, capítulos 1 a 4" },
  ],

  entregas: [
    { id: "e1", curso: "PP", titulo: "Ejercicio de llaves", fecha: "2026-10-23T23:59", formato: "Archivo .zip",
      rubrica: [["Correctitud", 50], ["Pruebas", 30], ["Estilo y claridad", 20]], atrasada: false },
    { id: "e2", curso: "MD", titulo: "Quiz 4: grafos", fecha: "2026-10-25T23:59", formato: "En línea, 20 min" },
    { id: "e3", curso: "EL", titulo: "Lectura: Hayek, capítulo 3", fecha: "2026-10-26T08:00", formato: "Comentario de 300 palabras" },
    { id: "e4", curso: "BD", titulo: "Tarea 4: normalización", fecha: "2026-10-28T23:59", formato: "PDF" },
    { id: "e5", curso: "PP", titulo: "Proyecto: parser JSON", fecha: "2026-11-03T23:59", formato: "Repositorio" },
    { id: "e6", curso: "EL", titulo: "Ensayo: orden espontáneo", fecha: "2026-11-09T23:59", formato: "PDF, 1 500 palabras" },
  ],
  entregadas: [{ curso: "BD", titulo: "Tarea 3: modelo entidad-relación", fecha: "2026-10-22T16:20" }],

  novedades: [
    { tipo: "nota", curso: "PP", texto: "92 en Actividad 5", quien: "Carlos Méndez, auxiliar", fecha: "2026-10-22T05:40", nueva: true },
    { tipo: "documento", curso: "MD", texto: "Guía de repaso del Parcial 2", quien: "Jorge Castillo", fecha: "2026-10-21T17:10", nueva: true },
    { tipo: "nota", curso: "MD", texto: "90 en Quiz 3", quien: "Sofía Ramírez, auxiliar", fecha: "2026-10-20T19:00", nueva: true },
    { tipo: "anuncio", curso: "EL", texto: "Traigan la lectura impresa el lunes", quien: "Lucía Herrera, catedrática", fecha: "2026-10-21T12:00", nueva: false },
  ],

  pago: {
    concepto: "Cuota de noviembre", monto: 7387.8, vence: "2026-10-28", referencia: "MIU-26-004127",
    desglose: [["Colegiatura", 6950], ["Laboratorio de cómputo", 312.8], ["Seguro estudiantil", 125]],
    historial: [
      { fecha: "2026-10-14", concepto: "Multa de biblioteca", metodo: "Depósito con comprobante", monto: 45, estado: "revision" },
      { fecha: "2026-09-26", concepto: "Cuota de octubre", metodo: "Transferencia ACH", monto: 7387.8, estado: "pagado" },
      { fecha: "2026-08-27", concepto: "Cuota de septiembre", metodo: "Tarjeta terminada en 4417", monto: 7387.8, estado: "pagado" },
      { fecha: "2026-08-03", concepto: "Inscripción 2026-2", metodo: "Transferencia ACH", monto: 1500, estado: "pagado" },
    ],
  },

  // Grades: evaluated weight and earned points out of that weight.
  notas: {
    historial: [["2024-2", 80.6], ["2025-1", 82.1], ["2025-2", 83.0], ["2026-1", 83.8]],
    cursos: [
      { curso: "MD", evaluado: 60, obtenido: 46.6 },
      { curso: "BD", evaluado: 45, obtenido: 37.8 },
      { curso: "EL", evaluado: 50, obtenido: 43.5 },
      { curso: "PP", evaluado: 55, obtenido: 50.05, nuevas: 1 },
    ],
    detalleMD: [
      { actividad: "Quiz 3: lógica", peso: 5, nota: 90, quien: "Sofía Ramírez", rol: "auxiliar", fecha: "2026-10-20", nueva: true },
      { actividad: "Avance del proyecto", peso: 10, nota: 79, quien: "Jorge Castillo", rol: "catedrático", fecha: "2026-10-14" },
      { actividad: "Parcial 1", peso: 20, nota: 72, quien: "Jorge Castillo", rol: "catedrático", fecha: "2026-09-22" },
      { actividad: "Tareas 1 a 3", peso: 15, nota: 80, quien: "Sofía Ramírez", rol: "auxiliar", fecha: "2026-10-08" },
      { actividad: "Quizzes 1 y 2", peso: 10, nota: 78, quien: "Sofía Ramírez", rol: "auxiliar", fecha: "2026-10-01" },
    ],
    metas: [71, 80, 90],
  },

  // Assistant batch grading: Paradigmas, section A, Actividad 6.
  lote: {
    curso: "PP", actividad: "Actividad 6: closures", cierre: "2026-10-20T23:59", umbral: 61,
    entregas: [
      { alumno: "Andrea Batz", carne: "2024-0112", hora: "2026-10-20T21:14", nota: 88 },
      { alumno: "Bruno Chávez", carne: "2024-0145", hora: "2026-10-20T23:02", nota: 74 },
      { alumno: "Camila Díaz", carne: "2024-0166", hora: "2026-10-19T18:40", nota: 95 },
      { alumno: "Daniel Estrada", carne: "2024-0171", hora: "2026-10-20T23:58", nota: 55, justificacion: "Sin pruebas y dos funciones no compilan." },
      { alumno: "Elena Figueroa", carne: "2024-0190", hora: "2026-10-20T12:31", nota: null, actual: true },
      { alumno: "Fernando García", carne: "2024-0203", hora: "2026-10-20T22:47", nota: null },
      { alumno: "Gabriela Hernández", carne: "2024-0219", hora: "2026-10-21T00:12", nota: null, atrasada: true },
      { alumno: "Héctor Ixcot", carne: "2024-0228", hora: "2026-10-20T20:05", nota: null },
    ],
    total: 24,
  },
};
