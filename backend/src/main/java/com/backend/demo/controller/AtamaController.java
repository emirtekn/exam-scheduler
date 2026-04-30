package com.backend.demo.controller;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/atamalar")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AtamaController {

    private final JdbcTemplate jdbcTemplate;

    // Bu API, veritabanındaki tüm atamaları birleştirip React'a JSON fırlatacak
    @GetMapping("/liste")
    public List<Map<String, Object>> getTumAtamalar() {
        String sql = "SELECT " +
                     "  s.Tarih AS tarih, " +
                     "  s.OturumID AS oturumId, " +
                     "  ss.DerslikID AS derslikId, " +
                     "  d.DersAdi AS dersAdi, " +
                     "  p.PersonelID AS personelId, " +
                     "  p.Unvan AS unvan, " +
                     "  p.Soyad AS soyad " +
                     "FROM Sinav_Salonlari ss " +
                     "JOIN Sinavlar s ON ss.SinavID = s.SinavID " +
                     "JOIN Dersler d ON s.DersID = d.DersID " +
                     "LEFT JOIN Gozetmen_Atamalari ga ON ss.AtamaID = ga.AtamaID " +
                     "LEFT JOIN Personeller p ON ga.PersonelID = p.PersonelID";
                     
        return jdbcTemplate.queryForList(sql);
    }

    // Manuel olarak Arayüzden yapılan atamayı SQL Server'a kalıcı yazan API
    @PostMapping("/manuel-kaydet")
    public ResponseEntity<String> manuelAtamaKaydet(@RequestBody Map<String, Object> payload) {
        try {
            Integer sinavId = Integer.parseInt(payload.get("sinavId").toString());
            Integer derslikId = Integer.parseInt(payload.get("derslikId").toString());
            Integer personelId = Integer.parseInt(payload.get("personelId").toString());

            // 1. Sınav_Salonlari'na ekle ve SQL Server'ın ürettiği yeni AtamaID'yi yakala!
            String insertSalon = "INSERT INTO Sinav_Salonlari (SinavID, DerslikID) OUTPUT INSERTED.AtamaID VALUES (?, ?)";
            Integer atamaId = jdbcTemplate.queryForObject(insertSalon, Integer.class, sinavId, derslikId);

            // 2. O AtamaID ile gidip Gozetmen_Atamalari'na hocayı dik!
            String insertGozetmen = "INSERT INTO Gozetmen_Atamalari (AtamaID, PersonelID) VALUES (?, ?)";
            jdbcTemplate.update(insertGozetmen, atamaId, personelId);

            return ResponseEntity.ok("Başarılı");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Hata: " + e.getMessage());
        }
    }
}