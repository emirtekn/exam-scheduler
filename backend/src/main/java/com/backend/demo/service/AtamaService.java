package com.backend.demo.service;

import com.backend.demo.model.dto.OtomatikDagitimSonucDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AtamaService {

    private final JdbcTemplate jdbcTemplate;

    private record SinavKaydi(
            int sinavId,
            String tarih,
            int dersId,
            String dersKodu,
            String dersAdi,
            int ogrenciSayisi,
            int yariyil,
            int bolumId
    ) {}

    private record DerslikKaydi(int derslikId, String ad, int kapasite) {}

    private record PersonelKaydi(int personelId, int bolumId) {}

    private record SalonAtama(int derslikId, int personelId) {}

    /**
     * Henüz salon/gözetmen atanmamış sınavları otomatik dağıtır.
     * (DB'de OturumID NOT NULL olduğu için kriter: Sinav_Salonlari kaydı yok.)
     */
    @Transactional
    public OtomatikDagitimSonucDTO otomatikDagit() {
        OtomatikDagitimSonucDTO sonuc = new OtomatikDagitimSonucDTO();
        sonuc.setBasariliSinavlar(new ArrayList<>());
        sonuc.setAtanamayanSinavlar(new ArrayList<>());

        List<SinavKaydi> bekleyenSinavlar = bekleyenSinavlariYukle();
        if (bekleyenSinavlar.isEmpty()) {
            sonuc.setOzetMesaj("Atanacak bekleyen sınav bulunamadı.");
            return sonuc;
        }

        List<DerslikKaydi> tumDerslikler = derslikleriYukle();
        List<Integer> oturumSirasi = oturumlariYukle();
        List<PersonelKaydi> tumPersonel = personelleriYukle();
        Set<String> izinliSet = izinlileriYukle();

        // Dolu salonlar: tarih|oturumId|derslikId
        Set<String> doluSalonlar = mevcutDoluSalonlariYukle();
        // Oturum slotunda hangi (bolumId-yariyil) var (Kural 1)
        Map<String, Set<String>> slotYariyilBolum = mevcutSlotYariyilBolumYukle();
        // Gözetmen günlük oturumları: personelId|tarih -> Set<oturumId>
        Map<String, Set<Integer>> gozetmenGunlukOturum = mevcutGozetmenOturumlariYukle();
        // Gözetmen aynı slotta meşgul: tarih|oturumId|personelId
        Set<String> gozetmenSlotMesgul = mevcutGozetmenSlotMesgulYukle();
        // Yarıyıl günlük oturumları (Kural 2): tarih|bolumId|yariyil -> Set<oturumId>
        Map<String, Set<Integer>> yariyilGunlukOturum = mevcutYariyilGunlukOturumYukle();
        Map<Integer, Integer> gozetmenToplamAtama = gozetmenAtamaSayilariYukle();

        for (SinavKaydi sinav : bekleyenSinavlar) {
            String etiket = sinav.dersKodu() + " - " + sinav.dersAdi();
            try {
                Integer oturumId = uygunOturumBul(sinav, oturumSirasi, slotYariyilBolum, yariyilGunlukOturum);
                if (oturumId == null) {
                    sonuc.getAtanamayanSinavlar().add(etiket + " (Uygun oturum bulunamadı - Kural 1/2)");
                    continue;
                }

                List<DerslikKaydi> salonKombinasyonu = salonKombinasyonuBul(
                        sinav, oturumId, tumDerslikler, doluSalonlar);
                if (salonKombinasyonu == null || salonKombinasyonu.isEmpty()) {
                    sonuc.getAtanamayanSinavlar().add(etiket + " (Yeterli salon/kapasite yok - Kural 3/4)");
                    continue;
                }

                List<SalonAtama> salonAtamalari = new ArrayList<>();
                Set<Integer> buSinavdaKullanilanHocalar = new HashSet<>();

                for (DerslikKaydi salon : salonKombinasyonu) {
                    Integer personelId = uygunGozetmenBul(
                            sinav, oturumId, sinav.bolumId(), tumPersonel, izinliSet,
                            gozetmenGunlukOturum, gozetmenSlotMesgul, buSinavdaKullanilanHocalar,
                            gozetmenToplamAtama);
                    if (personelId == null) {
                        salonAtamalari = null;
                        break;
                    }
                    salonAtamalari.add(new SalonAtama(salon.derslikId(), personelId));
                    buSinavdaKullanilanHocalar.add(personelId);
                }

                if (salonAtamalari == null || salonAtamalari.isEmpty()) {
                    sonuc.getAtanamayanSinavlar().add(etiket + " (Uygun gözetmen bulunamadı - Kural 5/6/7/8/9)");
                    continue;
                }

                sinaviKaydet(sinav, oturumId, salonAtamalari);

                // Bellek durumunu güncelle (aynı batch içindeki sonraki sınavlar için)
                guncelleBellek(
                        sinav, oturumId, salonAtamalari, salonKombinasyonu,
                        doluSalonlar, slotYariyilBolum, gozetmenGunlukOturum,
                        gozetmenSlotMesgul, yariyilGunlukOturum, gozetmenToplamAtama);

                sonuc.getBasariliSinavlar().add(etiket);
            } catch (Exception ex) {
                sonuc.getAtanamayanSinavlar().add(etiket + " (" + ex.getMessage() + ")");
            }
        }

        sonuc.setBasariliSayisi(sonuc.getBasariliSinavlar().size());
        sonuc.setAtanamayanSayisi(sonuc.getAtanamayanSinavlar().size());
        sonuc.setOzetMesaj(String.format(
                "Otomatik dağıtım tamamlandı. Başarılı: %d, Atanamayan: %d.",
                sonuc.getBasariliSayisi(), sonuc.getAtanamayanSayisi()));
        return sonuc;
    }

    private List<SinavKaydi> bekleyenSinavlariYukle() {
        String sql = """
                SELECT s.SinavID AS sinavId,
                       CONVERT(varchar, s.Tarih, 23) AS tarih,
                       d.DersID AS dersId,
                       d.DersKodu AS dersKodu,
                       d.DersAdi AS dersAdi,
                       d.OgrenciSayisi AS ogrenciSayisi,
                       d.Yariyil AS yariyil,
                       d.BolumID AS bolumId
                FROM Sinavlar s
                JOIN Dersler d ON s.DersID = d.DersID
                WHERE NOT EXISTS (
                    SELECT 1 FROM Sinav_Salonlari ss WHERE ss.SinavID = s.SinavID
                )
                ORDER BY s.Tarih, d.OgrenciSayisi DESC
                """;
        return jdbcTemplate.query(sql, (rs, rowNum) -> new SinavKaydi(
                rs.getInt("sinavId"),
                rs.getString("tarih"),
                rs.getInt("dersId"),
                rs.getString("dersKodu"),
                rs.getString("dersAdi"),
                rs.getInt("ogrenciSayisi"),
                rs.getInt("yariyil"),
                rs.getInt("bolumId")
        ));
    }

    private List<DerslikKaydi> derslikleriYukle() {
        String sql = """
                SELECT DerslikID AS derslikId, Ad AS ad, Kapasite AS kapasite
                FROM Derslikler
                WHERE Aktif = 1 OR Aktif IS NULL
                ORDER BY Kapasite DESC
                """;
        return jdbcTemplate.query(sql, (rs, rowNum) -> new DerslikKaydi(
                rs.getInt("derslikId"),
                rs.getString("ad"),
                rs.getInt("kapasite")
        ));
    }

    private List<Integer> oturumlariYukle() {
        return jdbcTemplate.queryForList(
                "SELECT OturumID FROM Oturumlar ORDER BY OturumID ASC",
                Integer.class);
    }

    private List<PersonelKaydi> personelleriYukle() {
        return jdbcTemplate.query(
                "SELECT PersonelID AS personelId, BolumID AS bolumId FROM Personeller",
                (rs, rowNum) -> new PersonelKaydi(rs.getInt("personelId"), rs.getInt("bolumId")));
    }

    private Set<String> izinlileriYukle() {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT PersonelID AS personelId, CONVERT(varchar, Tarih, 23) AS tarih " +
                "FROM Personel_Durumlari WHERE MazeretTuru = N'İzinli'");
        return rows.stream()
                .map(r -> r.get("personelId") + "|" + r.get("tarih"))
                .collect(Collectors.toSet());
    }

    private Set<String> mevcutDoluSalonlariYukle() {
        String sql = """
                SELECT CONVERT(varchar, s.Tarih, 23) AS tarih,
                       s.OturumID AS oturumId,
                       ss.DerslikID AS derslikId
                FROM Sinav_Salonlari ss
                JOIN Sinavlar s ON ss.SinavID = s.SinavID
                """;
        return jdbcTemplate.query(sql, (rs, rowNum) ->
                rs.getString("tarih") + "|" + rs.getInt("oturumId") + "|" + rs.getInt("derslikId"))
                .stream().collect(Collectors.toSet());
    }

    private Map<String, Set<String>> mevcutSlotYariyilBolumYukle() {
        String sql = """
                SELECT CONVERT(varchar, s.Tarih, 23) AS tarih,
                       s.OturumID AS oturumId,
                       d.BolumID AS bolumId,
                       d.Yariyil AS yariyil
                FROM Sinav_Salonlari ss
                JOIN Sinavlar s ON ss.SinavID = s.SinavID
                JOIN Dersler d ON s.DersID = d.DersID
                """;
        Map<String, Set<String>> map = new HashMap<>();
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
        for (Map<String, Object> row : rows) {
            String key = row.get("tarih") + "|" + row.get("oturumId");
            int bolumId = ((Number) row.get("bolumId")).intValue();
            int yariyil = ((Number) row.get("yariyil")).intValue();
            map.computeIfAbsent(key, k -> new HashSet<>()).add(bolumId + "-" + yariyil);
        }
        return map;
    }

    private Map<String, Set<Integer>> mevcutGozetmenOturumlariYukle() {
        String sql = """
                SELECT ga.PersonelID AS personelId,
                       CONVERT(varchar, s.Tarih, 23) AS tarih,
                       s.OturumID AS oturumId
                FROM Gozetmen_Atamalari ga
                JOIN Sinav_Salonlari ss ON ga.AtamaID = ss.AtamaID
                JOIN Sinavlar s ON ss.SinavID = s.SinavID
                """;
        Map<String, Set<Integer>> map = new HashMap<>();
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
        for (Map<String, Object> row : rows) {
            String key = row.get("personelId") + "|" + row.get("tarih");
            int oturumId = ((Number) row.get("oturumId")).intValue();
            map.computeIfAbsent(key, k -> new HashSet<>()).add(oturumId);
        }
        return map;
    }

    private Set<String> mevcutGozetmenSlotMesgulYukle() {
        String sql = """
                SELECT ga.PersonelID AS personelId,
                       CONVERT(varchar, s.Tarih, 23) AS tarih,
                       s.OturumID AS oturumId
                FROM Gozetmen_Atamalari ga
                JOIN Sinav_Salonlari ss ON ga.AtamaID = ss.AtamaID
                JOIN Sinavlar s ON ss.SinavID = s.SinavID
                """;
        return jdbcTemplate.query(sql, (rs, rowNum) ->
                rs.getString("tarih") + "|" + rs.getInt("oturumId") + "|" + rs.getInt("personelId"))
                .stream().collect(Collectors.toSet());
    }

    private Map<String, Set<Integer>> mevcutYariyilGunlukOturumYukle() {
        String sql = """
                SELECT CONVERT(varchar, s.Tarih, 23) AS tarih,
                       d.BolumID AS bolumId,
                       d.Yariyil AS yariyil,
                       s.OturumID AS oturumId
                FROM Sinavlar s
                JOIN Dersler d ON s.DersID = d.DersID
                WHERE EXISTS (SELECT 1 FROM Sinav_Salonlari ss WHERE ss.SinavID = s.SinavID)
                """;
        Map<String, Set<Integer>> map = new HashMap<>();
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
        for (Map<String, Object> row : rows) {
            String key = row.get("tarih") + "|" + row.get("bolumId") + "|" + row.get("yariyil");
            int oturumId = ((Number) row.get("oturumId")).intValue();
            map.computeIfAbsent(key, k -> new HashSet<>()).add(oturumId);
        }
        return map;
    }

    private Integer uygunOturumBul(
            SinavKaydi sinav,
            List<Integer> oturumSirasi,
            Map<String, Set<String>> slotYariyilBolum,
            Map<String, Set<Integer>> yariyilGunlukOturum) {

        String ybKey = sinav.tarih() + "|" + sinav.bolumId() + "|" + sinav.yariyil();
        Set<Integer> gunlukOturumlar = yariyilGunlukOturum.getOrDefault(ybKey, new HashSet<>());

        for (Integer oturumId : oturumSirasi) {
            String slotKey = sinav.tarih() + "|" + oturumId;
            Set<String> mevcut = slotYariyilBolum.getOrDefault(slotKey, Collections.emptySet());
            String yariyilBolum = sinav.bolumId() + "-" + sinav.yariyil();

            // Kural 1
            if (mevcut.contains(yariyilBolum)) {
                continue;
            }

            // Kural 2: günde max 2 sınav
            if (gunlukOturumlar.size() >= 2) {
                continue;
            }

            // Kural 2: peş peşe oturum yasak (en az 1 boşluk)
            if (gunlukOturumlar.contains(oturumId - 1) || gunlukOturumlar.contains(oturumId + 1)) {
                continue;
            }

            return oturumId;
        }
        return null;
    }

    private List<DerslikKaydi> salonKombinasyonuBul(
            SinavKaydi sinav,
            int oturumId,
            List<DerslikKaydi> tumDerslikler,
            Set<String> doluSalonlar) {

        List<DerslikKaydi> musait = tumDerslikler.stream()
                .filter(d -> !doluSalonlar.contains(salonKey(sinav.tarih(), oturumId, d.derslikId())))
                .sorted(Comparator.comparingInt(DerslikKaydi::kapasite).reversed())
                .toList();

        int kalan = sinav.ogrenciSayisi();
        List<DerslikKaydi> secilen = new ArrayList<>();

        for (DerslikKaydi salon : musait) {
            if (kalan <= 0) {
                break;
            }
            secilen.add(salon);
            kalan -= salon.kapasite();
        }

        if (kalan > 0) {
            return null;
        }
        return secilen;
    }

    private Map<Integer, Integer> gozetmenAtamaSayilariYukle() {
        Map<Integer, Integer> map = new HashMap<>();
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT PersonelID AS personelId, COUNT(*) AS cnt FROM Gozetmen_Atamalari GROUP BY PersonelID");
        for (Map<String, Object> row : rows) {
            map.put(((Number) row.get("personelId")).intValue(), ((Number) row.get("cnt")).intValue());
        }
        return map;
    }

    private Integer uygunGozetmenBul(
            SinavKaydi sinav,
            int oturumId,
            int dersBolumId,
            List<PersonelKaydi> tumPersonel,
            Set<String> izinliSet,
            Map<String, Set<Integer>> gozetmenGunlukOturum,
            Set<String> gozetmenSlotMesgul,
            Set<Integer> buSinavdaKullanilanHocalar,
            Map<Integer, Integer> gozetmenToplamAtama) {

        List<PersonelKaydi> adaylar = new ArrayList<>();

        for (PersonelKaydi p : tumPersonel) {
            if (buSinavdaKullanilanHocalar.contains(p.personelId())) {
                continue;
            }
            if (izinliSet.contains(p.personelId() + "|" + sinav.tarih())) {
                continue; // Kural 7
            }
            String slotKey = sinav.tarih() + "|" + oturumId + "|" + p.personelId();
            if (gozetmenSlotMesgul.contains(slotKey)) {
                continue; // Kural 5
            }
            String gunKey = p.personelId() + "|" + sinav.tarih();
            Set<Integer> gunluk = gozetmenGunlukOturum.getOrDefault(gunKey, Collections.emptySet());
            if (!gunluk.contains(oturumId) && gunluk.size() >= 4) {
                continue; // Kural 6
            }
            if (ardisikOturumLimitiAsildi(p.personelId(), sinav.tarih(), oturumId, gozetmenGunlukOturum)) {
                continue; // Kural 9
            }
            adaylar.add(p);
        }

        if (adaylar.isEmpty()) {
            return null;
        }

        // Kural 8: önce kendi bölümü, sonra ortak havuz (diğer bölümler)
        adaylar.sort(Comparator
                .comparingInt((PersonelKaydi p) -> p.bolumId() == dersBolumId ? 0 : 1)
                .thenComparingInt(p -> gozetmenToplamAtama.getOrDefault(p.personelId(), 0)));

        return adaylar.get(0).personelId();
    }

    /**
     * HATA 3 — Kural 9: Arka arkaya en fazla 3 oturum
     * Hedef oturuma eklenirse 4+ ardışık oturum olacaksa true döner.
     * Örn: Atanmış [1,2,3] + hedef 4 → ardışık 4 olur → true (engelle)
     */
    private boolean ardisikOturumLimitiAsildi(
            int personelId,
            String tarih,
            int oturumId,
            Map<String, Set<Integer>> gozetmenGunlukOturum) {

        Set<Integer> oturumlar = new HashSet<>(
                gozetmenGunlukOturum.getOrDefault(personelId + "|" + tarih, new HashSet<>()));
        oturumlar.add(oturumId);

        int ardisikSayisi = 1; // hedef oturum
        int i = oturumId - 1;
        while (oturumlar.contains(i)) {
            ardisikSayisi++;
            i--;
        }
        i = oturumId + 1;
        while (oturumlar.contains(i)) {
            ardisikSayisi++;
            i++;
        }
        return ardisikSayisi >= 4; // DB fonksiyonu ile uyumlu: max 3 ardışık
    }

    private void sinaviKaydet(SinavKaydi sinav, int oturumId, List<SalonAtama> salonAtamalari) {
        jdbcTemplate.update("UPDATE Sinavlar SET OturumID = ? WHERE SinavID = ?", oturumId, sinav.sinavId());

        String insertSalon = """
                DECLARE @T TABLE (ID INT);
                INSERT INTO Sinav_Salonlari (SinavID, DerslikID) OUTPUT INSERTED.AtamaID INTO @T VALUES (?, ?);
                SELECT TOP 1 ID FROM @T;
                """;

        for (SalonAtama atama : salonAtamalari) {
            Integer atamaId = jdbcTemplate.queryForObject(insertSalon, Integer.class, sinav.sinavId(), atama.derslikId());
            jdbcTemplate.update(
                    "INSERT INTO Gozetmen_Atamalari (AtamaID, PersonelID) VALUES (?, ?)",
                    atamaId, atama.personelId());
        }
    }

    private void guncelleBellek(
            SinavKaydi sinav,
            int oturumId,
            List<SalonAtama> salonAtamalari,
            List<DerslikKaydi> salonKombinasyonu,
            Set<String> doluSalonlar,
            Map<String, Set<String>> slotYariyilBolum,
            Map<String, Set<Integer>> gozetmenGunlukOturum,
            Set<String> gozetmenSlotMesgul,
            Map<String, Set<Integer>> yariyilGunlukOturum,
            Map<Integer, Integer> gozetmenToplamAtama) {

        String slotKey = sinav.tarih() + "|" + oturumId;
        slotYariyilBolum.computeIfAbsent(slotKey, k -> new HashSet<>())
                .add(sinav.bolumId() + "-" + sinav.yariyil());

        String ybKey = sinav.tarih() + "|" + sinav.bolumId() + "|" + sinav.yariyil();
        yariyilGunlukOturum.computeIfAbsent(ybKey, k -> new HashSet<>()).add(oturumId);

        for (int i = 0; i < salonKombinasyonu.size(); i++) {
            DerslikKaydi salon = salonKombinasyonu.get(i);
            SalonAtama atama = salonAtamalari.get(i);
            doluSalonlar.add(salonKey(sinav.tarih(), oturumId, salon.derslikId()));

            String gunKey = atama.personelId() + "|" + sinav.tarih();
            gozetmenGunlukOturum.computeIfAbsent(gunKey, k -> new HashSet<>()).add(oturumId);
            gozetmenSlotMesgul.add(sinav.tarih() + "|" + oturumId + "|" + atama.personelId());
            gozetmenToplamAtama.merge(atama.personelId(), 1, (a, b) -> a + b);
        }
    }

    private static String salonKey(String tarih, int oturumId, int derslikId) {
        return tarih + "|" + oturumId + "|" + derslikId;
    }
}
