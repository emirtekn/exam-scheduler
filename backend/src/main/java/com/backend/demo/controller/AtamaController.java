package com.backend.demo.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/atamalar")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AtamaController {

    private final JdbcTemplate jdbcTemplate;

    @GetMapping("/liste")
    public List<Map<String, Object>> getTumAtamalar() {
        String sql = "SELECT " +
                     "  CONVERT(varchar, s.Tarih, 23) AS tarih, " +  
                     "  s.SinavID AS sinavId, " +
                     "  s.OturumID AS oturumId, " +
                     "  ss.DerslikID AS derslikId, " +
                     "  d.DersID AS dersId, " +
                     "  d.DersAdi AS dersAdi, " +
                     "  p.PersonelID AS personelId, " +
                     "  p.Unvan AS unvan, " +
                     "  p.Soyad AS soyad " +
                     "FROM Sinav_Salonlari ss " +
                     "JOIN Sinavlar s ON ss.SinavID = s.SinavID " +
                     "JOIN Dersler d ON s.DersID = d.DersID " +
                     "LEFT JOIN Gozetmen_Atamalari ga ON ss.AtamaID = ga.AtamaID " +
                     "LEFT JOIN Personeller p ON ga.PersonelID = p.PersonelID";
        return jdbcTemplate.queryForList(sql);
    }

    @PostMapping("/manuel-kaydet")
    @Transactional 
    public ResponseEntity<String> manuelAtamaKaydet(@RequestBody Map<String, Object> payload) {
        try {
            if (payload.get("sinavId") == null || payload.get("personelId") == null || 
                payload.get("tarih") == null || payload.get("oturumId") == null || payload.get("derslikId") == null) {
                return ResponseEntity.badRequest().body("Eksik veri gönderildi! Lütfen tüm seçimleri yapın.");
            }

            Integer sinavId = Integer.parseInt(payload.get("sinavId").toString());
            String tarih = payload.get("tarih").toString();
            Integer oturumId = Integer.parseInt(payload.get("oturumId").toString());
            Integer derslikId = Integer.parseInt(payload.get("derslikId").toString());
            Integer personelId = Integer.parseInt(payload.get("personelId").toString());

            // KURAL 3: Salon Dolu Mu?
            String sqlKural3 = "SELECT COUNT(*) FROM Sinav_Salonlari ss " +
                               "JOIN Sinavlar s ON ss.SinavID = s.SinavID " +
                               "WHERE s.Tarih = ? AND s.OturumID = ? AND ss.DerslikID = ?";
            if (jdbcTemplate.queryForObject(sqlKural3, Integer.class, tarih, oturumId, derslikId) > 0) {
                return ResponseEntity.badRequest().body("KURAL 3 İHLALİ: Seçtiğiniz salon bu tarih ve oturumda zaten dolu!");
            }

            // KURAL 5: Gözetmen Başka Salonda Görevli Mi?
            String sqlKural5 = "SELECT COUNT(*) FROM Gozetmen_Atamalari ga " +
                               "JOIN Sinav_Salonlari ss ON ga.AtamaID = ss.AtamaID " +
                               "JOIN Sinavlar s ON ss.SinavID = s.SinavID " +
                               "WHERE s.Tarih = ? AND s.OturumID = ? AND ga.PersonelID = ?";
            if (jdbcTemplate.queryForObject(sqlKural5, Integer.class, tarih, oturumId, personelId) > 0) {
                return ResponseEntity.badRequest().body("KURAL 5 İHLALİ: Seçilen gözetmen bu tarih ve oturumda başka bir salonda görevli!");
            }

            // KURAL 1: Aynı Yarıyıl Çakışması
            String sqlKural1 = "SELECT COUNT(*) FROM Sinav_Salonlari ss " +
                               "JOIN Sinavlar s ON ss.SinavID = s.SinavID " +
                               "JOIN Dersler d ON s.DersID = d.DersID " +
                               "WHERE s.Tarih = ? AND s.OturumID = ? " +
                               "AND d.Yariyil = (SELECT d2.Yariyil FROM Sinavlar s2 JOIN Dersler d2 ON s2.DersID = d2.DersID WHERE s2.SinavID = ?) " +
                               "AND d.BolumID = (SELECT d3.BolumID FROM Sinavlar s3 JOIN Dersler d3 ON s3.DersID = d3.DersID WHERE s3.SinavID = ?)";
            if (jdbcTemplate.queryForObject(sqlKural1, Integer.class, tarih, oturumId, sinavId, sinavId) > 0) {
                return ResponseEntity.badRequest().body("KURAL 1 İHLALİ: Bu yarıyıla ait başka bir sınav zaten bu oturuma atanmış!");
            }

            // KURAL 6: Gözetmen Günlük 4 Oturum Sınırı
            String sqlKural6 = "SELECT COUNT(DISTINCT s.OturumID) FROM Gozetmen_Atamalari ga " +
                               "JOIN Sinav_Salonlari ss ON ga.AtamaID = ss.AtamaID " +
                               "JOIN Sinavlar s ON ss.SinavID = s.SinavID " +
                               "WHERE s.Tarih = ? AND ga.PersonelID = ?";
            if (jdbcTemplate.queryForObject(sqlKural6, Integer.class, tarih, personelId) >= 4) {
                return ResponseEntity.badRequest().body("KURAL 6 İHLALİ: Bu gözetmen bir günde maksimum 4 oturum sınırına ulaşmış!");
            }

            // 1. Planlanmış olan ham sınav kaydına, seçilen OturumID'yi bağlayıp güncelliyoruz
            jdbcTemplate.update("UPDATE Sinavlar SET OturumID = ? WHERE SinavID = ?", oturumId, sinavId);

            // 2. SINAV_SALONLARI TABLOSUNA KAYIT
            String insertSalon = "DECLARE @T TABLE (ID INT); " +
                                 "INSERT INTO Sinav_Salonlari (SinavID, DerslikID) OUTPUT INSERTED.AtamaID INTO @T VALUES (?, ?); " +
                                 "SELECT TOP 1 ID FROM @T;";
            Integer atamaId = jdbcTemplate.queryForObject(insertSalon, Integer.class, sinavId, derslikId);

            // 3. GOZETMEN_ATAMALARI TABLOSUNA KAYIT
            jdbcTemplate.update("INSERT INTO Gozetmen_Atamalari (AtamaID, PersonelID) VALUES (?, ?)", atamaId, personelId);

            return ResponseEntity.ok("Başarılı");

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Hata: " + e.getMessage());
        }
    }

    // YENİ EKLENEN İPTAL ETME METODU (NULL Hatası Çözüldü)
    @DeleteMapping("/sil/{sinavId}")
    @Transactional
    public ResponseEntity<String> atamaSil(@PathVariable Integer sinavId) {
        try {
            // 1. Gözetmen Atamasını Sil
            jdbcTemplate.update("DELETE FROM Gozetmen_Atamalari WHERE AtamaID IN (SELECT AtamaID FROM Sinav_Salonlari WHERE SinavID = ?)", sinavId);
            // 2. Salon Atamasını Sil
            jdbcTemplate.update("DELETE FROM Sinav_Salonlari WHERE SinavID = ?", sinavId);
            
            // 3. ÇÖZÜM: Sınavı tekrar boşa düşürmek için NULL yapmak yerine, DB'deki İLK oturumu dummy olarak veriyoruz.
            String updateDummyOturum = "UPDATE Sinavlar SET OturumID = (SELECT TOP 1 OturumID FROM Oturumlar ORDER BY OturumID ASC) WHERE SinavID = ?";
            jdbcTemplate.update(updateDummyOturum, sinavId);
            
            return ResponseEntity.ok("Atama başarıyla iptal edildi.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Silme Hatası: " + e.getMessage());
        }
    }
}