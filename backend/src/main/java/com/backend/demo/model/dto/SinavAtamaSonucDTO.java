package com.backend.demo.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SinavAtamaSonucDTO {
    private boolean basarili;
    private String mesaj;
}