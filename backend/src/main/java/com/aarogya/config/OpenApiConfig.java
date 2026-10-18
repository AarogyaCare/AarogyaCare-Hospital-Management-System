package com.aarogya.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI aarogyaOpenAPI() {
        final String securitySchemeName = "bearerAuth";
        return new OpenAPI()
            .info(new Info()
                .title("Aarogya Care Scalable Hospital Management System API")
                .description("Authoritative Spring Boot REST API for Aarogya Care Hospital Management System — Backed by MongoDB and Redis.")
                .version("1.0.0")
                .contact(new Contact().name("Aarogya Care Architecture Team").email("support@aarogyacare.org"))
                .license(new License().name("MIT License")))
            .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
            .components(new Components()
                .addSecuritySchemes(securitySchemeName,
                    new SecurityScheme()
                        .name(securitySchemeName)
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")));
    }
}
