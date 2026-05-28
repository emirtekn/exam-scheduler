package com.backend.demo.repository;

import com.backend.demo.model.entity.Sinav;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import jakarta.transaction.Transactional;

import java.time.LocalDate;

@Repository
public interface SinavRepository extends JpaRepository<Sinav, Integer> {

    // YENİ VE ZEKİ ROBOTUMUZ (Önbellek temizleme garantili)
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    @Query(value = "EXEC sp_AkilliSalonAta :dersId, :tarih, :oturumId", nativeQuery = true)
    void sp_AkilliSalonAta(
        @Param("dersId") Integer dersId, 
        @Param("tarih") LocalDate tarih, 
        @Param("oturumId") Integer oturumId
    );
}