package com.backend.demo.model.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "Bolumler")
@Data
public class Bolum {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    // JPA'YA "KAFANA GÖRE ARAMA, TAM OLARAK BolumID SÜTUNUNA BAK" DİYORUZ:
    @Column(name = "BolumID") 
    private Integer bolumId;

    // Eğer veritabanında sütunun adı "BolumAdi" ise böyle yaz, eğer sadece "Ad" ise name = "Ad" yap!
    @Column(name = "BolumAdi") 
    private String bolumAdi;

}