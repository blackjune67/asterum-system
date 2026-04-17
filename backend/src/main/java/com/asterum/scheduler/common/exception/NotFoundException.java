package com.asterum.scheduler.common.exception;

public class NotFoundException extends ApiException {

    public NotFoundException(ErrorCode errorCode, Object... args) {
        super(errorCode, args);
    }
}
