package com.aarogya.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "specializations")
public class SpecializationDocument {

    @Id
    private String id;

    @Indexed
    private String departmentId;

    private String name;

    public SpecializationDocument() {}

    public SpecializationDocument(String id, String departmentId, String name) {
        this.id = id;
        this.departmentId = departmentId;
        this.name = name;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getDepartmentId() { return departmentId; }
    public void setDepartmentId(String departmentId) { this.departmentId = departmentId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
