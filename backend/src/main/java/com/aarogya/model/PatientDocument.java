package com.aarogya.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "patients")
public class PatientDocument {

    @Id
    private String id;

    @Indexed(unique = true)
    private String userId;

    @Indexed(unique = true)
    private String uhid;

    private String dateOfBirth;
    private String gender;
    private String bloodGroup;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String allergies;
    private String chronicConditions;
    private String address;
    private Instant createdAt = Instant.now();

    public PatientDocument() {}

    public PatientDocument(String id, String userId, String uhid, String dateOfBirth, String gender, String bloodGroup) {
        this.id = id;
        this.userId = userId;
        this.uhid = uhid;
        this.dateOfBirth = dateOfBirth;
        this.gender = gender;
        this.bloodGroup = bloodGroup;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getUhid() { return uhid; }
    public void setUhid(String uhid) { this.uhid = uhid; }

    public String getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(String dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getBloodGroup() { return bloodGroup; }
    public void setBloodGroup(String bloodGroup) { this.bloodGroup = bloodGroup; }

    public String getEmergencyContactName() { return emergencyContactName; }
    public void setEmergencyContactName(String emergencyContactName) { this.emergencyContactName = emergencyContactName; }

    public String getEmergencyContactPhone() { return emergencyContactPhone; }
    public void setEmergencyContactPhone(String emergencyContactPhone) { this.emergencyContactPhone = emergencyContactPhone; }

    public String getAllergies() { return allergies; }
    public void setAllergies(String allergies) { this.allergies = allergies; }

    public String getChronicConditions() { return chronicConditions; }
    public void setChronicConditions(String chronicConditions) { this.chronicConditions = chronicConditions; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
