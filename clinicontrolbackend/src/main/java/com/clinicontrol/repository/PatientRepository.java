package com.clinicontrol.repository;

import com.clinicontrol.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PatientRepository extends JpaRepository<Patient, UUID> {
    List<Patient> findByClinicIdOrderByPrimerApellidoAscSegundoApellidoAscNombresAsc(UUID clinicId);
    List<Patient> findByIdInAndClinicId(List<UUID> ids, UUID clinicId);
    Optional<Patient> findByIdAndClinicId(UUID id, UUID clinicId);
    Optional<Patient> findByClinicIdAndNumDocumentoIdentificacion(UUID clinicId, String numDocumentoIdentificacion);
    void deleteByIdAndClinicId(UUID id, UUID clinicId);
}
