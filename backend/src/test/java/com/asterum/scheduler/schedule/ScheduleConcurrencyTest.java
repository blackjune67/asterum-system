package com.asterum.scheduler.schedule;

import static org.assertj.core.api.Assertions.assertThat;

import com.asterum.scheduler.common.exception.BadRequestException;
import com.asterum.scheduler.resource.domain.Resource;
import com.asterum.scheduler.resource.repository.ResourceRepository;
import com.asterum.scheduler.schedule.domain.ScheduleOccurrence;
import com.asterum.scheduler.schedule.dto.CreateScheduleRequest;
import com.asterum.scheduler.schedule.repository.ScheduleOccurrenceRepository;
import com.asterum.scheduler.schedule.repository.ScheduleSeriesRepository;
import com.asterum.scheduler.schedule.service.ScheduleService;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@SpringBootTest
class ScheduleConcurrencyTest {

    @Autowired
    private ScheduleService scheduleService;

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private ScheduleOccurrenceRepository scheduleOccurrenceRepository;

    @Autowired
    private ScheduleSeriesRepository scheduleSeriesRepository;

    @Autowired
    private PlatformTransactionManager transactionManager;

    private ExecutorService executorService;

    @BeforeEach
    void cleanSchedules() {
        scheduleOccurrenceRepository.deleteAll();
        scheduleSeriesRepository.deleteAll();
        executorService = Executors.newFixedThreadPool(2);
    }

    @AfterEach
    void shutdownExecutor() {
        if (executorService != null) {
            executorService.shutdownNow();
        }
    }

    @Test
    void waitsForPessimisticResourceLockThenFailsOnConflict() throws Exception {
        Long resourceId = resourceRepository.findAll().stream()
            .filter(resource -> resource.getName().equals("메인 스튜디오"))
            .map(Resource::getId)
            .findFirst()
            .orElseThrow();

        CountDownLatch firstTransactionReady = new CountDownLatch(1);
        CountDownLatch releaseFirstTransaction = new CountDownLatch(1);
        TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);

        Future<?> firstFuture = executorService.submit(() -> transactionTemplate.executeWithoutResult(status -> {
            Resource lockedResource = resourceRepository.findByIdForUpdate(resourceId).orElseThrow();
            scheduleOccurrenceRepository.save(new ScheduleOccurrence(
                null,
                "선점 일정",
                LocalDate.of(2026, 4, 21),
                LocalTime.of(10, 0),
                LocalTime.of(12, 0),
                lockedResource
            ));
            firstTransactionReady.countDown();
            try {
                if (!releaseFirstTransaction.await(5, TimeUnit.SECONDS)) {
                    throw new IllegalStateException("Timed out while holding the pessimistic lock");
                }
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException(exception);
            }
        }));

        assertThat(firstTransactionReady.await(2, TimeUnit.SECONDS)).isTrue();

        Future<Throwable> secondFuture = executorService.submit(() -> {
            try {
                scheduleService.create(new CreateScheduleRequest(
                    "충돌 일정",
                    LocalDate.of(2026, 4, 21),
                    LocalTime.of(11, 0),
                    LocalTime.of(13, 0),
                    List.of(1L),
                    null,
                    resourceId,
                    null
                ));
                return null;
            } catch (Throwable throwable) {
                return throwable;
            }
        });

        Thread.sleep(200);
        assertThat(secondFuture.isDone()).isFalse();

        releaseFirstTransaction.countDown();

        Throwable throwable = secondFuture.get(5, TimeUnit.SECONDS);
        firstFuture.get(5, TimeUnit.SECONDS);

        assertThat(throwable)
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Resource collision");
    }
}
