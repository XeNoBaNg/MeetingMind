package com.meetingmind.common.exception;

import com.meetingmind.common.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AiPipelineException.class)
    @ResponseStatus(HttpStatus.BAD_GATEWAY)
    public ApiResponse<Void> handleAiPipelineException(AiPipelineException ex) {
        return ApiResponse.error("AI Pipeline Error: " + ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiResponse<Void> handleException(Exception ex) {
        // Simple check for missing API key if it propagates up
        if (ex.getMessage() != null && ex.getMessage().contains("api-key")) {
            return ApiResponse.error("API configuration error: missing GROK_API_KEY");
        }
        return ApiResponse.error("An unexpected error occurred: " + ex.getMessage());
    }

    @ExceptionHandler(UserAlreadyExistsException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleUserAlreadyExistsException(UserAlreadyExistsException ex) {
        return ApiResponse.error(ex.getMessage());
    }
}
