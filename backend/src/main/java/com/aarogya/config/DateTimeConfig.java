package com.aarogya.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;
import java.time.ZoneId;

@Configuration
public class DateTimeConfig {

    @Bean
    public ZoneId hospitalZoneId(@Value("${aarogya.timezone:Asia/Kolkata}") String timezone) {
        return ZoneId.of(timezone.trim());
    }

    @Bean
    public Clock hospitalClock(ZoneId hospitalZoneId) {
        return Clock.system(hospitalZoneId);
    }
}
