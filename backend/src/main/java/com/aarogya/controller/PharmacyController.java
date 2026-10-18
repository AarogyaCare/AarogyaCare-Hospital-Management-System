package com.aarogya.controller;

import com.aarogya.dto.PharmacyDtos;
import com.aarogya.security.UserPrincipal;
import com.aarogya.service.PharmacyService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class PharmacyController {

    private final PharmacyService pharmacyService;

    public PharmacyController(PharmacyService pharmacyService) {
        this.pharmacyService = pharmacyService;
    }

    @GetMapping("/medicines")
    public ResponseEntity<List<PharmacyDtos.MedicineResponse>> getAllMedicines() {
        return ResponseEntity.ok(pharmacyService.getAllMedicines());
    }

    @GetMapping("/pharmacy/inventory")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN')")
    public ResponseEntity<List<PharmacyDtos.InventoryItemResponse>> getInventory() {
        return ResponseEntity.ok(pharmacyService.getInventory());
    }

    @PostMapping("/pharmacy/stock-adjustments")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN')")
    public ResponseEntity<PharmacyDtos.StockAdjustmentResponse> adjustStock(
            @Valid @RequestBody PharmacyDtos.StockAdjustmentRequest request,
            @RequestHeader(required = false, name = "Idempotency-Key") String idempotencyKey,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(pharmacyService.adjustStock(request, idempotencyKey, principal));
    }
}
