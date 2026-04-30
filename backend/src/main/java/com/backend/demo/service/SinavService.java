package com.backend.demo.service;

import com.backend.demo.repository.SinavRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class SinavService {

    private final SinavRepository sinavRepository;

    public String akilliAtamaYap(String dersKodu, LocalDate tarih, Integer oturumId) {
        try {
            // Hata veren yer burasıydı. Artık "return" yazmıyoruz, sadece metodu tetikliyoruz.
            sinavRepository.akilliSalonAta(dersKodu, tarih, oturumId);
            
            // Metot başarıyla çalıştıktan sonra kendi metnimizi döndürüyoruz.
            return "Akıllı salon ve gözetmen ataması (Stored Procedure) başarıyla tamamlandı!";
        } catch (Exception e) {
            return "Atama sırasında hata oluştu: " + e.getMessage();
        }
    }
}