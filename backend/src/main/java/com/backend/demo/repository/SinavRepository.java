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

    // Senin yazdığın Service'in aradığı fonksiyon tam olarak bu:
    @Modifying
    @Transactional
    @Query(value = "EXEC akilliSalonAta :dersKodu, :tarih, :oturumId", nativeQuery = true)
    void akilliSalonAta(
        @Param("dersKodu") String dersKodu, 
        @Param("tarih") LocalDate tarih, 
        @Param("oturumId") Integer oturumId
    );
}