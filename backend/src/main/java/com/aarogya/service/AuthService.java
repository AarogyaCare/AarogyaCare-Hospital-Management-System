package com.aarogya.service;

import com.aarogya.dto.AuthDtos;
import com.aarogya.exception.Exceptions;
import com.aarogya.model.DoctorDocument;
import com.aarogya.model.PatientDocument;
import com.aarogya.model.UserDocument;
import com.aarogya.repository.DoctorRepository;
import com.aarogya.repository.PatientRepository;
import com.aarogya.repository.UserRepository;
import com.aarogya.security.JwtTokenProvider;
import com.aarogya.security.UserPrincipal;
import com.aarogya.systemdesign.id.UniqueIdGeneratorService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final UniqueIdGeneratorService idGenerator;

    public AuthService(
            UserRepository userRepository,
            PatientRepository patientRepository,
            DoctorRepository doctorRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider tokenProvider,
            UniqueIdGeneratorService idGenerator) {
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.idGenerator = idGenerator;
    }

    public AuthDtos.TokenResponse login(AuthDtos.LoginRequest request) {
        String email = request.email().toLowerCase().trim();
        UserDocument user = userRepository.findByEmail(email)
                .orElseThrow(() -> new Exceptions.UnauthorizedException("Invalid email or password."));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new Exceptions.UnauthorizedException("Invalid email or password.");
        }

        String role = UserPrincipal.normalizeRole(user.getRole());
        String token = tokenProvider.generateToken(user.getId(), user.getEmail(), role);
        AuthDtos.UserDto userDto = buildUserDto(user);

        return new AuthDtos.TokenResponse(
                token,
                "bearer",
                user.getId(),
                role,
                user.getEmail(),
                user.getFullName(),
                userDto
        );
    }

    public AuthDtos.TokenResponse register(AuthDtos.RegisterRequest request) {
        String email = request.email().toLowerCase().trim();
        if (userRepository.existsByEmail(email)) {
            throw new Exceptions.ConflictException("An account with this email address already exists.");
        }

        // Security Invariant: Public registration is strictly restricted to patient accounts.
        // Administrative and clinical staff accounts must be provisioned via protected administrative endpoints.
        String role = "patient";

        String userId = UUID.randomUUID().toString();
        UserDocument user = new UserDocument(
                userId,
                email,
                passwordEncoder.encode(request.password()),
                request.fullName(),
                role,
                request.phone()
        );
        userRepository.save(user);

        // Provision patient medical record profile with full non-truncated Snowflake UHID
        String uhid = "AC-" + 2026 + "-" + Math.abs(idGenerator.nextSnowflakeId());
        PatientDocument patient = new PatientDocument(
                UUID.randomUUID().toString(),
                userId,
                uhid,
                "1990-01-01",
                "Other",
                "O+"
        );
        patientRepository.save(patient);

        String token = tokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole());
        AuthDtos.UserDto userDto = buildUserDto(user);

        return new AuthDtos.TokenResponse(
                token,
                "bearer",
                user.getId(),
                UserPrincipal.normalizeRole(user.getRole()),
                user.getEmail(),
                user.getFullName(),
                userDto
        );
    }

    public AuthDtos.UserDto createStaffUser(AuthDtos.StaffCreateRequest request, UserPrincipal adminPrincipal) {
        if (adminPrincipal == null || !"admin".equalsIgnoreCase(adminPrincipal.getRole())) {
            throw new Exceptions.ForbiddenException("Administrative privileges required to create staff accounts.");
        }

        String email = request.email().toLowerCase().trim();
        if (userRepository.existsByEmail(email)) {
            throw new Exceptions.ConflictException("An account with this email address already exists.");
        }

        String requestedRole = request.role().toLowerCase().trim();
        java.util.Set<String> validStaffRoles = java.util.Set.of("doctor", "nurse", "receptionist", "pharmacist", "billing_staff", "admin");
        if (!validStaffRoles.contains(requestedRole)) {
            throw new Exceptions.BadRequestException("Invalid staff role: " + requestedRole);
        }

        String userId = UUID.randomUUID().toString();
        UserDocument user = new UserDocument(
                userId,
                email,
                passwordEncoder.encode(request.password()),
                request.fullName(),
                requestedRole,
                request.phone()
        );
        userRepository.save(user);

        if ("doctor".equalsIgnoreCase(requestedRole)) {
            String doctorId = UUID.randomUUID().toString();
            String deptId = request.departmentId() != null ? request.departmentId() : "dept-1";
            String chamber = request.roomNumber() != null ? request.roomNumber() : "Room 101";
            String qualification = request.qualification() != null ? request.qualification() : "MBBS, MD";
            int expYears = request.experienceYears() != null ? request.experienceYears() : 5;

            DoctorDocument doctor = new DoctorDocument(
                    doctorId,
                    userId,
                    deptId,
                    qualification,
                    expYears,
                    chamber,
                    4.9,
                    java.util.List.of("General Medicine")
            );
            doctorRepository.save(doctor);
        }

        return buildUserDto(user);
    }

    public AuthDtos.UserDto getCurrentUserProfile(UserPrincipal principal) {
        UserDocument user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("User not found with id: " + principal.getId()));
        return buildUserDto(user);
    }

    private AuthDtos.UserDto buildUserDto(UserDocument user) {
        AuthDtos.PatientProfileDto patientProfileDto = null;
        Optional<PatientDocument> patientOpt = patientRepository.findByUserId(user.getId());
        if (patientOpt.isPresent()) {
            PatientDocument p = patientOpt.get();
            patientProfileDto = new AuthDtos.PatientProfileDto(p.getId(), p.getUhid(), p.getBloodGroup(), p.getGender(), p.getDateOfBirth());
        }

        AuthDtos.DoctorProfileDto doctorProfileDto = null;
        Optional<DoctorDocument> docOpt = doctorRepository.findByUserId(user.getId());
        if (docOpt.isPresent()) {
            DoctorDocument d = docOpt.get();
            doctorProfileDto = new AuthDtos.DoctorProfileDto(
                    d.getId(),
                    d.getUserId(),
                    d.getDepartmentId(),
                    d.getQualification(),
                    d.getExperienceYears(),
                    d.getRoomNumber(),
                    d.getRating(),
                    d.getSpecializations()
            );
        }

        return new AuthDtos.UserDto(
                user.getId(),
                user.getEmail(),
                UserPrincipal.normalizeRole(user.getRole()),
                user.getFullName(),
                user.getPhone(),
                user.isActive(),
                patientProfileDto,
                doctorProfileDto
        );
    }
}
