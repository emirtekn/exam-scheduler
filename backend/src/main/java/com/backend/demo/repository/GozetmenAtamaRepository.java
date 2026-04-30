package com.backend.demo.repository;

import com.backend.demo.model.entity.GozetmenAtama;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GozetmenAtamaRepository extends JpaRepository<GozetmenAtama, Integer> {
    // Manuel güncelleme yaparken eski atamayı bulmak için
    GozetmenAtama findByAtamaId(Integer atamaId);
}