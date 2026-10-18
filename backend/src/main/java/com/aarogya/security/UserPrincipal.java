package com.aarogya.security;

import com.aarogya.model.UserDocument;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

public class UserPrincipal implements UserDetails {

    private final String id;
    private final String email;
    private final String password;
    private final String role;
    private final String fullName;
    private final Collection<? extends GrantedAuthority> authorities;
    private final boolean active;

    public UserPrincipal(String id, String email, String password, String role, String fullName, boolean active) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.role = role != null ? role.toLowerCase() : "patient";
        this.fullName = fullName;
        this.active = active;
        this.authorities = Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + this.role.toUpperCase()));
    }

    public static UserPrincipal create(UserDocument user) {
        return new UserPrincipal(
            user.getId(),
            user.getEmail(),
            user.getPasswordHash(),
            user.getRole(),
            user.getFullName(),
            user.isActive()
        );
    }

    public String getId() { return id; }
    public String getRole() { return role; }
    public String getFullName() { return fullName; }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() { return authorities; }

    @Override
    public String getPassword() { return password; }

    @Override
    public String getUsername() { return email; }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return active; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return active; }
}
