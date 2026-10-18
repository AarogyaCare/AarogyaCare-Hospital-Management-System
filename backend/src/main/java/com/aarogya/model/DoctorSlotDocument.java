package com.aarogya.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "doctor_slots")
@CompoundIndexes({
    @CompoundIndex(name = "doctor_slot_unique_time", def = "{'doctorId': 1, 'slotStart': 1}", unique = true)
})
public class DoctorSlotDocument {

    @Id
    private String id;

    @Indexed
    private String doctorId;

    @Indexed
    private String slotStart; // ISO format or time string e.g. "09:00 AM"

    private String slotEnd;

    @Indexed
    private String status = "AVAILABLE"; // "AVAILABLE", "BOOKED", "CANCELLED", "BLOCKED"

    private String roomNumber;

    @Version
    private Long version;

    private Instant updatedAt = Instant.now();

    public DoctorSlotDocument() {}

    public DoctorSlotDocument(String id, String doctorId, String slotStart, String slotEnd, String status, String roomNumber) {
        this.id = id;
        this.doctorId = doctorId;
        this.slotStart = slotStart;
        this.slotEnd = slotEnd;
        this.status = status;
        this.roomNumber = roomNumber;
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }

    public String getSlotStart() { return slotStart; }
    public void setSlotStart(String slotStart) { this.slotStart = slotStart; }

    public String getSlotEnd() { return slotEnd; }
    public void setSlotEnd(String slotEnd) { this.slotEnd = slotEnd; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getRoomNumber() { return roomNumber; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }

    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
