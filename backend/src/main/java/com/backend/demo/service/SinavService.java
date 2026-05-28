package com.backend.demo.service;

import com.backend.demo.model.dto.SinavRequestDTO;
import com.backend.demo.model.entity.Sinav;
import com.backend.demo.model.entity.Ders;
import com.backend.demo.repository.DersRepository;
import com.backend.demo.repository.OturumRepository;
import com.backend.demo.repository.SinavRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SinavService {

    private final SinavRepository sinavRepository;
    private final OturumRepository oturumRepository;
    private final DersRepository dersRepository;
    private final JdbcTemplate jdbcTemplate; // SQL denetimleri için enjekte ettik

    @Transactional
    public void sadeceSinavPlanla(SinavRequestDTO request) {
        Sinav yeniSinav = new Sinav();
        Ders ders = dersRepository.findById(request.getDersId())
                .orElseThrow(() -> new RuntimeException("Ders bulunamadı"));
        yeniSinav.setDers(ders);
        yeniSinav.setOturum(oturumRepository.findById(request.getOturumId()).orElse(null));
        yeniSinav.setTarih(request.getTarih());
        sinavRepository.save(yeniSinav);
    }

    @Transactional
    public void kisitlariDenetleVeManuelAta(Integer dersId, String tarih, Integer oturumId, Integer derslikId, Integer personelId) {
        
        // -------------------------------------------------------------------------
        // KURAL 3: Bir derslikte aynı tarih ve oturumda yalnızca tek bir sınav yapılabilir
        // -------------------------------------------------------------------------
        String sqlKural3 = "SELECT COUNT(*) FROM Sinav_Salonlari ss " +
                           "JOIN Sinavlar s ON ss.SinavID = s.SinavID " +
                           "WHERE s.Tarih = ? AND s.OturumID = ? AND ss.DerslikID = ?";
        Integer salonDoluSayisi = jdbcTemplate.queryForObject(sqlKural3, Integer.class, tarih, oturumId, derslikId);
        if (salonDoluSayisi != null && salonDoluSayisi > 0) {
            throw new RuntimeException("KURAL 3 İHLALİ: Seçtiğiniz salon bu tarih ve oturumda zaten dolu!");
        }

        // -------------------------------------------------------------------------
        // KURAL 5: Bir gözetmen aynı tarih ve oturumda birden fazla salonda görevlendirilemez
        // -------------------------------------------------------------------------
        String sqlKural5 = "SELECT COUNT(*) FROM Gozetmen_Atamalari ga " +
                           "JOIN Sinav_Salonlari ss ON ga.AtamaID = ss.AtamaID " +
                           "JOIN Sinavlar s ON ss.SinavID = s.SinavID " +
                           "WHERE s.Tarih = ? AND s.OturumID = ? AND ga.PersonelID = ?";
        Integer hocaDoluSayisi = jdbcTemplate.queryForObject(sqlKural5, Integer.class, tarih, oturumId, personelId);
        if (hocaDoluSayisi != null && hocaDoluSayisi > 0) {
            throw new RuntimeException("KURAL 5 İHLALİ: Seçilen gözetmen o saatte başka bir salonda görevli!");
        }

        // -------------------------------------------------------------------------
        // KURAL 1: Aynı yarıyılda yer alan derslerin sınavları aynı oturuma atanamaz
        // -------------------------------------------------------------------------
        String sqlKural1 = "SELECT COUNT(*) FROM Sinavlar s " +
                           "JOIN Dersler d ON s.DersID = d.DersID " +
                           "WHERE s.Tarih = ? AND s.OturumID = ? " +
                           "AND d.Yariyil = (SELECT Yariyil FROM Dersler WHERE DersID = ?) " +
                           "AND d.BolumID = (SELECT BolumID FROM Dersler WHERE DersID = ?)";
        Integer yariyilCakismaSayisi = jdbcTemplate.queryForObject(sqlKural1, Integer.class, tarih, oturumId, dersId, dersId);
        if (yariyilCakismaSayisi != null && yariyilCakismaSayisi > 0) {
            throw new RuntimeException("KURAL 1 İHLALİ: Bu bölümün, aynı yarıyıla ait başka bir dersinin sınavı zaten bu oturumda!");
        }

        // -------------------------------------------------------------------------
        // KURAL 6: Bir öğretim elemanı bir günde max 4 oturumda görevli olabilir
        // -------------------------------------------------------------------------
        String sqlKural6 = "SELECT COUNT(DISTINCT s.OturumID) FROM Gozetmen_Atamalari ga " +
                           "JOIN Sinav_Salonlari ss ON ga.AtamaID = ss.AtamaID " +
                           "JOIN Sinavlar s ON ss.SinavID = s.SinavID " +
                           "WHERE s.Tarih = ? AND ga.PersonelID = ?";
        Integer hocaGunlukOturum = jdbcTemplate.queryForObject(sqlKural6, Integer.class, tarih, personelId);
        if (hocaGunlukOturum != null && hocaGunlukOturum >= 4) {
            throw new RuntimeException("KURAL 6 İHLALİ: Gözetmen bir günde maksimum 4 oturumda görev alabilir!");
        }

        // =========================================================================
        // TÜM MANUEL KISITLAR GEÇİLDİYSE SQL SERVER'A YAZMA ADIMI BAŞLIYOR
        // =========================================================================
        
        // Önce bu ders, tarih ve oturuma ait bir sınav kaydı var mı kontrol et, yoksa aç
        String sqlSinavBul = "SELECT SinavID FROM Sinavlar WHERE DersID = ? AND Tarih = ? AND OturumID = ?";
        List<Integer> mevcutSinavlar = jdbcTemplate.queryForList(sqlSinavBul, Integer.class, dersId, tarih, oturumId);
        Integer sinavId;

        if (mevcutSinavlar.isEmpty()) {
            String sqlSinavEkle = "INSERT INTO Sinavlar (DersID, Tarih, OturumID) OUTPUT INSERTED.SinavID VALUES (?, ?, ?)";
            sinavId = jdbcTemplate.queryForObject(sqlSinavEkle, Integer.class, dersId, tarih, oturumId);
        } else {
            sinavId = mevcutSinavlar.get(0);
        }

        // 1. Sinav_Salonlari tablosuna ekle ve AtamaID'yi kap
        String sqlSalonEkle = "INSERT INTO Sinav_Salonlari (SinavID, DerslikID) OUTPUT INSERTED.AtamaID VALUES (?, ?)";
        Integer atamaId = jdbcTemplate.queryForObject(sqlSalonEkle, Integer.class, sinavId, derslikId);

        // 2. Gozetmen_Atamalari tablosuna hocayı ata
        String sqlGozetmenEkle = "INSERT INTO Gozetmen_Atamalari (AtamaID, PersonelID) VALUES (?, ?)";
        jdbcTemplate.update(sqlGozetmenEkle, atamaId, personelId);
    }

    @Transactional
    public void otomatikSalonAta(Integer dersId, LocalDate tarih, Integer oturumId) {
        Integer finalOturumId = oturumId;
        if (finalOturumId == null) {
            finalOturumId = oturumRepository.findAll().stream()
                .map(oturum -> oturum.getOturumId())
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Sistemde hiç oturum bulunamadı!"));
        }
        sinavRepository.sp_AkilliSalonAta(dersId, tarih, finalOturumId);
    }
}