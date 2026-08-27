package com.clinicontrol.repository;

import com.clinicontrol.entity.Dentist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DentistRepository extends JpaRepository<Dentist, UUID> {
    List<Dentist> findByClinicIdOrderByLastName1AscLastName2AscFirstNameAsc(UUID clinicId);
    Optional<Dentist> findByIdAndClinicId(UUID id, UUID clinicId);
    Optional<Dentist> findByClinicIdAndIdentification(UUID clinicId, String identification);
    void deleteByIdAndClinicId(UUID id, UUID clinicId);
}
