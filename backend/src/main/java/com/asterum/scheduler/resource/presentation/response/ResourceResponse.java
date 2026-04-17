package com.asterum.scheduler.resource.presentation.response;

import com.asterum.scheduler.resource.domain.Resource;

public record ResourceResponse(
    Long id,
    String name,
    String category
) {
    public static ResourceResponse from(Resource resource) {
        return new ResourceResponse(
            resource.getId(),
            resource.getName(),
            resource.getCategory()
        );
    }
}
