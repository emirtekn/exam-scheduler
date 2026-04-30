package com.backend.demo.model.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalTime;

@Entity
@Table(name = "Oturumlar")
@Data
public class Oturum {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "OturumID")
    private Integer oturumId;

    @Column(name = "Tanim")
    private String tanim; // Örn: Sabah 09:00, Öğle 13:00

    @Column(name = "BaslangicSaat")
    private LocalTime baslangicSaat; // 09:00

    @Column(name = "BitisSaat")
    private LocalTime bitisSaat; // 11:00
}