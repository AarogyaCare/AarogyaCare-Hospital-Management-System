package com.aarogya.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Document(collection = "doctors")
public class DoctorDocument {

    @Id
    private String id;

    @Indexed(unique = true)
    private String userId;

    @Indexed
    private String departmentId;

    private String qualification;
    private int experienceYears;
    private String roomNumber;
    private double rating = 4.8;
    private List<String> specializations = new ArrayList<>();
    private double consultationFee = 800.0;
    private boolean isOnCall = false;

    public DoctorDocument() {}

    public DoctorDocument(String id, String userId, String departmentId, String qualification, int experienceYears, String roomNumber, double rating, List<String> specializations) {
        this(id, userId, departmentId, qualification, experienceYears, roomNumber, rating, specializations, 800.0);
    }

    public DoctorDocument(String id, String userId, String departmentId, String qualification, int experienceYears, String roomNumber, double rating, List<String> specializations, double consultationFee) {
        this.id = id;
        this.userId = userId;
        this.departmentId = departmentId;
        this.qualification = qualification;
        this.experienceYears = experienceYears;
        this.roomNumber = roomNumber;
        this.rating = rating;
        this.specializations = specializations != null ? specializations : new ArrayList<>();
        this.consultationFee = consultationFee > 0.0 ? consultationFee : 800.0;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getDepartmentId() { return departmentId; }
    public void setDepartmentId(String departmentId) { this.departmentId = departmentId; }

    public String getQualification() { return qualification; }
    public void setQualification(String qualification) { this.qualification = qualification; }

    public int getExperienceYears() { return experienceYears; }
    public void setExperienceYears(int experienceYears) { this.experienceYears = experienceYears; }

    public String getRoomNumber() { return roomNumber; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }

    public double getRating() { return rating; }
    public void setRating(double rating) { this.rating = rating; }

    public List<String> getSpecializations() { return specializations; }
    public void setSpecializations(List<String> specializations) { this.specializations = specializations; }

    public double getConsultationFee() { return consultationFee; }
    public void setConsultationFee(double consultationFee) { this.consultationFee = consultationFee; }

    public boolean isOnCall() { return isOnCall; }
    public void setOnCall(boolean onCall) { this.isOnCall = onCall; }
}
