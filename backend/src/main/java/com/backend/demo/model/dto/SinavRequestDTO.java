package com.backend.demo.model.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.time.LocalDate;

@Data
public class SinavRequestDTO {
    private Integer dersId;
    
    // JAVA'YA TAKVİM FORMATINI AÇIKÇA ÖĞRETİYORUZ!
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate tarih;
    
    private Integer oturumId;
}