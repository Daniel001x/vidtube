import mongoose from "mongoose";
import { ApiError } from "../utils/apiErrorResponse.js";

const errorHandler = (err, req, res, next) => {
    let error = err;

    // If error is not an instance of ApiError, convert it
    if (!(error instanceof ApiError)) {
        const statusCode = 
            error.statusCode || 
            (error instanceof mongoose.Error ? 400 : 500);

        const message = error.message || "Something went wrong";
        
        error = new ApiError(
            statusCode, 
            message, 
            error?.errors || [], 
            err.stack
        );
    }

    // Prepare response
    const response = {
        success: error.success,
        statusCode: error.statusCode,
        message: error.message,
        errors: error.errors,
        ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {})
    };

    return res.status(error.statusCode).json(response);
};

export { errorHandler };