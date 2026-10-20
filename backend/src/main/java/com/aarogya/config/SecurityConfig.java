package com.aarogya.config;

import com.aarogya.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public authentication & account registration
                .requestMatchers("/api/v1/auth/login", "/api/v1/auth/register").permitAll()
                // Public discovery and catalogues
                .requestMatchers(HttpMethod.GET, "/api/v1/departments/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/specializations/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/doctors/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/medicines/**").permitAll()
                // Public system-design components & health probes
                .requestMatchers("/s/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/autocomplete/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/autocomplete/rebuild").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/v1/short-links/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/short-links").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/short-links/*/revoke").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/v1/crawler/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/crawler/jobs").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/v1/system-design/telemetry").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/v1/system-design/ratelimiter/metrics").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/v1/system-design/hashring/nodes/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/v1/system-design/hashring/nodes/**").hasRole("ADMIN")
                .requestMatchers("/api/v1/system-design/**").permitAll()
                .requestMatchers("/health/**").permitAll()
                // Emergency intake registration (public emergency intake with rate limiter priority bypass)
                .requestMatchers(HttpMethod.POST, "/api/v1/emergency/requests").permitAll()
                // API Documentation & Swagger
                .requestMatchers("/docs/**", "/swagger-ui/**", "/v3/api-docs/**", "/api/v1/openapi.json").permitAll()
                // Keep liveness public; operational details are administrator-only.
                .requestMatchers("/actuator/health", "/actuator/health/**").permitAll()
                .requestMatchers("/actuator/**").hasRole("ADMIN")
                // All other hospital operational endpoints require valid authentication
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5180",
            "http://127.0.0.1:5180",
            "http://localhost:5181",
            "http://127.0.0.1:5181",
            "http://localhost:5183",
            "http://127.0.0.1:5183",
            "http://localhost:8081",
            "http://127.0.0.1:8081",
            "http://localhost:8000",
            "http://127.0.0.1:8000",
            "http://localhost:8080",
            "http://127.0.0.1:8080"
        ));
        configuration.setAllowedOriginPatterns(Arrays.asList(
            "http://localhost:[*]",
            "http://127.0.0.1:[*]"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
