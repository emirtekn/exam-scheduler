package com.backend.demo.controller;

import com.backend.demo.model.dto.DurumRequestDTO;
import com.backend.demo.model.entity.PersonelDurum;
import com.backend.demo.repository.PersonelDurumRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/durumlar")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class DurumController {

    private final PersonelDurumRepository durumRepository;
    private final JdbcTemplate jdbcTemplate;

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

    /** Kural 7: İzinli personel + tarih listesi (Dashboard filtrelemesi için) */
    @GetMapping("/izinli")
    public ResponseEntity<List<Map<String, Object>>> izinliPersoneller() {
        String sql = "SELECT PersonelID AS personelId, CONVERT(varchar, Tarih, 23) AS tarih, MazeretTuru AS mazeretTuru " +
                     "FROM Personel_Durumlari WHERE MazeretTuru = N'İzinli'";
        return ResponseEntity.ok(jdbcTemplate.queryForList(sql));
    }

    /** Kural 7: İzinli + Raporlu — atama yapılamaz günler (Dashboard) */
    @GetMapping("/mazeretli")
    public ResponseEntity<List<Map<String, Object>>> mazeretliPersoneller() {
        String sql = "SELECT PersonelID AS personelId, CONVERT(varchar, Tarih, 23) AS tarih, MazeretTuru AS mazeretTuru " +
                     "FROM Personel_Durumlari WHERE MazeretTuru IN (N'İzinli', N'Raporlu')";
        return ResponseEntity.ok(jdbcTemplate.queryForList(sql));
    }
}