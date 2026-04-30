package com.backend.demo.controller;

import com.backend.demo.model.entity.Oturum;
import com.backend.demo.repository.OturumRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/oturumlar")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class OturumController {

    private final OturumRepository oturumRepository;

    // Arayüzdeki tabloyu dolduracak liste metodu
    @GetMapping("/liste")
    public ResponseEntity<List<Oturum>> getTumOturumlar() {
        return ResponseEntity.ok(oturumRepository.findAll());
    }

    // Yeni yaptığımız ekrandan gelen oturumları kaydedecek metot
    @PostMapping("/ekle")
    public ResponseEntity<String> oturumEkle(@RequestBody Oturum oturum) {
        try {
            oturumRepository.save(oturum);
            return ResponseEntity.ok("Oturum başarıyla tanımlandı!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Kayıt Hatası: " + e.getMessage());
        }
    }
}