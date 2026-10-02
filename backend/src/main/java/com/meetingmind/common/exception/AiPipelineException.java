package com.meetingmind.common.exception;

public class AiPipelineException extends RuntimeException {
    public AiPipelineException(String message) {
        super(message);
    }

    public AiPipelineException(String message, Throwable cause) {
        super(message, cause);
    }
}
