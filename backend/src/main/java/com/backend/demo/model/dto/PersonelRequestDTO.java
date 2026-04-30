package com.backend.demo.model.dto;

import lombok.Data;

@Data
public class PersonelRequestDTO {
    private String unvan;
    private String ad;
    private String soyad;
    private Integer bolumId;
}