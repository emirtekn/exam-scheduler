package com.backend.demo.controller;

import com.backend.demo.model.dto.DurumRequestDTO;
import com.backend.demo.model.entity.PersonelDurum;
import com.backend.demo.repository.PersonelDurumRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/durumlar")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class DurumController {

    private final PersonelDurumRepository durumRepository;

    @PostMapping("/ekle")
    public ResponseEntity<String> durumEkle(@RequestBody DurumRequestDTO request) {
        try {
            PersonelDurum yeniDurum = new PersonelDurum();
            yeniDurum.setPersonelId(request.getPersonelId());
            yeniDurum.setTarih(request.getTarih());
            yeniDurum.setMazeretTuru(request.getMazeretTuru());
            
            durumRepository.save(yeniDurum);
            return ResponseEntity.ok("Mazeret başarıyla işlendi.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Hata: " + e.getMessage());
        }
    }

    @GetMapping("/liste")
    public ResponseEntity<List<PersonelDurum>> tumDurumlariGetir() {
        return ResponseEntity.ok(durumRepository.findAll());
    }
}