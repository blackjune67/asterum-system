package com.asterum.scheduler.resource.repository;

import com.asterum.scheduler.resource.domain.Resource;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ResourceRepository extends JpaRepository<Resource, Long> {

    List<Resource> findAllByOrderByNameAsc();
}
