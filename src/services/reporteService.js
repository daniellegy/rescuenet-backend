const reporteModel = require('../models/reporteModel');
const path = require('path');
// Importaciones modulares modernas de Firebase Admin
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');

// Inicializar Firebase Admin
try {
    const rutaKey = path.join(process.cwd(), 'firebase-key.json');
    const serviceAccount = require(rutaKey);
    
    // getApps() reemplaza a admin.apps
    if (getApps().length === 0) {
        initializeApp({
            credential: cert(serviceAccount)
        });
        console.log("Firebase inicializado con éxito.");
    }
} catch (error) {
    console.error("Fallo en la inicialización de Firebase. El error es:");
    console.error(error);
}

const crearNuevoReporte = async (usuario_id, body, file) => {
    if (!file) throw { statusCode: 400, message: 'La fotografía es obligatoria' };

    const { 
        latitud, longitud, especie, color_dominante, 
        sexo, edad_aprox, tamano, agresividad, raza_aprox, caracteristicas_especiales, notas_adicionales 
    } = body;

    if (!latitud || !longitud || !especie || !color_dominante) {
        throw { statusCode: 400, message: 'Faltan datos obligatorios' };
    }

    const datosReporte = {
        usuario_id, latitud, longitud, especie, color_dominante,
        sexo, edad_aprox, tamano, agresividad: parseInt(agresividad) || 1, raza_aprox, caracteristicas_especiales, notas_adicionales,
        url_archivo: file.path
    };

    const resultado = await reporteModel.crearReporteConFoto(datosReporte);

// Disparar Notificación Push a la app
    try {
        if (getApps().length > 0) {
            // Empacamos el reporte en formato JSON para que Flutter lo pueda leer
            const reporteString = JSON.stringify({
                id: resultado.reporte_id,
                especie: especie,
                color_dominante: color_dominante,
                sexo: sexo || 'Desconocido',
                edad_aprox: edad_aprox || 'Cachorro',
                tamano: tamano || 'Pequeño',
                agresividad: parseInt(agresividad) || 1,
                raza_aprox: raza_aprox || 'Desconocida',
                caracteristicas_especiales: caracteristicas_especiales || 'Ninguna',
                notas_adicionales: notas_adicionales || 'Sin notas',
                estado: 'Nuevo',
                latitud: parseFloat(latitud),
                longitud: parseFloat(longitud),
                foto_url: resultado.foto_url
            });

            const mensajePayload = {
                notification: {
                    title: '¡Emergencia de Rescate!',
                    body: `Se reportó un ${especie} (${color_dominante}) que necesita ayuda.`
                },
                android: {
                    priority: 'high'
                },
                // AÑADIDO: El paquete de datos oculto para el enrutamiento
                data: {
                    reporte: reporteString
                },
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