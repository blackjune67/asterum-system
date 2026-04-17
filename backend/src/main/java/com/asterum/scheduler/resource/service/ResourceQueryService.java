package com.asterum.scheduler.resource.service;

import com.asterum.scheduler.resource.dto.ResourceResponse;
import com.asterum.scheduler.resource.repository.ResourceRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ResourceQueryService {

    private final ResourceRepository resourceRepository;

    public ResourceQueryService(ResourceRepository resourceRepository) {
        this.resourceRepository = resourceRepository;
    }

    public List<ResourceResponse> list() {
        return resourceRepository.findAllByOrderByNameAsc().stream()
            .map(resource -> new ResourceResponse(resource.getId(), resource.getName(), resource.getCategory()))
            .toList();
    }
}
