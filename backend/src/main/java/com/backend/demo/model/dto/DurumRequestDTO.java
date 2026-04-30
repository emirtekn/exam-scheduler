package com.backend.demo.model.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class DurumRequestDTO {
    private Integer personelId;
    private LocalDate tarih;
    private String mazeretTuru;
}