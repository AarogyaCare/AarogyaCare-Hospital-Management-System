package com.aarogya.util;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.format.DateTimeParseException;
import java.util.Locale;

public final class DateTimeUtils {

    private static final DateTimeFormatter TIME_FORMATTER = new DateTimeFormatterBuilder()
            .parseCaseInsensitive()
            .appendPattern("[hh:mm a][h:mm a][hh:mma][h:mma][HH:mm][H:mm]")
            .toFormatter(Locale.ENGLISH);

    private DateTimeUtils() {}

    public static LocalTime parseSlotTime(String timeStr) {
        if (timeStr == null || timeStr.isBlank()) {
            return null;
        }
        String cleaned = timeStr.trim().toUpperCase().replaceAll("\\s+", " ");
        try {
            return LocalTime.parse(cleaned, TIME_FORMATTER);
        } catch (DateTimeParseException ex) {
            try {
                return LocalTime.parse(cleaned);
            } catch (Exception ignored) {
                return null;
            }
        }
    }
}
