package com.clinicontrol.repository;

import com.clinicontrol.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRoleRepository extends JpaRepository<UserRole, UUID> {
    Optional<UserRole> findFirstByUserId(UUID userId);
    List<UserRole> findByUserIdIn(List<UUID> userIds);

    @Modifying
    @Query(value = "INSERT INTO public.user_roles (id, user_id, role) VALUES (:id, :userId, CAST(:role AS app_role))", nativeQuery = true)
    void insertWithCast(@Param("id") UUID id, @Param("userId") UUID userId, @Param("role") String role);
}
