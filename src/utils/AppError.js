class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        // Captura la traza de la pila para identificar la línea exacta del error en los logs
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;