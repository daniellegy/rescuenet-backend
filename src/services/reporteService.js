const reporteModel = require('../models/reporteModel');
const path = require('path');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');

// Inicialización de Firebase
try {
    const rutaKey = path.join(process.cwd(), 'firebase-key.json');
    const serviceAccount = require(rutaKey);
    
    if (getApps().length === 0) {
        initializeApp({
            credential: cert(serviceAccount)
        });
        console.log("Firebase inicializado con éxito.");
    }
} catch (error) {
    console.error("Fallo en la inicialización de Firebase:", error);
}

const crearNuevoReporte = async (usuario, body, file) => {
    if (!file) throw { statusCode: 400, message: 'La fotografía es obligatoria' };

    const { 
        latitud, longitud, especie, color_dominante, 
        sexo, edad_aprox, tamano, agresividad, raza_aprox, caracteristicas_especiales, notas_adicionales, urgencia, referencias, radio
    } = body;

    const datosReporte = {
        usuario_id: usuario.id,
        latitud, longitud, especie, color_dominante,
        sexo, edad_aprox, tamano, agresividad, raza_aprox, caracteristicas_especiales, 
        notas_adicionales: notas_adicionales || '', 
        urgencia: urgencia || 'media',
        url_archivo: file.path,
        referencias: referencias || null,
        radio: parseInt(radio, 10) || 500
    };

    const resultado = await reporteModel.crearReporteConFoto(datosReporte);

    try {
        if (resultado.reporte_id) {
            const reporteString = JSON.stringify({
                id: resultado.reporte_id,
                especie, color_dominante, sexo: sexo || 'Desconocido', 
                edad_aprox: edad_aprox || 'Cachorro', tamano: tamano || 'Pequeño',
                agresividad: agresividad || 1, raza_aprox: raza_aprox || 'Desconocida',
                caracteristicas_especiales: caracteristicas_especiales || 'Ninguna',
                notas_adicionales: notas_adicionales || '',
                urgencia: urgencia || 'media',
                estado: 'Nuevo',
                latitud: parseFloat(latitud),
                longitud: parseFloat(longitud),
                foto_url: resultado.foto_url,
                nombre_reportador: usuario.nombre_completo,
                fecha_creacion: new Date().toISOString(),
                referencias: referencias || 'Sin referencias',
                radio: parseInt(radio, 10) || 500
            });

            const emoji = urgencia === 'alta' ? '🚨' : urgencia === 'media' ? '⚠️' : '🐾';
            const mensajePayload = {
                notification: {
                    title: `${emoji} Emergencia de Rescate (${urgencia.toUpperCase()})`,
                    body: `Se reportó un ${especie} (${color_dominante}) que necesita ayuda.`
                },
                android: { priority: 'high' },
                data: { reporte: reporteString },
                topic: 'voluntarios'
            };
            await getMessaging().send(mensajePayload);
        }
    } catch (pushError) {
        console.error("Fallo al enviar notificación push:", pushError);
    }

    return resultado;
};

const obtenerMisReportes = async (usuario_id) => {
    return await reporteModel.obtenerHistorial(usuario_id);
};

const obtenerActivos = async (limit, offset) => {
    return await reporteModel.obtenerReportesActivos(limit, offset);
};

const aceptarRescate = async (reporte_id, voluntario_id) => {
    // Aquí es donde ocurría tu error. Ahora el servicio llama limpiamente al modelo.
    // El modelo es el encargado de interactuar con el 'pool' de la DB.
    const rescateOcupadoRes = await reporteModel.verificarRescateActivo(voluntario_id);
    if (rescateOcupadoRes) {
        throw { statusCode: 403, message: 'Ya tienes un caso en proceso. Finalízalo antes de aceptar otro.' };
    }
    await reporteModel.actualizarEstadoReporte(reporte_id, voluntario_id, 'En_Proceso');
};

const obtenerRescateAsignado = async (voluntario_id) => {
    return await reporteModel.obtenerMiRescateActivo(voluntario_id);
};

const abortarRescateAsignado = async (reporte_id, voluntario_id) => {
    return await reporteModel.abortarRescate(reporte_id, voluntario_id);
};

const actualizarProgreso = async (reporte_id, voluntario_id, datos) => {
    const { animal_avistado, lugar_traslado } = datos;
    return await reporteModel.actualizarProgresoRescate(reporte_id, voluntario_id, animal_avistado, lugar_traslado);
};

const finalizarRescateAsignado = async (reporte_id, voluntario_id, detalles, file) => {
    const evidencia_url = file ? file.path : null;
    return await reporteModel.finalizarEstadoRescate(reporte_id, voluntario_id, detalles, evidencia_url);
};

module.exports = { 
    crearNuevoReporte, 
    obtenerMisReportes, 
    obtenerActivos, 
    aceptarRescate, 
    obtenerRescateAsignado, 
    abortarRescateAsignado, 
    actualizarProgreso, 
    finalizarRescateAsignado 
};