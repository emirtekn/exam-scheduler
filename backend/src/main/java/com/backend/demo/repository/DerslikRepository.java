package com.backend.demo.repository;

import com.backend.demo.model.entity.Derslik;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DerslikRepository extends JpaRepository<Derslik, Integer> {
}