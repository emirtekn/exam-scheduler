package com.backend.demo.repository;
import com.backend.demo.model.entity.Ders;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DersRepository extends JpaRepository<Ders, Integer> {}