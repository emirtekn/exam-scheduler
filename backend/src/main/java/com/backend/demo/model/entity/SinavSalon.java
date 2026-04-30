package com.backend.demo.model.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "Sinav_Salonlari")
public class SinavSalon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "AtamaID")
    private Integer atamaId;

    @Column(name = "SinavID")
    private Integer sinavId;

    @Column(name = "DerslikID")
    private Integer derslikId;
}