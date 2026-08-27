package com.clinicontrol.security;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter @Setter
public class AuthenticatedUser {
    private UUID id;
    private String email;
    private String role;
    private UUID clinicId;

    public AuthenticatedUser(UUID id, String email, String role, UUID clinicId) {
        this.id = id;
        this.email = email;
        this.role = role;
        this.clinicId = clinicId;
    }
}
