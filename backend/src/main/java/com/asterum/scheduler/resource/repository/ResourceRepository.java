package com.asterum.scheduler.resource.repository;

import com.asterum.scheduler.resource.domain.Resource;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ResourceRepository extends JpaRepository<Resource, Long> {

    List<Resource> findAllByOrderByNameAsc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select resource from Resource resource where resource.id = :id")
    Optional<Resource> findByIdForUpdate(@Param("id") Long id);
}
