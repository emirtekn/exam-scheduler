package com.backend.demo.controller;

import com.backend.demo.model.dto.PersonelRequestDTO;
import com.backend.demo.model.entity.Personel;
import com.backend.demo.repository.PersonelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/personeller")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class PersonelController {

    private final PersonelRepository personelRepository;

    @PostMapping("/ekle")
    public ResponseEntity<String> personelEkle(@RequestBody PersonelRequestDTO request) {
        try {
            Personel yeniPersonel = new Personel();
            yeniPersonel.setUnvan(request.getUnvan());
            yeniPersonel.setAd(request.getAd());
            yeniPersonel.setSoyad(request.getSoyad());
            yeniPersonel.setBolumId(request.getBolumId());
            
            personelRepository.save(yeniPersonel);
            return ResponseEntity.ok("Personel başarıyla eklendi.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Personel eklenirken hata: " + e.getMessage());
        }
    }

    @GetMapping("/liste")
    public ResponseEntity<List<Personel>> tumPersonelleriGetir() {
        return ResponseEntity.ok(personelRepository.findAll());
    }
}