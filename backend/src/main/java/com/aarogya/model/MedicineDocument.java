package com.aarogya.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "medicines")
public class MedicineDocument {

    @Id
    private String id;

    @Indexed(unique = true)
    private String code;

    @Indexed
    private String name;

    private String brandName;
    private String category;
    private String dosageForm;
    private String strength;
    private double unitPrice;

    @Indexed
    private int currentStock;

    private int minimumThreshold = 20;

    @Version
    private Long version;

    private Instant updatedAt = Instant.now();

    public MedicineDocument() {}

    public MedicineDocument(String id, String code, String name, String brandName, String category, String dosageForm, String strength, double unitPrice, int currentStock, int minimumThreshold) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.brandName = brandName;
        this.category = category;
        this.dosageForm = dosageForm;
        this.strength = strength;
        this.unitPrice = unitPrice;
        this.currentStock = currentStock;
        this.minimumThreshold = minimumThreshold;
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getBrandName() { return brandName; }
    public void setBrandName(String brandName) { this.brandName = brandName; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDosageForm() { return dosageForm; }
    public void setDosageForm(String dosageForm) { this.dosageForm = dosageForm; }

    public String getStrength() { return strength; }
    public void setStrength(String strength) { this.strength = strength; }

    public double getUnitPrice() { return unitPrice; }
    public void setUnitPrice(double unitPrice) { this.unitPrice = unitPrice; }

    public int getCurrentStock() { return currentStock; }
    public void setCurrentStock(int currentStock) { this.currentStock = currentStock; }

    public int getMinimumThreshold() { return minimumThreshold; }
    public void setMinimumThreshold(int minimumThreshold) { this.minimumThreshold = minimumThreshold; }

    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
