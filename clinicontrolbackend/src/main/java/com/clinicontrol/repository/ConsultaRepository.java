package com.clinicontrol.repository;

import com.clinicontrol.entity.Consulta;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConsultaRepository extends JpaRepository<Consulta, UUID> {
    List<Consulta> findByClinicIdOrderBySortOrderAsc(UUID clinicId);
    List<Consulta> findByClinicIdAndAttentionIdOrderBySortOrderAsc(UUID clinicId, UUID attentionId);
    List<Consulta> findByClinicIdAndAttentionIdInOrderBySortOrderAsc(UUID clinicId, List<UUID> attentionIds);
    Optional<Consulta> findByIdAndClinicId(UUID id, UUID clinicId);
    void deleteByIdAndClinicId(UUID id, UUID clinicId);
}
