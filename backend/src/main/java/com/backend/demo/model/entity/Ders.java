package com.backend.demo.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "Dersler")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Ders {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "DersID")
    private Integer dersId;

    @Column(name = "DersKodu", nullable = false, unique = true, length = 20)
    private String dersKodu;

    @Column(name = "DersAdi", nullable = false, length = 100)
    private String dersAdi;

    @Column(name = "DersTuru", nullable = false, length = 20)
    private String dersTuru;

    @Column(name = "OgrenciSayisi", nullable = false)
    private Integer ogrenciSayisi;

    @Column(name = "Yariyil", nullable = false)
    private Integer yariyil;

    // Foreign Key (Bölüm ile ilişki)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "BolumID", nullable = false)
    private Bolum bolum;
}