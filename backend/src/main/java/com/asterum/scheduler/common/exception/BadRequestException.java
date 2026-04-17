package com.asterum.scheduler.common.exception;

public class BadRequestException extends ApiException {

    public BadRequestException(ErrorCode errorCode, Object... args) {
        super(errorCode, args);
    }
}
