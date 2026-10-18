package com.aarogya.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "departments")
public class DepartmentDocument {

    @Id
    private String id;

    @Indexed(unique = true)
    private String code;

    private String name;
    private String description;
    private String icon;

    public DepartmentDocument() {}

    public DepartmentDocument(String id, String code, String name, String description, String icon) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.description = description;
        this.icon = icon;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
}
