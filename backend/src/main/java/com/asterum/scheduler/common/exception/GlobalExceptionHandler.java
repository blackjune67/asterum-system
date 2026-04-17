package com.asterum.scheduler.common.exception;

import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import java.util.List;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ProblemDetail> handleApiException(ApiException exception, HttpServletRequest request) {
        return ResponseEntity.status(exception.getErrorCode().status())
            .body(buildProblemDetail(
                exception.getErrorCode(),
                exception.getMessage(),
                request,
                null
            ));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetail> handleValidation(
        MethodArgumentNotValidException exception,
        HttpServletRequest request
    ) {
        List<ValidationError> errors = exception.getBindingResult().getFieldErrors().stream()
            .map(error -> new ValidationError(error.getField(), error.getDefaultMessage()))
            .toList();
        String detail = errors.stream()
            .findFirst()
            .map(error -> error.field() + " " + error.reason())
            .orElse(ErrorCode.REQUEST_VALIDATION_FAILED.detail("Validation failed"));

        return ResponseEntity.status(ErrorCode.REQUEST_VALIDATION_FAILED.status())
            .body(buildProblemDetail(
                ErrorCode.REQUEST_VALIDATION_FAILED,
                detail,
                request,
                errors
            ));
    }

    private ProblemDetail buildProblemDetail(
        ErrorCode errorCode,
        String detail,
        HttpServletRequest request,
        List<ValidationError> errors
    ) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(errorCode.status(), detail);
        problemDetail.setType(URI.create(errorCode.type()));
        problemDetail.setTitle(errorCode.title());
        problemDetail.setInstance(URI.create(request.getRequestURI()));
        problemDetail.setProperty("code", errorCode.name());
        if (errors != null && !errors.isEmpty()) {
            problemDetail.setProperty("errors", errors);
        }
        return problemDetail;
    }

    private record ValidationError(String field, String reason) {
    }
}
