package com.aarogya.service;

import com.aarogya.exception.Exceptions;
import com.aarogya.model.DepartmentDocument;
import com.aarogya.model.DoctorDocument;
import com.aarogya.model.DoctorSlotDocument;
import com.aarogya.model.UserDocument;
import com.aarogya.repository.DepartmentRepository;
import com.aarogya.repository.DoctorRepository;
import com.aarogya.repository.DoctorSlotRepository;
import com.aarogya.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final DoctorSlotRepository slotRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;

    public DoctorService(
            DoctorRepository doctorRepository,
            DoctorSlotRepository slotRepository,
            UserRepository userRepository,
            DepartmentRepository departmentRepository) {
        this.doctorRepository = doctorRepository;
        this.slotRepository = slotRepository;
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
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
        return map;
    }

    public List<Map<String, Object>> getSlotsByDoctor(String doctorId) {
        List<DoctorSlotDocument> slots = slotRepository.findByDoctorId(doctorId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (DoctorSlotDocument s : slots) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", s.getId());
            m.put("doctor_id", s.getDoctorId());
            m.put("slot_start", s.getSlotStart());
            m.put("slot_end", s.getSlotEnd());
            m.put("status", s.getStatus());
            m.put("room_number", s.getRoomNumber());
            result.add(m);
        }
        return result;
    }
}
