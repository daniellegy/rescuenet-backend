const reporteModel = require('../models/reporteModel');
const path = require('path');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');

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
    console.error("Fallo en la inicialización de Firebase.");
    console.error(error);
}

const crearNuevoReporte = async (usuario_id, body, file) => {
    if (!file) throw { statusCode: 400, message: 'La fotografía es obligatoria' };

    const { 
        latitud, longitud, especie, color_dominante, 
        sexo, edad_aprox, tamano, agresividad, raza_aprox, caracteristicas_especiales, notas_adicionales,
        urgencia // NUEVO
    } = body;

    if (!latitud || !longitud || !especie || !color_dominante) {
        throw { statusCode: 400, message: 'Faltan datos obligatorios' };
    }

    const datosReporte = {
        usuario_id, latitud, longitud, especie, color_dominante,
        sexo, edad_aprox, tamano, agresividad, raza_aprox, caracteristicas_especiales, notas_adicionales,
        urgencia: urgencia || 'media',
        url_archivo: file.path 
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
                notas_adicionales: notas_adicionales || 'Sin notas',
                urgencia: urgencia || 'media',
                estado: 'Nuevo',
                latitud: parseFloat(latitud),
                longitud: parseFloat(longitud),
                foto_url: resultado.foto_url
            });

            const emoji = urgencia === 'alta' ? '🔴' : urgencia === 'media' ? '🟠' : '🟡';
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

const obtenerActivos = async () => {
    return await reporteModel.obtenerReportesActivos();
};

const aceptarRescate = async (reporte_id, voluntario_id) => {
    await reporteModel.actualizarEstadoReporte(reporte_id, voluntario_id, 'En_Proceso');
};

module.exports = { crearNuevoReporte, obtenerMisReportes, obtenerActivos, aceptarRescate };