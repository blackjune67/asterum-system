package com.asterum.scheduler.resource.application;

import com.asterum.scheduler.resource.domain.Resource;
import com.asterum.scheduler.resource.infrastructure.persistence.ResourceRepository;
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

    public List<Resource> list() {
        return resourceRepository.findAllByOrderByNameAsc();
    }
}
