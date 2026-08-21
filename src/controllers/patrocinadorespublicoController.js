const patrocinadoresPublicoModel = require('../models/patrocinadoresPublicoModel');

const listar = async (req, res) => {
    try {
        const patrocinadores = await patrocinadoresPublicoModel.listarPatrocinadores();
        res.status(200).json(patrocinadores);
    } catch (error) {
        console.error('Error al listar patrocinadores:', error);
        res.status(500).json({ error: 'Error al obtener los patrocinadores' });
    }
};

const obtenerCatalogo = async (req, res) => {
    try {
        const { id } = req.params;

        const patrocinador = await patrocinadoresPublicoModel.obtenerPatrocinadorPorId(id);
        if (!patrocinador) {
            return res.status(404).json({ error: 'Patrocinador no encontrado' });
        }

        const catalogo = await patrocinadoresPublicoModel.obtenerCatalogoPorPatrocinador(id);
        res.status(200).json({ patrocinador, catalogo });
    } catch (error) {
        console.error('Error al obtener catálogo del patrocinador:', error);
        res.status(500).json({ error: 'Error al obtener el catálogo' });
    }
};

module.exports = { listar, obtenerCatalogo };