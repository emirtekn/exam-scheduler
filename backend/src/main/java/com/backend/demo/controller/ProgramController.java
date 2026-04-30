package com.backend.demo.controller;

import com.backend.demo.model.dto.ProgramGörünümüDTO;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/program")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ProgramController {

    private final EntityManager entityManager;

    @GetMapping("/detayli")
    public List<ProgramGörünümüDTO> getProgramDetay() {
        // Senin veritabanındaki tüm tabloları joinleyerek tek bir liste alıyoruz
        String sql = "SELECT new com.backend.demo.model.dto.ProgramGörünümüDTO(" +
                     "s.tarih, o.tanim, dsl.ad, d.dersAdi, d.dersKodu, " +
                     "CONCAT(p.unvan, ' ', p.ad, ' ', p.soyad)) " +
                     "FROM Sinav s " +
                     "JOIN s.ders d " +
                     "JOIN s.oturum o " +
                     "JOIN SinavSalon ss ON ss.sinavId = s.sinavId " +
                     "JOIN Derslik dsl ON dsl.derslikId = ss.derslikId " +
                     "JOIN GozetmenAtama ga ON ga.atamaId = ss.atamaId " +
                     "JOIN Personel p ON p.personelId = ga.personelId";
        
        return entityManager.createQuery(sql, ProgramGörünümüDTO.class).getResultList();
    }
}