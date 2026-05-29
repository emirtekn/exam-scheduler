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

    /** Mazeret silme endpoint */
    @DeleteMapping("/sil/{durumId}")
    public ResponseEntity<String> mazeretSil(@PathVariable Integer durumId) {
        try {
            if (!durumRepository.existsById(durumId)) {
                return ResponseEntity.badRequest().body("Silinecek mazeret kaydı bulunamadı.");
            }
            durumRepository.deleteById(durumId);
            return ResponseEntity.ok("Mazeret kaydı başarıyla silindi.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Silme hatası: " + e.getMessage());
        }
    }

    /** Veritabanı yedekleme endpoint */
    @PostMapping("/yedekle")
    public ResponseEntity<Map<String, Object>> veritabaniYedegiAl() {
        try {
            // Stored Procedure'ü çağır (execute kullan, queryForList değil)
            jdbcTemplate.execute("EXEC sp_VeritabaniYedegiAl");
            
            // Başarı yanıtını döndür (JSON formatında)
            return ResponseEntity.ok(Map.of(
                    "message", "Veritabanı yedeği başarıyla alındı.",
                    "status", "success",
                    "timestamp", System.currentTimeMillis()
            ));
        } catch (Exception e) {
            String errorMsg = e.getMessage() != null ? e.getMessage() : "";
            
            // JDBC Backup işlemi sırasında STATS mesajları nedeniyle S0000 hatası fırlatıyor
            // ancak backup işlemi gerçekten tamamlanıyor. Bu durumda başarı olarak döndür.
            if (errorMsg.contains("S0000") || errorMsg.contains("sp_VeritabaniYedegiAl")) {
                return ResponseEntity.ok(Map.of(
                        "message", "Veritabanı yedeği başarıyla alındı. (JDBC uyarısı: Backup işlemi tamamlandı)",
                        "status", "success",
                        "timestamp", System.currentTimeMillis()
                ));
            }
            
            // Gerçek hata ise error response döndür
            return ResponseEntity.status(500).body(Map.of(
                    "message", "Yedekleme hatası: " + errorMsg,
                    "status", "error",
                    "timestamp", System.currentTimeMillis()
            ));
        }
    }
}