package com.backend.demo.model.dto;

import lombok.Data;

@Data
public class DerslikRequestDTO {
    private String ad;
    private Integer kapasite;
    private String tip;
    private Integer kat;
    private Boolean aktif;
}