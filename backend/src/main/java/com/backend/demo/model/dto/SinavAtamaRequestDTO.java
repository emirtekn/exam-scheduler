package com.backend.demo.model.dto;

import lombok.Data;
import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonFormat;

@Data
public class SinavAtamaRequestDTO {
    private String dersKodu;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate tarih;
    private Integer oturumId;
}