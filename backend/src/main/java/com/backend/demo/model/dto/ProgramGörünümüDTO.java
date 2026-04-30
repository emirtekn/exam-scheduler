package com.backend.demo.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDate;

@Data
@AllArgsConstructor
public class ProgramGörünümüDTO {
    private LocalDate tarih;
    private String oturumTanim;
    private String derslikAd;
    private String dersAdi;
    private String dersKodu;
    private String gozetmenAdSoyad;
}