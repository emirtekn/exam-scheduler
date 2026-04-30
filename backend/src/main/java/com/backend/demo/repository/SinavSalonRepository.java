package com.backend.demo.repository;

import com.backend.demo.model.entity.SinavSalon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SinavSalonRepository extends JpaRepository<SinavSalon, Integer> {
    // Çakışma kontrolü için: Bu sınav daha önce bu salona atanmış mı?
    Optional<SinavSalon> findBySinavIdAndDerslikId(Integer sinavId, Integer derslikId);
}