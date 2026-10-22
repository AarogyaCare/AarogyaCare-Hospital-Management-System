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
import com.aarogya.util.DateTimeUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.*;

@Service
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final DoctorSlotRepository slotRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final AppointmentRepository appointmentRepository;
    private final Clock clock;

    public DoctorService(
            DoctorRepository doctorRepository,
            DoctorSlotRepository slotRepository,
            UserRepository userRepository,
            DepartmentRepository departmentRepository,
            AppointmentRepository appointmentRepository) {
        this(doctorRepository, slotRepository, userRepository, departmentRepository, appointmentRepository,
                Clock.system(ZoneId.of("Asia/Kolkata")));
    }

    @Autowired
    public DoctorService(
            DoctorRepository doctorRepository,
            DoctorSlotRepository slotRepository,
            UserRepository userRepository,
            DepartmentRepository departmentRepository,
            AppointmentRepository appointmentRepository,
            Clock clock) {
        this.doctorRepository = doctorRepository;
        this.slotRepository = slotRepository;
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.appointmentRepository = appointmentRepository;
        this.clock = clock != null ? clock : Clock.system(ZoneId.of("Asia/Kolkata"));
    }

    public Map<String, Object> getAllDoctors(String departmentId, String search, int limit) {
        List<DoctorDocument> docs;
        if (departmentId != null && !departmentId.isEmpty()) {
            docs = doctorRepository.findByDepartmentId(departmentId);
        } else {
            docs = doctorRepository.findAll();
        }

        List<Map<String, Object>> items = new ArrayList<>();
        for (DoctorDocument doc : docs) {
            UserDocument user = userRepository.findById(doc.getUserId()).orElse(null);
            DepartmentDocument dept = departmentRepository.findById(doc.getDepartmentId()).orElse(null);

            String fullName = user != null ? user.getFullName() : "Dr. Specialist";
            String deptName = dept != null ? dept.getName() : "General Medicine";

            if (search != null && !search.trim().isEmpty()) {
                String q = search.toLowerCase().trim();
                boolean matchesName = fullName.toLowerCase().contains(q);
                boolean matchesDept = deptName.toLowerCase().contains(q);
                boolean matchesSpec = doc.getSpecializations().stream().anyMatch(s -> s.toLowerCase().contains(q));
                if (!matchesName && !matchesDept && !matchesSpec) {
                    continue;
                }
            }

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
            items.add(map);

            if (limit > 0 && items.size() >= limit) {
                break;
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("items", items);
        response.put("total", items.size());
        return response;
    }

    public Map<String, Object> getDoctorById(String id) {
        DoctorDocument doc = doctorRepository.findById(id)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Doctor not found with id: " + id));

        UserDocument user = userRepository.findById(doc.getUserId()).orElse(null);
        DepartmentDocument dept = departmentRepository.findById(doc.getDepartmentId()).orElse(null);

        Map<String, Object> map = new HashMap<>();
        map.put("id", doc.getId());
        map.put("user_id", doc.getUserId());
        map.put("department_id", doc.getDepartmentId());
        map.put("department_name", dept != null ? dept.getName() : "Specialist Care");
        map.put("full_name", user != null ? user.getFullName() : "Dr. Specialist");
        map.put("qualification", doc.getQualification());
        map.put("experience_years", doc.getExperienceYears());
        map.put("room_number", doc.getRoomNumber());
        map.put("rating", doc.getRating());
        map.put("specializations", doc.getSpecializations());
        map.put("consultation_fee", doc.getConsultationFee());
        return map;
    }

    public List<Map<String, Object>> getSlotsByDoctor(String doctorId, String appointmentDate) {
        String effectiveDate = (appointmentDate != null && !appointmentDate.isBlank())
                ? appointmentDate.trim()
                : LocalDate.now(clock).toString();

        LocalDate reqDate = null;
        try {
            reqDate = LocalDate.parse(effectiveDate);
        } catch (Exception ignored) {}

        LocalDate today = LocalDate.now(clock);
        LocalDateTime currentDateTime = LocalDateTime.now(clock);

        List<DoctorSlotDocument> slots = slotRepository.findByDoctorId(doctorId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (DoctorSlotDocument s : slots) {
            String status = s.getStatus();
            if ("BLOCKED".equalsIgnoreCase(status) || "CANCELLED".equalsIgnoreCase(status)) continue;

            boolean isBooked = appointmentRepository.existsByDoctorIdAndSlotIdAndAppointmentDateAndStatusNot(
                    doctorId, s.getId(), effectiveDate, "CANCELLED");

            if (isBooked) {
                status = "BOOKED";
            } else if (reqDate != null && reqDate.isBefore(today)) {
                status = "PASSED";
            } else if (reqDate != null && reqDate.isEqual(today)) {
                LocalTime slotTime = DateTimeUtils.parseSlotTime(s.getSlotStart());
                if (slotTime != null && !LocalDateTime.of(today, slotTime).isAfter(currentDateTime)) {
                    status = "PASSED";
                } else {
                    status = "AVAILABLE";
                }
            } else {
                status = "AVAILABLE";
            }

            Map<String, Object> m = new HashMap<>();
            m.put("id", s.getId());
            m.put("doctor_id", s.getDoctorId());
            m.put("slot_start", s.getSlotStart());
            m.put("slot_end", s.getSlotEnd());
            m.put("status", status);
            m.put("room_number", s.getRoomNumber());
            result.add(m);
        }
        return result;
    }
}
