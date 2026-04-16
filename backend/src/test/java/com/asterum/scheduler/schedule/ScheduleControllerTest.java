package com.asterum.scheduler.schedule;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
}
