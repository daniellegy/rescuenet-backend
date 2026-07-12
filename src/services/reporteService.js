const reporteModel = require('../models/reporteModel');
const usuarioModel = require('../models/usuarioModel'); 
const canalModel = require('../models/canalModel');
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
    console.error("Fallo en la inicialización de Firebase:", error);
}

const crearNuevoReporte = async (usuario, body, file) => {
    if (!file) throw { statusCode: 400, message: 'La fotografía es obligatoria' };

    const { 
        latitud, longitud, especie, color_dominante, 
        sexo, edad_aprox, tamano, agresividad, raza_aprox, caracteristicas_especiales, notas_adicionales, urgencia, referencias, radio, activarCanal
    } = body;

    const datosReporte = {
        usuario_id: usuario.id,
        latitud, longitud, especie, color_dominante,
        sexo, edad_aprox, tamano, agresividad, raza_aprox, caracteristicas_especiales, 
        notas_adicionales: notas_adicionales || '', 
        urgencia: urgencia || 'media',
        url_archivo: file.path,
        referencias: referencias || null,
        radio: parseInt(radio, 10) || 500,
        activar_canal: activarCanal === true || activarCanal === 'true'

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

            const tokens = await usuarioModel.obtenerTokensVoluntariosCercanos(latitud, longitud);

            if (tokens.length > 0) {
                const emoji = urgencia === 'alta' ? '🚨' : urgencia === 'media' ? '⚠️' : '🐾';
                await getMessaging().sendEachForMulticast({
                    tokens: tokens,
                    notification: {
                        title: `${emoji} Emergencia de Rescate (${urgencia.toUpperCase()})`,
                        body: `Se reportó un ${especie} (${color_dominante}) que necesita ayuda cerca de ti.`
                    },
                    data: { 
                        reporte: reporteString 
                    },
                    android: { 
                        priority: 'high' 
                    }
                });
                /*const mensajePayload = {
                    notification: {
                        title: `${emoji} Emergencia de Rescate (${urgencia.toUpperCase()})`,
                        body: `Se reportó un ${especie} (${color_dominante}) que necesita ayuda cerca de ti.`
                    },
                    android: { priority: 'high' },
                    data: { reporte: reporteString }
                };
                
                await getMessaging().sendEachForMulticast({
                    tokens: tokens,
                    notification: mensajePayload.notification,
                    data: mensajePayload.data,
                    android: mensajePayload.android
                });*/

            }
        }
    } catch (pushError) {
        console.error("Fallo al enviar notificación push:", pushError);
    }

    return resultado;
};

const obtenerMisReportes = async (usuario_id) => {
    return await reporteModel.obtenerHistorial(usuario_id);
};

const obtenerActivos = async (limit, offset, usuario_id, lat, lng) => {
    return await reporteModel.obtenerReportesActivos(limit, offset, usuario_id, lat, lng);
};

const aceptarRescate = async (reporte_id, voluntario_id) => {
    const rescateOcupadoRes = await reporteModel.verificarRescateActivo(voluntario_id);
    if (rescateOcupadoRes) {
        throw { statusCode: 403, message: 'Ya tienes un caso en proceso. Finalízalo antes de aceptar otro.' };
    }
    await reporteModel.actualizarEstadoReporte(reporte_id, voluntario_id, 'En_Proceso');
    await canalModel.activarCanalSiCorresponde(reporte_id);
};

const obtenerRescateAsignado = async (voluntario_id) => {
    return await reporteModel.obtenerMiRescateActivo(voluntario_id);
};

const abortarRescateAsignado = async (reporte_id, voluntario_id) => {
    const resultado = await reporteModel.abortarRescate(reporte_id, voluntario_id);
    await canalModel.reactivarCanalSiCorresponde(reporte_id);
    return resultado;
};

const actualizarProgreso = async (reporte_id, voluntario_id, datos) => {
    // CORRECCIÓN: Parseo explícito para evitar crashes de 'pg' por variables undefined
    const animal_avistado = datos.animal_avistado !== undefined ? datos.animal_avistado : null;
    const lugar_traslado = datos.lugar_traslado !== undefined ? datos.lugar_traslado : null;
    
    return await reporteModel.actualizarProgresoRescate(reporte_id, voluntario_id, animal_avistado, lugar_traslado);
};

const finalizarRescateAsignado = async (reporte_id, voluntario_id, detalles, file) => {
    const evidencia_url = file ? file.path : null;
    const resultado = await reporteModel.finalizarEstadoRescate(reporte_id, voluntario_id, detalles, evidencia_url);
    await canalModel.cerrarCanal(reporte_id);
    return resultado;
};

module.exports = { crearNuevoReporte, obtenerMisReportes, obtenerActivos, aceptarRescate, obtenerRescateAsignado, abortarRescateAsignado, actualizarProgreso, finalizarRescateAsignado };