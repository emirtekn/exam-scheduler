package com.backend.demo.controller;

import com.backend.demo.model.dto.SinavRequestDTO;
import com.backend.demo.model.entity.Sinav;
import com.backend.demo.model.entity.Ders; 
import com.backend.demo.repository.DersRepository;
import com.backend.demo.repository.OturumRepository;
import com.backend.demo.repository.SinavRepository;
import com.backend.demo.service.SinavService; // ROBOTUMUZU ÇAĞIRIYORUZ
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sinavlar")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class SinavController {

    private final SinavRepository sinavRepository;
    private final DersRepository dersRepository;
    private final OturumRepository oturumRepository;
    private final SinavService sinavService; // SERVICE BURAYA EKLENDİ

    @PostMapping("/ekle")
    public ResponseEntity<String> sinavEkle(@RequestBody SinavRequestDTO request) {
        try {
            Sinav yeniSinav = new Sinav();
            
            // Ders nesnesini veritabanından çekiyoruz (Ders kodunu almak için lazım)
            Ders ders = dersRepository.findById(request.getDersId())
                    .orElseThrow(() -> new RuntimeException("Ders bulunamadı"));
            
            yeniSinav.setDers(ders);
            yeniSinav.setOturum(oturumRepository.findById(request.getOturumId()).orElse(null));
            yeniSinav.setTarih(request.getTarih());
            
            // 1. Önce Sınavı Veritabanına Kaydet
            sinavRepository.save(yeniSinav);
            
            // 2. BÜYÜK FİNAL: Robotu (Stored Procedure) Çalıştır!
            String atamaSonucu = sinavService.akilliAtamaYap(ders.getDersKodu(), request.getTarih(), request.getOturumId());
            
            return ResponseEntity.ok("Sınav başarıyla tanımlandı. " + atamaSonucu);
        } catch (Exception e) {
            // Hata olursa Spring Boot 400 Bad Request döner
            return ResponseEntity.badRequest().body("Hata: " + e.getMessage());
        }
    }

    @GetMapping("/liste")
    public ResponseEntity<List<Sinav>> tumSinavlariGetir() {
        return ResponseEntity.ok(sinavRepository.findAll());
    }
}