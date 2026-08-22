const reporteModel = require('../models/reporteModel');
const usuarioModel = require('../models/usuarioModel');
const canalModel = require('../models/canalModel');
const pool = require('../config/database');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const AppError = require('../utils/AppError');

try {
    if (getApps().length === 0) {
        let credentialConfig;
        if (process.env.FIREBASE_CREDENTIALS) {
            credentialConfig = cert(JSON.parse(process.env.FIREBASE_CREDENTIALS));
        } else {
            const path = require('path');
            const rutaKey = path.join(process.cwd(), 'firebase-key.json');
            credentialConfig = cert(require(rutaKey));
        }
        
        initializeApp({ credential: credentialConfig });
        console.log("Firebase inicializado con éxito.");
    }
} catch (error) {
    console.error("Fallo en la inicialización de Firebase:", error);
}

const crearNuevoReporte = async (usuario, body, file) => {
    if (!file) throw new AppError('La fotografía es obligatoria', 400);
    
    const { 
        latitud, longitud, especie, color_dominante,
        sexo, edad_aprox, tamano, agresividad, raza_aprox, caracteristicas_especiales, notas_adicionales, urgencia, referencias, radio, activarCanal
    } = body;
    
    const posibleDuplicado = await reporteModel.verificarReporteDuplicado(especie, color_dominante, latitud, longitud);
    if (posibleDuplicado) {
        throw new AppError('Parece que alguien ya reportó a este animal cerca de aquí.', 409);
    }
    
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
                agresividad: agresividad || 0, raza_aprox: raza_aprox || 'Desconocida',
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
                    data: { reporte: reporteString },
                    android: { priority: 'high' },
                    apns: { payload: { aps: { sound: 'default', contentAvailable: true } } }
                });
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

// NUEVO: Invoca el modelo para obtener reportes públicos de un usuario
const obtenerReportesDeUsuarioPublico = async (usuario_id) => {
    return await reporteModel.obtenerReportesPorUsuarioId(usuario_id);
};

const obtenerActivos = async (limit, offset, usuario_id, lat, lng) => {
    return await reporteModel.obtenerReportesActivos(limit, offset, usuario_id, lat, lng);
};

const aceptarRescate = async (reporte_id, voluntario_id) => {
    const rescateOcupadoRes = await reporteModel.verificarRescateActivo(voluntario_id);
    if (rescateOcupadoRes) {
        throw new AppError('Ya tienes un caso en proceso. Finalízalo antes de aceptar otro.', 403);
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
    const animal_avistado = datos.animal_avistado !== undefined ? datos.animal_avistado : null;
    const lugar_traslado = datos.lugar_traslado !== undefined ? datos.lugar_traslado : null;
    return await reporteModel.actualizarProgresoRescate(reporte_id, voluntario_id, animal_avistado, lugar_traslado);
};

const finalizarRescateAsignado = async (reporte_id, voluntario_id, detalles, file) => {
    const evidencia_url = file ? file.path : null;
    const resultado = await reporteModel.finalizarEstadoRescate(reporte_id, voluntario_id, detalles, evidencia_url);
    
    try {
        const query = `
            SELECT u.fcm_token FROM reportes r 
            JOIN usuarios u ON r.usuario_reportador_id = u.id 
            WHERE r.id = $1 AND u.fcm_token IS NOT NULL
        `;
        const res = await pool.query(query, [reporte_id]);
        if (res.rows.length > 0) {
            await getMessaging().send({
                token: res.rows[0].fcm_token,
                notification: {
                    title: '✅ ¡Emergencia Resuelta!',
                    body: 'El voluntario ha concluido tu reporte. Revisa la conclusión final.'
                },
                data: { reporte_id: String(reporte_id) },
                android: { priority: 'high' },
                apns: { payload: { aps: { sound: 'default', contentAvailable: true } } }
            });
        }
    } catch (e) {
        console.error('Error al notificar resolución al reportador:', e);
    }
    await canalModel.cerrarCanal(reporte_id);
    return resultado;
};

module.exports = { 
    crearNuevoReporte, 
    obtenerMisReportes, 
    obtenerActivos, 
    aceptarRescate, 
    obtenerRescateAsignado, 
    abortarRescateAsignado, 
    actualizarProgreso, 
    finalizarRescateAsignado,
    obtenerReportesDeUsuarioPublico // Exportar el nuevo método
};