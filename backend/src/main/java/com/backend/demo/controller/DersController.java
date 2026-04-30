package com.backend.demo.controller;

import com.backend.demo.model.dto.DersRequestDTO;
import com.backend.demo.model.entity.Ders;
import com.backend.demo.model.entity.Bolum; // Bunu eklemeyi unutma
import com.backend.demo.repository.DersRepository;
import com.backend.demo.repository.BolumRepository; // Bunu ekliyoruz
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dersler")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class DersController {

    private final DersRepository dersRepository;
    private final BolumRepository bolumRepository; // Bölüm bilgilerini çekmek için enjekte ettik

    @PostMapping("/ekle")
    public ResponseEntity<String> dersEkle(@RequestBody DersRequestDTO request) {
        try {
            // Önce veritabanından o ID'ye sahip bölümü buluyoruz
            Bolum bolum = bolumRepository.findById(request.getBolumId())
                    .orElseThrow(() -> new RuntimeException("Hata: Belirtilen bölüm bulunamadı!"));

            Ders yeniDers = new Ders();
            yeniDers.setDersKodu(request.getDersKodu());
            yeniDers.setDersAdi(request.getDersAdi());
            yeniDers.setDersTuru(request.getDersTuru());
            yeniDers.setOgrenciSayisi(request.getOgrenciSayisi());
            yeniDers.setYariyil(request.getYariyil());
            
            // İşte sihirli dokunuş! Integer yerine nesneyi setliyoruz.
            yeniDers.setBolum(bolum); 
            
            dersRepository.save(yeniDers);
            return ResponseEntity.ok("Ders başarıyla eklendi.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Ders eklenirken hata oluştu: " + e.getMessage());
        }
    }

    @GetMapping("/liste")
    public ResponseEntity<List<Ders>> tumDersleriGetir() {
        return ResponseEntity.ok(dersRepository.findAll());
    }
}