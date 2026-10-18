package com.aarogya.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public class PharmacyDtos {

    public record StockAdjustmentRequest(
        @NotBlank @JsonProperty("medicine_id") String medicineId,
        @NotBlank @JsonProperty("adjustment_type") String adjustmentType, // "DISPENSE", "RESTOCK", "AUDIT_ADJUSTMENT"
        @Min(1) int quantity,
        @JsonProperty("reference_id") String referenceId
    ) {}

    public record StockAdjustmentResponse(
        @JsonProperty("transaction_id") String transactionId,
        @JsonProperty("medicine_id") String medicineId,
        @JsonProperty("previous_stock") int previousStock,
        @JsonProperty("new_stock") int newStock,
        String status
    ) {}

    public record MedicineResponse(
        String id,
        String code,
        String name,
        @JsonProperty("brand_name") String brandName,
        String category,
        @JsonProperty("dosage_form") String dosageForm,
        String strength,
        @JsonProperty("unit_price") double unitPrice,
        @JsonProperty("current_stock") int currentStock,
        @JsonProperty("minimum_threshold") int minimumThreshold,
        @JsonProperty("is_low_stock") boolean isLowStock
    ) {}

    public record InventoryItemResponse(
        String id,
        String code,
        String name,
        @JsonProperty("brand_name") String brandName,
        String category,
        @JsonProperty("dosage_form") String dosageForm,
        String strength,
        @JsonProperty("unit_price") double unitPrice,
        @JsonProperty("current_stock") int currentStock,
        @JsonProperty("minimum_threshold") int minimumThreshold,
        @JsonProperty("stock_status") String stockStatus
    ) {}
}
