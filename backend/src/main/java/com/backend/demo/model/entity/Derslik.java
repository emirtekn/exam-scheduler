package com.backend.demo.model.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "Derslikler")
@Data
public class Derslik {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "DerslikID")
    private Integer derslikId;

    @Column(name = "Ad")
    private String ad;

    @Column(name = "Kapasite")
    private Integer kapasite;

    @Column(name = "Tip")
    private String tip;

    @Column(name = "Kat")
    private Integer kat;

    @Column(name = "Aktif")
    private Boolean aktif; // Senin o efsane vizyonun: Pasife çekme özelliği!
}