package com.backend.demo.controller;

import com.backend.demo.model.dto.SinavRequestDTO;
import com.backend.demo.model.entity.Ders;
import com.backend.demo.model.entity.Sinav;
import com.backend.demo.repository.DersRepository;
import com.backend.demo.repository.OturumRepository;
import com.backend.demo.repository.SinavRepository;
import com.backend.demo.service.SinavService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sinavlar")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class SinavController {

    private final SinavRepository sinavRepository;
    private final SinavService sinavService;
    private final DersRepository dersRepository; 
    private final OturumRepository oturumRepository;
    private final JdbcTemplate jdbcTemplate;

    @PostMapping("/ekle")
    public ResponseEntity<String> sinavEkle(@RequestBody SinavRequestDTO request) {
        try {
            Sinav yeniSinav = new Sinav();
            Ders ders = dersRepository.findById(request.getDersId())
                    .orElseThrow(() -> new RuntimeException("Ders bulunamadı"));
            
            yeniSinav.setDers(ders);
            yeniSinav.setTarih(request.getTarih());

            if (request.getOturumId() != null) {
                yeniSinav.setOturum(oturumRepository.findById(request.getOturumId()).orElse(null));
            } else {
                // Planlama aşaması: oturum henüz atanmadı (NULL). alter_sinavlar_oturum_null.sql gerekli.
                yeniSinav.setOturum(null);
            }

            sinavRepository.save(yeniSinav);
            return ResponseEntity.ok("Sınav başarıyla tanımlandı (Henüz salon/hoca atanmadı).");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Hata: " + e.getMessage());
        }
    }

    @PostMapping("/manuel-kaydet")
    public ResponseEntity<String> manuelAtamaKaydet(@RequestBody Map<String, Object> payload) {
        try {
            if (payload.get("dersId") == null || payload.get("personelId") == null || 
                payload.get("tarih") == null || payload.get("oturumId") == null || payload.get("derslikId") == null) {
                return ResponseEntity.badRequest().body("Eksik veri gönderildi! Lütfen alanları doldurun.");
            }

            Integer dersId = Integer.parseInt(payload.get("dersId").toString());
            String tarih = payload.get("tarih").toString();
            Integer oturumId = Integer.parseInt(payload.get("oturumId").toString());
            Integer derslikId = Integer.parseInt(payload.get("derslikId").toString());
            Integer personelId = Integer.parseInt(payload.get("personelId").toString());

            sinavService.kisitlariDenetleVeManuelAta(dersId, tarih, oturumId, derslikId, personelId);
            return ResponseEntity.ok("Atama kurallara uygun! Başarıyla kaydedildi.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/otomatik-ata")
    public ResponseEntity<String> otomatikAtamaYap(@RequestBody SinavRequestDTO request) {
        try {
            sinavService.otomatikSalonAta(request.getDersId(), request.getTarih(), request.getOturumId());
            return ResponseEntity.ok("Zeki robot salon atamalarını kusursuz şekilde tamamladı!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Otomatik Atama Hatası: " + e.getMessage());
        }
    }

    @GetMapping("/liste")
    public ResponseEntity<List<Sinav>> tumSinavlariGetir() {
        return ResponseEntity.ok(sinavRepository.findAll());
    }

    @DeleteMapping("/sil/{sinavId}")
    @Transactional
    public ResponseEntity<String> sinavSil(@PathVariable Integer sinavId) {
        try {
            if (!sinavRepository.existsById(sinavId)) {
                return ResponseEntity.badRequest().body("Silinecek sınav bulunamadı.");
            }

            // 1) Gözetmen atamaları (salon atamasına bağlı)
            jdbcTemplate.update(
                "DELETE FROM Gozetmen_Atamalari WHERE AtamaID IN (SELECT AtamaID FROM Sinav_Salonlari WHERE SinavID = ?)",
                sinavId
            );
            // 2) Salon atamaları
            jdbcTemplate.update("DELETE FROM Sinav_Salonlari WHERE SinavID = ?", sinavId);
            // 3) Sınav kaydı
            jdbcTemplate.update("DELETE FROM Sinavlar WHERE SinavID = ?", sinavId);

            return ResponseEntity.ok("Sınav ve ilişkili atamalar başarıyla silindi.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Silme hatası: " + e.getMessage());
        }
    }
}