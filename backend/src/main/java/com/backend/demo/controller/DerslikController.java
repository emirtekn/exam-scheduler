package com.backend.demo.controller;

import com.backend.demo.model.dto.DerslikRequestDTO;
import com.backend.demo.model.entity.Derslik;
import com.backend.demo.repository.DerslikRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/derslikler")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class DerslikController {

    private final DerslikRepository derslikRepository;

    @PostMapping("/ekle")
    public ResponseEntity<String> derslikEkle(@RequestBody DerslikRequestDTO request) {
        try {
            Derslik yeniDerslik = new Derslik();
            yeniDerslik.setAd(request.getAd());
            yeniDerslik.setKapasite(request.getKapasite());
            yeniDerslik.setTip(request.getTip());
            yeniDerslik.setKat(request.getKat());
            yeniDerslik.setAktif(request.getAktif()); // Checkbox'tan gelen true/false
            
            derslikRepository.save(yeniDerslik);
            return ResponseEntity.ok("Derslik başarıyla eklendi.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Derslik eklenirken hata: " + e.getMessage());
        }
    }

    @GetMapping("/liste")
    public ResponseEntity<List<Derslik>> tumDerslikleriGetir() {
        return ResponseEntity.ok(derslikRepository.findAll());
    }
}