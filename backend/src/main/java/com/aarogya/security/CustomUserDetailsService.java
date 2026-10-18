package com.aarogya.security;

import com.aarogya.model.UserDocument;
import com.aarogya.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        UserDocument user = userRepository.findByEmail(email.toLowerCase().trim())
            .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
        return UserPrincipal.create(user);
    }

    public UserDetails loadUserById(String id) {
        UserDocument user = userRepository.findById(id)
            .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + id));
        return UserPrincipal.create(user);
    }
}
