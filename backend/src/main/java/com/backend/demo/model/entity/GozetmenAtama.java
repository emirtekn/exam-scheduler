package com.backend.demo.model.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "Gozetmen_Atamalari")
@Data
public class GozetmenAtama {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "GozetmenAtamaID")
    private Integer gozetmenAtamaId;

    @Column(name = "AtamaID") // Sinav_Salonlari tablosundaki ID
    private Integer atamaId;

    @Column(name = "PersonelID") // Personeller tablosundaki ID
    private Integer personelId;
}