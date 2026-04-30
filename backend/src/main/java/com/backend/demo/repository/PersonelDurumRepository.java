package com.backend.demo.repository;

import com.backend.demo.model.entity.PersonelDurum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PersonelDurumRepository extends JpaRepository<PersonelDurum, Integer> {
    List<PersonelDurum> findByPersonelId(Integer personelId);
}