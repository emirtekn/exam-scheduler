package com.backend.demo.repository;

import com.backend.demo.model.entity.Oturum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OturumRepository extends JpaRepository<Oturum, Integer> {
}