package com.backend.demo.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OtomatikDagitimSonucDTO {
    private int basariliSayisi;
    private int atanamayanSayisi;
    private List<String> basariliSinavlar = new ArrayList<>();
    private List<String> atanamayanSinavlar = new ArrayList<>();
    private String ozetMesaj;
}
