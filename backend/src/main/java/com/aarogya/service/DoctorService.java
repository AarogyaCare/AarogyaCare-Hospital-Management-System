package com.aarogya.service;

import com.aarogya.exception.Exceptions;
import com.aarogya.model.DepartmentDocument;
import com.aarogya.model.DoctorDocument;
import com.aarogya.model.DoctorSlotDocument;
import com.aarogya.model.UserDocument;
import com.aarogya.repository.DepartmentRepository;
import com.aarogya.repository.AppointmentRepository;
import com.aarogya.repository.DoctorRepository;
import com.aarogya.repository.DoctorSlotRepository;
import com.aarogya.repository.UserRepository;
import com.aarogya.systemdesign.cache.CacheService;
import com.aarogya.util.DateTimeUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.*;

@Service
public class DoctorService {

    private static final Duration DOCTOR_CACHE_TTL = Duration.ofMinutes(5);
    private static final String DOCTOR_LIST_CACHE_PREFIX = "doctors:list:";

    private final DoctorRepository doctorRepository;
    private final DoctorSlotRepository slotRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final AppointmentRepository appointmentRepository;
    private final CacheService cacheService;
    private final Clock clock;

    @Autowired
    public DoctorService(
            DoctorRepository doctorRepository,
            DoctorSlotRepository slotRepository,
            UserRepository userRepository,
            DepartmentRepository departmentRepository,
            AppointmentRepository appointmentRepository,
            CacheService cacheService) {
        this(
                doctorRepository,
                slotRepository,
                userRepository,
                departmentRepository,
                appointmentRepository,
                cacheService,
                Clock.system(ZoneId.of("Asia/Kolkata"))
        );
    }

    public DoctorService(
            DoctorRepository doctorRepository,
            DoctorSlotRepository slotRepository,
            UserRepository userRepository,
            DepartmentRepository departmentRepository,
            AppointmentRepository appointmentRepository,
            CacheService cacheService,
            Clock clock) {
        this.doctorRepository = doctorRepository;
        this.slotRepository = slotRepository;
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.appointmentRepository = appointmentRepository;
        this.cacheService = cacheService;
        this.clock = clock != null ? clock : Clock.system(ZoneId.of("Asia/Kolkata"));
    }

    public Map<String, Object> getAllDoctors(
            String departmentId,
            String search,
            int limit) {
        return getAllDoctors(departmentId, search, limit, null);
    }

    public Map<String, Object> getAllDoctors(
            String departmentId,
            String search,
            int limit,
            Boolean onCallOnly) {

        String normalizedDepartment = departmentId == null
                ? ""
                : departmentId.trim().toLowerCase(Locale.ROOT);

        String normalizedSearch = search == null
                ? ""
                : search.trim().toLowerCase(Locale.ROOT);

        String cacheKey = DOCTOR_LIST_CACHE_PREFIX
                + "department=" + normalizedDepartment
                + ":search=" + normalizedSearch
                + ":limit=" + limit
                + ":onCall=" + (onCallOnly == null ? "all" : onCallOnly);

        @SuppressWarnings("unchecked")
        Map<String, Object> cachedResponse =
                cacheService.get(cacheKey, Map.class);

        if (cachedResponse != null) {
            return cachedResponse;
        }

        List<DoctorDocument> docs;

        if (Boolean.TRUE.equals(onCallOnly)) {
            docs = doctorRepository.findByIsOnCall(true);
        } else if (departmentId != null && !departmentId.isEmpty()) {
            docs = doctorRepository.findByDepartmentId(departmentId);
        } else {
            docs = doctorRepository.findAll();
        }

        List<Map<String, Object>> items = new ArrayList<>();

        for (DoctorDocument doc : docs) {
            UserDocument user = userRepository.findById(doc.getUserId())
                    .orElse(null);

            DepartmentDocument dept = departmentRepository
                    .findById(doc.getDepartmentId())
                    .orElse(null);

            String fullName = user != null
                    ? user.getFullName()
                    : "Dr. Specialist";

            String deptName = dept != null
                    ? dept.getName()
                    : "General Medicine";

            if (search != null && !search.trim().isEmpty()) {
                String query = search.trim().toLowerCase(Locale.ROOT);

                boolean matchesName = fullName != null
                        && fullName.toLowerCase(Locale.ROOT).contains(query);

                boolean matchesDepartment = deptName != null
                        && deptName.toLowerCase(Locale.ROOT).contains(query);

                boolean matchesSpecialization = doc.getSpecializations() != null
                        && doc.getSpecializations().stream()
                        .filter(Objects::nonNull)
                        .anyMatch(s -> s.toLowerCase(Locale.ROOT).contains(query));

                if (!matchesName && !matchesDepartment && !matchesSpecialization) {
                    continue;
                }
            }

            items.add(buildDoctorMap(doc, fullName, deptName));

            if (limit > 0 && items.size() >= limit) {
                break;
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("items", items);
        response.put("total", items.size());

        cacheService.set(cacheKey, response, DOCTOR_CACHE_TTL);

        return response;
    }

    public Map<String, Object> getDoctorById(String id) {
        DoctorDocument doc = doctorRepository.findById(id)
                .orElseThrow(() ->
                        new Exceptions.ResourceNotFoundException(
                                "Doctor not found with id: " + id
                        ));

        UserDocument user = userRepository.findById(doc.getUserId())
                .orElse(null);

        DepartmentDocument dept = departmentRepository
                .findById(doc.getDepartmentId())
                .orElse(null);

        String fullName = user != null
                ? user.getFullName()
                : "Dr. Specialist";

        String deptName = dept != null
                ? dept.getName()
                : "Specialist Care";

        return buildDoctorMap(doc, fullName, deptName);
    }

    public Map<String, Object> toggleOnCall(String doctorId, boolean isOnCall) {
        DoctorDocument doc = doctorRepository.findById(doctorId)
                .orElseThrow(() ->
                        new Exceptions.ResourceNotFoundException(
                                "Doctor not found with id: " + doctorId
                        ));

        doc.setOnCall(isOnCall);
        doctorRepository.save(doc);

        cacheService.evictByPrefix(DOCTOR_LIST_CACHE_PREFIX);

        UserDocument user = userRepository.findById(doc.getUserId())
                .orElse(null);

        DepartmentDocument dept = departmentRepository
                .findById(doc.getDepartmentId())
                .orElse(null);

        String fullName = user != null
                ? user.getFullName()
                : "Dr. Specialist";

        String deptName = dept != null
                ? dept.getName()
                : "General Medicine";

        return buildDoctorMap(doc, fullName, deptName);
    }

    private Map<String, Object> buildDoctorMap(
            DoctorDocument doc,
            String fullName,
            String deptName) {

        Map<String, Object> map = new HashMap<>();
        map.put("id", doc.getId());
        map.put("user_id", doc.getUserId());
        map.put("department_id", doc.getDepartmentId());
        map.put("department_name", deptName);
        map.put("full_name", fullName);
        map.put("qualification", doc.getQualification());
        map.put("experience_years", doc.getExperienceYears());
        map.put("room_number", doc.getRoomNumber());
        map.put("rating", doc.getRating());
        map.put("specializations", doc.getSpecializations());
        map.put("consultation_fee", doc.getConsultationFee());
        map.put("is_on_call", doc.isOnCall());

        return map;
    }

    public List<Map<String, Object>> getSlotsByDoctor(
            String doctorId,
            String appointmentDate) {

        String effectiveDate = (appointmentDate != null
                && !appointmentDate.isBlank())
                ? appointmentDate.trim()
                : LocalDate.now(clock).toString();

        LocalDate requestedDate = null;

        try {
            requestedDate = LocalDate.parse(effectiveDate);
        } catch (Exception ignored) {
        }

        LocalDate today = LocalDate.now(clock);
        LocalDateTime currentDateTime = LocalDateTime.now(clock);

        List<DoctorSlotDocument> slots =
                slotRepository.findByDoctorId(doctorId);

        List<Map<String, Object>> result = new ArrayList<>();

        for (DoctorSlotDocument slot : slots) {
            String status = slot.getStatus();

            if ("BLOCKED".equalsIgnoreCase(status)
                    || "CANCELLED".equalsIgnoreCase(status)) {
                continue;
            }

            boolean isBooked =
                    appointmentRepository
                            .existsByDoctorIdAndSlotIdAndAppointmentDateAndStatusNot(
                                    doctorId,
                                    slot.getId(),
                                    effectiveDate,
                                    "CANCELLED"
                            );

            if (isBooked) {
                status = "BOOKED";
            } else if (requestedDate != null
                    && requestedDate.isBefore(today)) {
                status = "PASSED";
            } else if (requestedDate != null
                    && requestedDate.isEqual(today)) {

                LocalTime slotTime =
                        DateTimeUtils.parseSlotTime(slot.getSlotStart());

                if (slotTime != null
                        && !LocalDateTime.of(today, slotTime)
                        .isAfter(currentDateTime)) {
                    status = "PASSED";
                } else {
                    status = "AVAILABLE";
                }
            } else {
                status = "AVAILABLE";
            }

            Map<String, Object> slotMap = new HashMap<>();
            slotMap.put("id", slot.getId());
            slotMap.put("doctor_id", slot.getDoctorId());
            slotMap.put("slot_start", slot.getSlotStart());
            slotMap.put("slot_end", slot.getSlotEnd());
            slotMap.put("status", status);
            slotMap.put("room_number", slot.getRoomNumber());

            result.add(slotMap);
        }

        return result;
    }
}