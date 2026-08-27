package com.clinicontrol.repository;

import com.clinicontrol.entity.InventoryMovement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, UUID> {
    List<InventoryMovement> findByClinicIdOrderByCreatedAtDesc(UUID clinicId);
    List<InventoryMovement> findByClinicIdAndProductIdOrderByCreatedAtDesc(UUID clinicId, UUID productId);
    void deleteByIdAndClinicId(UUID id, UUID clinicId);
}
