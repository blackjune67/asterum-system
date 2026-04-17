package com.asterum.scheduler.team.dto;

import com.asterum.scheduler.participant.dto.ParticipantResponse;
import java.util.List;

public record TeamResponse(
    Long id,
    String name,
    List<Long> memberIds,
    List<ParticipantResponse> members
) {
}
