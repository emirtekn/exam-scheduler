package com.backend.demo.controller;

import com.backend.demo.model.dto.OtomatikDagitimSonucDTO;
import com.backend.demo.service.AtamaService;
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
    private final AtamaService atamaService;

    @GetMapping("/liste")
    public List<Map<String, Object>> getTumAtamalar() {
        String sql = "SELECT " +
                     "  CONVERT(varchar, s.Tarih, 23) AS tarih, " +  
                     "  s.SinavID AS sinavId, " +
                     "  s.OturumID AS oturumId, " +
                     "  ss.DerslikID AS derslikId, " +
                     "  dl.Ad AS derslikAd, " +
                     "  dl.Kapasite AS kapasite, " +
                     "  d.DersID AS dersId, " +
                     "  d.OgrenciSayisi AS ogrenciSayisi, " +
                     "  d.DersAdi AS dersAdi, " +
                     "  d.Yariyil AS yariyil, " +
                     "  d.BolumID AS bolumId, " +
                     "  p.PersonelID AS personelId, " +
                     "  p.Unvan AS unvan, " +
                     "  p.Soyad AS soyad " +
                     "FROM Sinav_Salonlari ss " +
                     "JOIN Sinavlar s ON ss.SinavID = s.SinavID " +
                     "JOIN Derslikler dl ON ss.DerslikID = dl.DerslikID " +
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

            // KURAL 3: Salon Dolu Mu? (aynı sınavın mevcut salon kaydı hariç)
            String sqlKural3 = "SELECT COUNT(*) FROM Sinav_Salonlari ss " +
                               "JOIN Sinavlar s ON ss.SinavID = s.SinavID " +
                               "WHERE s.Tarih = ? AND s.OturumID = ? AND ss.DerslikID = ? AND ss.SinavID <> ?";
            if (jdbcTemplate.queryForObject(sqlKural3, Integer.class, tarih, oturumId, derslikId, sinavId) > 0) {
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

            // KURAL 1: Aynı Yarıyıl Çakışması (BAŞKA DERSLERİ KONTROL ET, AYNI SINAVI DEĞİL)
            String sqlKural1 = "SELECT COUNT(*) FROM Sinav_Salonlari ss " +
                               "JOIN Sinavlar s ON ss.SinavID = s.SinavID " +
                               "JOIN Dersler d ON s.DersID = d.DersID " +
                               "WHERE s.Tarih = ? AND s.OturumID = ? " +
                               "AND s.SinavID <> ? " +
                               "AND d.Yariyil = (SELECT d2.Yariyil FROM Sinavlar s2 JOIN Dersler d2 ON s2.DersID = d2.DersID WHERE s2.SinavID = ?) " +
                               "AND d.BolumID = (SELECT d3.BolumID FROM Sinavlar s3 JOIN Dersler d3 ON s3.DersID = d3.DersID WHERE s3.SinavID = ?)";
            if (jdbcTemplate.queryForObject(sqlKural1, Integer.class, tarih, oturumId, sinavId, sinavId, sinavId) > 0) {
                return ResponseEntity.badRequest().body("KURAL 1 İHLALİ: Bu yarıyıla ait başka bir sınav zaten bu oturuma atanmış!");
            }

            // KURAL 6: Gözetmen Günlük 4 Oturum Sınırı (HATA 2 FİKSİ - Kesinlikle >= 4 ise engelle)
            String sqlKural6 = "SELECT COUNT(DISTINCT s.OturumID) FROM Gozetmen_Atamalari ga " +
                               "JOIN Sinav_Salonlari ss ON ga.AtamaID = ss.AtamaID " +
                               "JOIN Sinavlar s ON ss.SinavID = s.SinavID " +
                               "WHERE s.Tarih = ? AND ga.PersonelID = ?";
            Integer gunlukOturumSayisi = jdbcTemplate.queryForObject(sqlKural6, Integer.class, tarih, personelId);
            if (gunlukOturumSayisi != null && gunlukOturumSayisi >= 4) {
                return ResponseEntity.badRequest().body("KURAL 6 İHLALİ: Bu gözetmen bir günde maksimum 4 oturum sınırına ulaşmış!");
            }

            // KURAL 7: Mazeretler tablosunda "İzinli" olan hoca o gün atanamaz
            String sqlKural7 = "SELECT COUNT(*) FROM Personel_Durumlari " +
                               "WHERE PersonelID = ? AND Tarih = ? AND MazeretTuru = N'İzinli'";
            if (jdbcTemplate.queryForObject(sqlKural7, Integer.class, personelId, tarih) > 0) {
                return ResponseEntity.badRequest().body("KURAL 7 İHLALİ: Seçilen gözetmen bu tarihte izinli görünüyor!");
            }

            // KURAL 9: Bir gözetmen arka arkaya en fazla 3 oturumda görev alabilir
            String sqlKural9 = "SELECT dbo.fn_GozetmenOturumLimitiGectiMi(?, ?, ?)";
            Integer limitGectiMi = jdbcTemplate.queryForObject(sqlKural9, Integer.class, personelId, tarih, oturumId);
            if (limitGectiMi != null && limitGectiMi == 1) {
                return ResponseEntity.badRequest().body("KURAL 9 İHLALİ: Seçilen gözetmen arka arkaya 3 oturum limitine takılıyor!");
            }

            // KURAL 2: Bir yarıyıla ait bir günde max 2 sınav olabilir, iki sınav arası en az 1 oturum boş olmalı
            String sqlKural2Say = "SELECT COUNT(DISTINCT s.OturumID) " +
                                  "FROM Sinavlar s " +
                                  "JOIN Dersler d ON s.DersID = d.DersID " +
                                  "WHERE s.Tarih = ? " +
                                  "  AND s.SinavID <> ? " +
                                  "  AND d.Yariyil = (SELECT d2.Yariyil FROM Sinavlar s2 JOIN Dersler d2 ON s2.DersID = d2.DersID WHERE s2.SinavID = ?) " +
                                  "  AND d.BolumID = (SELECT d3.BolumID FROM Sinavlar s3 JOIN Dersler d3 ON s3.DersID = d3.DersID WHERE s3.SinavID = ?)";
            Integer gunlukSinavSayisi = jdbcTemplate.queryForObject(sqlKural2Say, Integer.class, tarih, sinavId, sinavId, sinavId);
            if (gunlukSinavSayisi != null && gunlukSinavSayisi >= 2) {
                return ResponseEntity.badRequest().body("KURAL 2 İHLALİ: Bu yarıyıl için bu günde maksimum 2 sınav yapılabilir!");
            }

            String sqlKural2Bosluk = "SELECT COUNT(*) " +
                                     "FROM Sinavlar s " +
                                     "JOIN Dersler d ON s.DersID = d.DersID " +
                                     "WHERE s.Tarih = ? " +
                                     "  AND s.SinavID <> ? " +
                                     "  AND d.Yariyil = (SELECT d2.Yariyil FROM Sinavlar s2 JOIN Dersler d2 ON s2.DersID = d2.DersID WHERE s2.SinavID = ?) " +
                                     "  AND d.BolumID = (SELECT d3.BolumID FROM Sinavlar s3 JOIN Dersler d3 ON s3.DersID = d3.DersID WHERE s3.SinavID = ?) " +
                                     "  AND s.OturumID IN (?, ?)";
            Integer aralikIhlali = jdbcTemplate.queryForObject(sqlKural2Bosluk, Integer.class, tarih, sinavId, sinavId, sinavId, oturumId - 1, oturumId + 1);
            if (aralikIhlali != null && aralikIhlali > 0) {
                return ResponseEntity.badRequest().body("KURAL 2 İHLALİ: Aynı yarıyıl için iki sınav peş peşe oturumlara atanamaz (en az 1 oturum boşluk olmalı)!");
            }

            // 1. Planlanmış sınav kaydına oturum bağla
            jdbcTemplate.update("UPDATE Sinavlar SET OturumID = ? WHERE SinavID = ?", oturumId, sinavId);

            // 2. SINAV_SALONLARI: varsa mevcut AtamaID, yoksa INSERT (UQ_SinavSalon koruması)
            List<Integer> mevcutAtama = jdbcTemplate.queryForList(
                    "SELECT AtamaID FROM Sinav_Salonlari WHERE SinavID = ? AND DerslikID = ?",
                    Integer.class, sinavId, derslikId);

            Integer atamaId;
            if (mevcutAtama.isEmpty()) {
                String insertSalon = "DECLARE @T TABLE (ID INT); " +
                        "INSERT INTO Sinav_Salonlari (SinavID, DerslikID) OUTPUT INSERTED.AtamaID INTO @T VALUES (?, ?); " +
                        "SELECT TOP 1 ID FROM @T;";
                atamaId = jdbcTemplate.queryForObject(insertSalon, Integer.class, sinavId, derslikId);
            } else {
                atamaId = mevcutAtama.get(0);
            }

            // 3. GOZETMEN_ATAMALARI: varsa güncelle, yoksa ekle
            Integer gozetmenSayisi = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM Gozetmen_Atamalari WHERE AtamaID = ?",
                    Integer.class, atamaId);
            if (gozetmenSayisi != null && gozetmenSayisi > 0) {
                jdbcTemplate.update(
                        "UPDATE Gozetmen_Atamalari SET PersonelID = ? WHERE AtamaID = ?",
                        personelId, atamaId);
            } else {
                jdbcTemplate.update(
                        "INSERT INTO Gozetmen_Atamalari (AtamaID, PersonelID) VALUES (?, ?)",
                        atamaId, personelId);
            }

            return ResponseEntity.ok("Başarılı");

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Hata: " + e.getMessage());
        }
    }

    @PostMapping("/otomatik-dagit")
    public ResponseEntity<OtomatikDagitimSonucDTO> otomatikDagit() {
        try {
            OtomatikDagitimSonucDTO sonuc = atamaService.otomatikDagit();
            return ResponseEntity.ok(sonuc);
        } catch (Exception e) {
            e.printStackTrace();
            OtomatikDagitimSonucDTO hata = new OtomatikDagitimSonucDTO();
            hata.setOzetMesaj("Otomatik dağıtım hatası: " + e.getMessage());
            return ResponseEntity.badRequest().body(hata);
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
            
            // 3. Sınavı planlama aşamasına döndür (oturum NULL)
            jdbcTemplate.update("UPDATE Sinavlar SET OturumID = NULL WHERE SinavID = ?", sinavId);
            
            return ResponseEntity.ok("Atama başarıyla iptal edildi.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Silme Hatası: " + e.getMessage());
        }
    }
}