package com.clinicontrol.repository;

import com.clinicontrol.entity.ProductInstance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductInstanceRepository extends JpaRepository<ProductInstance, UUID> {
    List<ProductInstance> findByClinicId(UUID clinicId);
    List<ProductInstance> findByClinicIdAndProductId(UUID clinicId, UUID productId);
    Optional<ProductInstance> findByIdAndClinicId(UUID id, UUID clinicId);
    void deleteByIdAndClinicId(UUID id, UUID clinicId);
}
