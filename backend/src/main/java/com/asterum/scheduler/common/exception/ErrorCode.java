package com.asterum.scheduler.common.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    INVALID_TIME_RANGE(
        HttpStatus.BAD_REQUEST,
        "잘못된 시간 범위",
        "시작 시간은 종료 시간보다 빨라야 합니다"
    ),
    INVALID_RECURRENCE_REQUEST(
        HttpStatus.BAD_REQUEST,
        "잘못된 반복 일정 요청",
        "반복 일정 요청이 올바르지 않습니다"
    ),
    RECURRENCE_UNTIL_DATE_REQUIRED(
        HttpStatus.BAD_REQUEST,
        "반복 종료일 누락",
        "UNTIL_DATE 반복에는 종료일이 필요합니다"
    ),
    RECURRENCE_COUNT_REQUIRED(
        HttpStatus.BAD_REQUEST,
        "반복 횟수 누락",
        "COUNT 반복에는 횟수가 필요합니다"
    ),
    RECURRING_SCHEDULE_ALREADY_CONVERTED(
        HttpStatus.BAD_REQUEST,
        "이미 반복 일정으로 전환된 일정",
        "반복 일정은 다시 반복 일정으로 전환할 수 없습니다"
    ),
    RECURRENCE_RULE_REQUIRED(
        HttpStatus.BAD_REQUEST,
        "반복 규칙 필요",
        "반복 규칙이 필요합니다"
    ),
    PARTICIPANTS_NOT_FOUND(
        HttpStatus.BAD_REQUEST,
        "참여자를 찾을 수 없음",
        "일부 참여자가 존재하지 않습니다"
    ),
    PARTICIPANT_NOT_FOUND(
        HttpStatus.NOT_FOUND,
        "참여자를 찾을 수 없음",
        "참여자 %s를 찾을 수 없습니다"
    ),
    TEAMS_NOT_FOUND(
        HttpStatus.BAD_REQUEST,
        "팀을 찾을 수 없음",
        "일부 팀이 존재하지 않습니다"
    ),
    TEAM_NOT_FOUND(
        HttpStatus.NOT_FOUND,
        "팀을 찾을 수 없음",
        "팀 %s를 찾을 수 없습니다"
    ),
    RESOURCE_NOT_FOUND(
        HttpStatus.BAD_REQUEST,
        "리소스를 찾을 수 없음",
        "리소스가 존재하지 않습니다"
    ),
    RESOURCE_COLLISION(
        HttpStatus.BAD_REQUEST,
        "리소스 예약 충돌",
        "리소스 예약 충돌: %s 리소스는 이미 %s %s-%s에 예약되어 있습니다"
    ),
    REQUEST_VALIDATION_FAILED(
        HttpStatus.BAD_REQUEST,
        "요청 검증 실패",
        "%s"
    ),
    STAFF_TYPE_REQUIRED(
        HttpStatus.BAD_REQUEST,
        "개인 스태프 타입 필요",
        "개인 스태프 등록과 수정은 STAFF 타입만 지원합니다"
    ),
    STAFF_TEAM_REQUIRED(
        HttpStatus.BAD_REQUEST,
        "개인 스태프 소속 팀 필요",
        "개인 스태프는 반드시 하나의 팀에 소속되어야 합니다"
    ),
    PARTICIPANT_NAME_DUPLICATE(
        HttpStatus.BAD_REQUEST,
        "중복된 참여자 이름",
        "이미 사용 중인 참여자 이름입니다: %s"
    ),
    TEAM_NAME_DUPLICATE(
        HttpStatus.BAD_REQUEST,
        "중복된 팀 이름",
        "이미 사용 중인 팀 이름입니다: %s"
    ),
    PARTICIPANT_IN_USE(
        HttpStatus.BAD_REQUEST,
        "사용 중인 참여자",
        "일정에서 사용 중인 개인 스태프는 삭제할 수 없습니다"
    ),
    TEAM_IN_USE(
        HttpStatus.BAD_REQUEST,
        "사용 중인 팀",
        "일정에서 사용 중인 팀은 삭제할 수 없습니다"
    ),
    TEAM_HAS_MEMBERS(
        HttpStatus.BAD_REQUEST,
        "팀 멤버 존재",
        "소속 개인 스태프가 남아 있는 팀은 삭제할 수 없습니다"
    ),
    SCHEDULE_OCCURRENCE_NOT_FOUND(
        HttpStatus.NOT_FOUND,
        "일정 발생 정보를 찾을 수 없음",
        "일정 발생 정보 %s를 찾을 수 없습니다"
    );

    private final HttpStatus status;
    private final String title;
    private final String detailTemplate;

    ErrorCode(HttpStatus status, String title, String detailTemplate) {
        this.status = status;
        this.title = title;
        this.detailTemplate = detailTemplate;
    }

    public HttpStatus status() {
        return status;
    }

    public String title() {
        return title;
    }

    public String detail(Object... args) {
        return detailTemplate.formatted(args);
    }

    public String type() {
        return "/problems/" + name().toLowerCase().replace('_', '-');
    }
}
