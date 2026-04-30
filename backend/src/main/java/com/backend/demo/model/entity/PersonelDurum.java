package com.backend.demo.model.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "Personel_Durumlari")
@Data
public class PersonelDurum {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "DurumID")
    private Integer durumId;

    @Column(name = "PersonelID")
    private Integer personelId;

    @Column(name = "Tarih")
    private LocalDate tarih;

    @Column(name = "MazeretTuru")
    private String mazeretTuru; // Örn: Raporlu, Görevli, İzinli
}