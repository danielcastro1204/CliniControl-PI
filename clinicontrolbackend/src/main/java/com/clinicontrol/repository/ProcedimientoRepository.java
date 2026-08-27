package com.clinicontrol.repository;

import com.clinicontrol.entity.Procedimiento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProcedimientoRepository extends JpaRepository<Procedimiento, UUID> {
    List<Procedimiento> findByClinicIdOrderBySortOrderAsc(UUID clinicId);
    List<Procedimiento> findByClinicIdAndAttentionIdOrderBySortOrderAsc(UUID clinicId, UUID attentionId);
    List<Procedimiento> findByClinicIdAndAttentionIdInOrderBySortOrderAsc(UUID clinicId, List<UUID> attentionIds);
    Optional<Procedimiento> findByIdAndClinicId(UUID id, UUID clinicId);
    void deleteByIdAndClinicId(UUID id, UUID clinicId);
}
