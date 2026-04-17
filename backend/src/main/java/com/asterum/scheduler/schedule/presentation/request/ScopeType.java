package com.asterum.scheduler.schedule.presentation.request;

import com.asterum.scheduler.schedule.application.command.ScheduleScope;

public enum ScopeType {
    THIS,
    FOLLOWING,
    ALL;

    public ScheduleScope toApplicationScope() {
        return ScheduleScope.valueOf(name());
    }
}
