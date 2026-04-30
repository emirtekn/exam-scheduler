package com.backend.demo.model.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "Personeller")
@Data
public class Personel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "PersonelID")
    private Integer personelId;

    @Column(name = "Unvan")
    private String unvan;

    @Column(name = "Ad")
    private String ad;

    @Column(name = "Soyad")
    private String soyad;

    // Şimdilik sadece ID'sini tutuyoruz, ilişkisel bağlamayı algoritma kısmında detaylandırırız
    @Column(name = "BolumID")
    private Integer bolumId;
}