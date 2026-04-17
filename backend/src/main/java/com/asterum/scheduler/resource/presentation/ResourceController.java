package com.asterum.scheduler.resource.presentation;

import com.asterum.scheduler.resource.presentation.response.ResourceResponse;
import com.asterum.scheduler.resource.application.ResourceQueryService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/resources")
public class ResourceController {

    private final ResourceQueryService resourceQueryService;

    public ResourceController(ResourceQueryService resourceQueryService) {
        this.resourceQueryService = resourceQueryService;
    }

    @GetMapping
    public List<ResourceResponse> list() {
        return resourceQueryService.list().stream()
            .map(ResourceResponse::from)
            .toList();
    }
}
