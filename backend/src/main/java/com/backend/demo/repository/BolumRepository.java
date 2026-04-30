package com.backend.demo.repository;

import com.backend.demo.model.entity.Bolum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BolumRepository extends JpaRepository<Bolum, Integer> {
    // İçine hiçbir şey yazmana gerek yok reis. 
    // JpaRepository bizim için save, findById, findAll gibi tüm metotları bedavadan sağlıyor!
}