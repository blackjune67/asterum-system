package com.asterum.scheduler.schedule;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.asterum.scheduler.schedule.infrastructure.persistence.ScheduleOccurrenceRepository;
import com.asterum.scheduler.schedule.infrastructure.persistence.ScheduleSeriesRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class ScheduleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ScheduleOccurrenceRepository scheduleOccurrenceRepository;

    @Autowired
    private ScheduleSeriesRepository scheduleSeriesRepository;

    @BeforeEach
    void cleanSchedules() {
        scheduleOccurrenceRepository.deleteAll();
        scheduleSeriesRepository.deleteAll();
    }

    @Test
    void createsRecurringScheduleAndListsMonth() throws Exception {
        mockMvc.perform(post("/api/schedules")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "title": "주간 리허설",
                      "date": "2026-04-20",
                      "startTime": "10:00:00",
                      "endTime": "12:00:00",
                      "participantIds": [1, 3],
                      "recurrence": {
                        "enabled": true,
                        "type": "WEEKLY",
                        "interval": 1,
                        "endType": "COUNT",
                        "count": 3
                      }
                    }
                    """))
            .andExpect(status().isCreated());

        mockMvc.perform(get("/api/schedules?year=2026&month=4"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    void listingMonthMustNotMaterializeMoreOccurrencesForInfiniteSeries() throws Exception {
        mockMvc.perform(post("/api/schedules")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "title": "무기한 월간 촬영",
                      "date": "2026-04-05",
                      "startTime": "10:00:00",
                      "endTime": "12:00:00",
                      "participantIds": [1],
                      "recurrence": {
                        "enabled": true,
                        "type": "MONTHLY",
                        "interval": 1,
                        "endType": "NEVER"
                      }
                    }
                    """))
            .andExpect(status().isCreated());

        long occurrencesBeforeRead = scheduleOccurrenceRepository.count();

        mockMvc.perform(get("/api/schedules?year=2026&month=12"))
            .andExpect(status().isOk());

        long occurrencesAfterRead = scheduleOccurrenceRepository.count();

        org.assertj.core.api.Assertions.assertThat(occurrencesAfterRead)
            .as("GET /api/schedules must not persist more schedule occurrences")
            .isEqualTo(occurrencesBeforeRead);
    }

    @Test
    void supportsOneTimeScheduleCrudThroughApi() throws Exception {
        String createdBody = mockMvc.perform(post("/api/schedules")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "title": "단건 API 일정",
                      "date": "2026-04-18",
                      "startTime": "13:00:00",
                      "endTime": "14:00:00",
                      "participantIds": [1, 4]
                    }
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.title").value("단건 API 일정"))
            .andReturn()
            .getResponse()
            .getContentAsString();

        String id = com.jayway.jsonpath.JsonPath.read(createdBody, "$.id").toString();

        mockMvc.perform(get("/api/schedules/{id}", id))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.participantIds", hasSize(2)));

        mockMvc.perform(put("/api/schedules/{id}", id)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "title": "수정된 API 일정",
                      "date": "2026-04-19",
                      "startTime": "15:00:00",
                      "endTime": "16:00:00",
                      "participantIds": [2]
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.title").value("수정된 API 일정"))
            .andExpect(jsonPath("$.date").value("2026-04-19"));

        mockMvc.perform(delete("/api/schedules/{id}", id))
            .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/schedules?year=2026&month=4"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void supportsRecurringScopesThroughApi() throws Exception {
        String createdBody = mockMvc.perform(post("/api/schedules")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "title": "범위 테스트 일정",
                      "date": "2026-04-20",
                      "startTime": "10:00:00",
                      "endTime": "12:00:00",
                      "participantIds": [1],
                      "recurrence": {
                        "enabled": true,
                        "type": "WEEKLY",
                        "interval": 1,
                        "endType": "COUNT",
                        "count": 3
                      }
                    }
                    """))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();

        String id = com.jayway.jsonpath.JsonPath.read(createdBody, "$.id").toString();

        mockMvc.perform(put("/api/schedules/{id}?scope=ALL", id)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "title": "전체 반영 일정",
                      "date": "2026-04-20",
                      "startTime": "11:00:00",
                      "endTime": "13:00:00",
                      "participantIds": [2, 3]
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.title").value("전체 반영 일정"));

        mockMvc.perform(get("/api/schedules?year=2026&month=4"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(2)))
            .andExpect(jsonPath("$[0].title").value("전체 반영 일정"))
            .andExpect(jsonPath("$[1].title").value("전체 반영 일정"));

        mockMvc.perform(delete("/api/schedules/{id}?scope=ALL", id))
            .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/schedules?year=2026&month=4"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void convertsOneTimeScheduleToRecurringSeriesThroughApi() throws Exception {
        String createdBody = mockMvc.perform(post("/api/schedules")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "title": "전환 API 일정",
                      "date": "2026-04-20",
                      "startTime": "10:00:00",
                      "endTime": "12:00:00",
                      "participantIds": [1, 3]
                    }
                    """))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();

        String id = com.jayway.jsonpath.JsonPath.read(createdBody, "$.id").toString();

        mockMvc.perform(post("/api/schedules/{id}/convert-to-series", id)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "enabled": true,
                      "type": "WEEKLY",
                      "interval": 1,
                      "endType": "COUNT",
                      "count": 3
                    }
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.seriesId").isNumber())
            .andExpect(jsonPath("$.recurrence.type").value("WEEKLY"))
            .andExpect(jsonPath("$.recurrence.anchorDate").value("2026-04-20"));

        mockMvc.perform(get("/api/schedules?year=2026&month=4"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    void keepsScheduleResponseShapeStableAcrossCreateUpdateAndConvert() throws Exception {
        String createdBody = mockMvc.perform(post("/api/schedules")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "title": "응답 형태 고정 일정",
                      "date": "2026-04-21",
                      "startTime": "09:00:00",
                      "endTime": "11:00:00",
                      "participantIds": [1, 2]
                    }
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").isNumber())
            .andExpect(jsonPath("$.seriesId").doesNotExist())
            .andExpect(jsonPath("$.title").value("응답 형태 고정 일정"))
            .andExpect(jsonPath("$.date").value("2026-04-21"))
            .andExpect(jsonPath("$.startTime").value("09:00:00"))
            .andExpect(jsonPath("$.endTime").value("11:00:00"))
            .andExpect(jsonPath("$.isRecurring").value(false))
            .andExpect(jsonPath("$.isException").value(false))
            .andExpect(jsonPath("$.participantIds", hasSize(2)))
            .andExpect(jsonPath("$.participants", hasSize(2)))
            .andExpect(jsonPath("$.teamIds", hasSize(0)))
            .andExpect(jsonPath("$.teams", hasSize(0)))
            .andExpect(jsonPath("$.resource").doesNotExist())
            .andExpect(jsonPath("$.recurrence").doesNotExist())
            .andReturn()
            .getResponse()
            .getContentAsString();

        String id = com.jayway.jsonpath.JsonPath.read(createdBody, "$.id").toString();

        mockMvc.perform(put("/api/schedules/{id}", id)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "title": "응답 형태 수정 일정",
                      "date": "2026-04-22",
                      "startTime": "10:00:00",
                      "endTime": "12:00:00",
                      "participantIds": [2, 3]
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").isNumber())
            .andExpect(jsonPath("$.seriesId").doesNotExist())
            .andExpect(jsonPath("$.title").value("응답 형태 수정 일정"))
            .andExpect(jsonPath("$.date").value("2026-04-22"))
            .andExpect(jsonPath("$.startTime").value("10:00:00"))
            .andExpect(jsonPath("$.endTime").value("12:00:00"))
            .andExpect(jsonPath("$.isRecurring").value(false))
            .andExpect(jsonPath("$.isException").value(true))
            .andExpect(jsonPath("$.participantIds", hasSize(2)))
            .andExpect(jsonPath("$.participants", hasSize(2)))
            .andExpect(jsonPath("$.teamIds", hasSize(0)))
            .andExpect(jsonPath("$.teams", hasSize(0)))
            .andExpect(jsonPath("$.resource").doesNotExist())
            .andExpect(jsonPath("$.recurrence").doesNotExist());

        mockMvc.perform(post("/api/schedules/{id}/convert-to-series", id)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "enabled": true,
                      "type": "WEEKLY",
                      "interval": 1,
                      "endType": "COUNT",
                      "count": 2
                    }
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").isNumber())
            .andExpect(jsonPath("$.seriesId").value(notNullValue()))
            .andExpect(jsonPath("$.title").value("응답 형태 수정 일정"))
            .andExpect(jsonPath("$.date").value("2026-04-22"))
            .andExpect(jsonPath("$.startTime").value("10:00:00"))
            .andExpect(jsonPath("$.endTime").value("12:00:00"))
            .andExpect(jsonPath("$.isRecurring").value(true))
            .andExpect(jsonPath("$.isException").value(false))
            .andExpect(jsonPath("$.participantIds", hasSize(2)))
            .andExpect(jsonPath("$.participants", hasSize(2)))
            .andExpect(jsonPath("$.teamIds", hasSize(0)))
            .andExpect(jsonPath("$.teams", hasSize(0)))
            .andExpect(jsonPath("$.resource").doesNotExist())
            .andExpect(jsonPath("$.recurrence.type").value("WEEKLY"))
            .andExpect(jsonPath("$.recurrence.interval").value(1))
            .andExpect(jsonPath("$.recurrence.endType").value("COUNT"))
            .andExpect(jsonPath("$.recurrence.count").value(2))
            .andExpect(jsonPath("$.recurrence.anchorDate").value("2026-04-22"));
    }

    @Test
    void returnsProblemDetailsForBusinessRuleViolations() throws Exception {
        mockMvc.perform(post("/api/schedules")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "title": "잘못된 시간 일정",
                      "date": "2026-04-21",
                      "startTime": "12:00:00",
                      "endTime": "10:00:00",
                      "participantIds": [1]
                    }
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.type").value("/problems/invalid-time-range"))
            .andExpect(jsonPath("$.title").value("잘못된 시간 범위"))
            .andExpect(jsonPath("$.status").value(400))
            .andExpect(jsonPath("$.detail").value("시작 시간은 종료 시간보다 빨라야 합니다"))
            .andExpect(jsonPath("$.instance").value("/api/schedules"))
            .andExpect(jsonPath("$.code").value("INVALID_TIME_RANGE"));
    }

    @Test
    void returnsProblemDetailsForBeanValidationFailures() throws Exception {
        mockMvc.perform(post("/api/schedules")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "title": "",
                      "date": "2026-04-21",
                      "startTime": "10:00:00",
                      "endTime": "12:00:00",
                      "participantIds": [1]
                    }
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.type").value("/problems/request-validation-failed"))
            .andExpect(jsonPath("$.title").value("요청 검증 실패"))
            .andExpect(jsonPath("$.status").value(400))
            .andExpect(jsonPath("$.detail").value("title must not be blank"))
            .andExpect(jsonPath("$.instance").value("/api/schedules"))
            .andExpect(jsonPath("$.code").value("REQUEST_VALIDATION_FAILED"))
            .andExpect(jsonPath("$.errors", hasSize(1)))
            .andExpect(jsonPath("$.errors[0].field").value("title"));
    }

    @Test
    void returnsProblemDetailsForMissingSchedule() throws Exception {
        mockMvc.perform(get("/api/schedules/999999"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.type").value("/problems/schedule-occurrence-not-found"))
            .andExpect(jsonPath("$.title").value("일정 발생 정보를 찾을 수 없음"))
            .andExpect(jsonPath("$.status").value(404))
            .andExpect(jsonPath("$.detail").value("일정 발생 정보 999999를 찾을 수 없습니다"))
            .andExpect(jsonPath("$.instance").value("/api/schedules/999999"))
            .andExpect(jsonPath("$.code").value("SCHEDULE_OCCURRENCE_NOT_FOUND"));
    }
}
