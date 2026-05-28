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

    @PostMapping("/ekle")
    public ResponseEntity<String> sinavEkle(@RequestBody SinavRequestDTO request) {
        try {
            Sinav yeniSinav = new Sinav();
            Ders ders = dersRepository.findById(request.getDersId())
                    .orElseThrow(() -> new RuntimeException("Ders bulunamadı"));
            
            yeniSinav.setDers(ders);
            yeniSinav.setTarih(request.getTarih());
            
            // =========================================================
            // ÇÖZÜM 1: SQL Server NULL Kısıtlamasını Kandırma
            // =========================================================
            if (request.getOturumId() != null) {
                yeniSinav.setOturum(oturumRepository.findById(request.getOturumId()).orElse(null));
            } else {
                // SQL Server NULL kabul etmediği için geçici (dummy) olarak listedeki İLK oturumu atıyoruz.
                // Dashboard ekranından atama yapıldığında bu geçici oturum güncellenecektir!
                yeniSinav.setOturum(oturumRepository.findAll().get(0));
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
}