package com.backend.demo.model.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "Sinavlar")
@Data
public class Sinav {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "SinavID")
    private Integer sinavId;

    @ManyToOne // Hangi ders için olduğunu Foreign Key ile bağlıyoruz
    @JoinColumn(name = "DersID", referencedColumnName = "DersID")
    private Ders ders;

    @Column(name = "Tarih")
    private LocalDate tarih;

    @ManyToOne(optional = true)
    @JoinColumn(name = "OturumID", referencedColumnName = "OturumID", nullable = true)
    private Oturum oturum;
}