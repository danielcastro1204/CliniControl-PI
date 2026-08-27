package com.clinicontrol.repository;

import com.clinicontrol.entity.Profile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProfileRepository extends JpaRepository<Profile, UUID> {
    Optional<Profile> findByUserId(UUID userId);
    List<Profile> findByClinicIdOrderByLastNameAscFirstNameAsc(UUID clinicId);
    Optional<Profile> findByIdAndClinicId(UUID id, UUID clinicId);
}
