package com.clinicontrol.repository;

import com.clinicontrol.entity.Attention;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AttentionRepository extends JpaRepository<Attention, UUID> {
    List<Attention> findByClinicIdOrderByCreatedAtDesc(UUID clinicId);
    List<Attention> findByClinicIdAndPatientIdOrderByCreatedAtDesc(UUID clinicId, UUID patientId);
    Optional<Attention> findByIdAndClinicId(UUID id, UUID clinicId);
    List<Attention> findByIdInAndClinicId(List<UUID> ids, UUID clinicId);
    void deleteByIdAndClinicId(UUID id, UUID clinicId);
}
