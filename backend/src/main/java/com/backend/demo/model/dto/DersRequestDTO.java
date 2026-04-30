package com.backend.demo.model.dto;

import lombok.Data;

@Data
public class DersRequestDTO {
    private String dersKodu;
    private String dersAdi;
    private String dersTuru;
    private Integer ogrenciSayisi;
    private Integer yariyil;
    private Integer bolumId;
}